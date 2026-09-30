import { NextRequest, NextResponse } from "next/server";
import { processWebhookQueue } from "@/lib/services/webhook-delivery";

/**
 * Process webhook queue - should be called by cron job every minute
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const apiId = searchParams.get("apiId") || undefined;

    await processWebhookQueue(apiId);

    return NextResponse.json({
      success: true,
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error processing webhook queue:", error);
    return NextResponse.json(
      { error: "Failed to process webhook queue" },
      { status: 500 }
    );
  }
}
