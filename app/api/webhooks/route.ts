import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/get-session";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { queueWebhook } from "@/lib/services/webhook-delivery";
import { z } from "zod";

const createWebhookSchema = z.object({
  apiId: z.string(),
  url: z.string().url(),
  eventTypes: z.array(z.string()),
  secret: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const apiId = searchParams.get("apiId");

    const where: any = { userId: session.user.id };
    if (apiId) where.apiId = apiId;

    // In production, create a Webhook model
    // For now, return empty array
    return NextResponse.json([]);
  } catch (error) {
    console.error("Error fetching webhooks:", error);
    return NextResponse.json(
      { error: "Failed to fetch webhooks" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = createWebhookSchema.parse(body);

    // Verify API ownership
    const api = await prisma.aPI.findUnique({
      where: { id: validated.apiId },
    });

    if (!api) {
      return NextResponse.json({ error: "API not found" }, { status: 404 });
    }

    if (api.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // In production, create Webhook model
    // For now, return success
    return NextResponse.json(
      {
        id: `webhook_${Date.now()}`,
        apiId: validated.apiId,
        url: validated.url,
        eventTypes: validated.eventTypes,
        createdAt: new Date().toISOString(),
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating webhook:", error);
    return NextResponse.json(
      { error: "Failed to create webhook" },
      { status: 500 }
    );
  }
}

/**
 * Trigger webhook manually (for testing)
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { webhookId, eventType, payload } = body;

    // Queue webhook for delivery
    await queueWebhook({
      id: `event_${Date.now()}`,
      apiId: body.apiId,
      eventType: eventType || "test",
      payload: payload || { test: true },
      url: body.url,
      secret: body.secret,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error triggering webhook:", error);
    return NextResponse.json(
      { error: "Failed to trigger webhook" },
      { status: 500 }
    );
  }
}
