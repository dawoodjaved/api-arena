import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/get-session";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { z } from "zod";

const createPayoutSchema = z.object({
  providerId: z.string(),
  amount: z.number().min(0.01),
  period: z.string(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const providerId = searchParams.get("providerId");
    const status = searchParams.get("status");

    const where: any = {};
    if (providerId) {
      where.providerId = providerId;
      // Users can only see their own payouts
      if (providerId !== session.user.id && session.user.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (session.user.role !== "admin") {
      // Non-admins can only see their own payouts
      where.providerId = session.user.id;
    }
    if (status) where.status = status;

    const payouts = await prisma.payout.findMany({
      where,
      include: {
        provider: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(payouts);
  } catch (error) {
    console.error("Error fetching payouts:", error);
    return NextResponse.json(
      { error: "Failed to fetch payouts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = createPayoutSchema.parse(body);

    // Verify provider exists
    const provider = await prisma.user.findUnique({
      where: { id: validated.providerId },
    });

    if (!provider || provider.role !== "provider") {
      return NextResponse.json(
        { error: "Provider not found" },
        { status: 404 }
      );
    }

    // Create payout in database
    const payout = await prisma.payout.create({
      data: {
        providerId: validated.providerId,
        amount: validated.amount,
        period: validated.period,
        status: "pending",
      },
    });

    // Process payout via Stripe (if provider has Stripe account)
    try {
      // In production, get provider's Stripe account ID
      // For now, we'll create a transfer
      const transfer = await stripe.transfers.create({
        amount: Math.round(validated.amount * 100), // Convert to cents
        currency: "usd",
        destination: provider.id, // In production, use provider's Stripe account ID
        metadata: {
          payoutId: payout.id,
          period: validated.period,
        },
      });

      // Update payout with Stripe transfer ID
      await prisma.payout.update({
        where: { id: payout.id },
        data: {
          stripePayoutId: transfer.id,
          status: "processing",
        },
      });
    } catch (stripeError) {
      console.error("Stripe payout error:", stripeError);
      // Payout remains in pending status
    }

    return NextResponse.json(payout, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating payout:", error);
    return NextResponse.json(
      { error: "Failed to create payout" },
      { status: 500 }
    );
  }
}
