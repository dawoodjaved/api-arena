import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ""
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata;
        const customerId = session.customer as string;

        if (metadata?.userId && customerId) {
          await prisma.user.update({
            where: { id: metadata.userId },
            data: { stripeCustomerId: customerId },
          });
        }

        if (metadata?.userId && metadata?.plan) {
          const apiId = metadata.apiId || "";
          if (!apiId) break;

          let periodEnd = new Date();
          periodEnd.setMonth(periodEnd.getMonth() + 1);

          if (session.subscription) {
            try {
              const sub = await stripe.subscriptions.retrieve(
                session.subscription as string
              );
              const periodEndUnix =
                (sub as any).current_period_end ||
                Math.floor(Date.now() / 1000) + 30 * 24 * 3600;
              periodEnd = new Date(periodEndUnix * 1000);
            } catch {
              // keep default period end
            }
          }

          await prisma.subscription.upsert({
            where: {
              userId_apiId: {
                userId: metadata.userId,
                apiId,
              },
            },
            update: {
              plan: metadata.plan,
              status: "active",
              stripeCustomerId: customerId,
              stripeSubscriptionId: (session.subscription as string) || null,
              currentPeriodEnd: periodEnd,
            },
            create: {
              userId: metadata.userId,
              apiId,
              plan: metadata.plan,
              status: "active",
              stripeCustomerId: customerId,
              stripeSubscriptionId: (session.subscription as string) || null,
              currentPeriodEnd: periodEnd,
            },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status: subscription.status === "active" ? "active" : "cancelled",
            currentPeriodEnd: new Date(
              ((subscription as any).current_period_end || 0) * 1000
            ),
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await prisma.subscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: { status: "cancelled" },
        });
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        if (!invoice.customer) break;

        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: invoice.customer as string },
        });
        if (!user) break;

        await prisma.invoice.create({
          data: {
            userId: user.id,
            amount: (invoice.amount_paid || 0) / 100,
            currency: invoice.currency || "usd",
            status: "paid",
            paidAt: new Date(),
            dueDate: invoice.due_date
              ? new Date(invoice.due_date * 1000)
              : new Date(),
            items: (invoice.lines?.data as any) || [],
            stripePdfUrl: invoice.invoice_pdf || null,
            stripeInvoiceId: invoice.id,
          },
        });
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
