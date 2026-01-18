import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { stripe, PLANS } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { plan, apiId } = body;

    if (!plan || !["pro", "enterprise"].includes(plan)) {
      return NextResponse.json(
        { error: "Invalid plan" },
        { status: 400 }
      );
    }

    if (plan === "enterprise") {
      return NextResponse.json(
        { error: "Please contact sales for enterprise plans" },
        { status: 400 }
      );
    }

    // Get or create Stripe customer
    let user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    let customerId: string;

    if (user && (user as any).stripeCustomerId) {
      customerId = (user as any).stripeCustomerId;
    } else {
      const customer = await stripe.customers.create({
        email: session.user.email || undefined,
        metadata: {
          userId: session.user.id,
        },
      });

      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          // Store in a JSON field or extend schema
        },
      });

      customerId = customer.id;
    }

    // Create checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${PLANS[plan as keyof typeof PLANS].name} Plan`,
            },
            recurring: {
              interval: "month",
            },
            unit_amount: PLANS[plan as keyof typeof PLANS].price * 100,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXTAUTH_URL}/dashboard/billing?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/billing?canceled=true`,
      metadata: {
        userId: session.user.id,
        plan,
        apiId: apiId || "",
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
