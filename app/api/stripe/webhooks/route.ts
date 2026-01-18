import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "No signature" },
      { status: 400 }
    );
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
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const metadata = session.metadata;

        if (metadata?.userId && metadata?.plan && metadata?.apiId) {
          // Create or update subscription
          await prisma.subscription.upsert({
            where: {
              userId_apiId: {
                userId: metadata.userId,
                apiId: metadata.apiId || "",
              },
            },
            update: {
              plan: metadata.plan,
              status: "active",
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              currentPeriodEnd: new Date(
                (session.subscription as any)?.current_period_end * 1000
              ),
            },
            create: {
              userId: metadata.userId,
              apiId: metadata.apiId || "",
              plan: metadata.plan,
              status: "active",
              stripeCustomerId: session.customer as string,
              stripeSubscriptionId: session.subscription as string,
              currentPeriodEnd: new Date(
                (session.subscription as any)?.current_period_end * 1000
              ),
            },
          });
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        // Update subscription in database
        await prisma.subscription.updateMany({
          where: {
            stripeSubscriptionId: subscription.id,
          },
          data: {
            status: subscription.status === "active" ? "active" : "cancelled",
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await prisma.subscription.updateMany({
          where: {
            stripeSubscriptionId: subscription.id,
          },
          data: {
            status: "cancelled",
          },
        });
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        // Create invoice record
        if (invoice.customer) {
          const subscription = await prisma.subscription.findFirst({
            where: {
              stripeCustomerId: invoice.customer as string,
            },
          });

          if (subscription) {
            await prisma.invoice.create({
              data: {
                userId: subscription.userId,
                amount: invoice.amount_paid / 100,
                currency: invoice.currency,
                status: "paid",
                paidAt: new Date(),
                dueDate: new Date(invoice.due_date * 1000),
                items: invoice.lines.data as any,
                stripePdfUrl: invoice.invoice_pdf || null,
                stripeInvoiceId: invoice.id,
              },
            });
          }
        }
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
