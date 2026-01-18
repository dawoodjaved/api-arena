import { NextRequest, NextResponse } from "next/server";
import { importPublicAPIs } from "@/lib/services/public-apis";

/**
 * Cron job endpoint to sync public APIs
 * Can be called by Vercel Cron, GitHub Actions, or any cron service
 * 
 * To use with Vercel Cron, add to vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/sync-apis",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (optional but recommended)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const limit = 100; // Sync up to 100 APIs per run
    const result = await importPublicAPIs(undefined, limit);

    return NextResponse.json({
      message: "Public APIs synced successfully",
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error) {
    console.error("Error in cron sync:", error);
    return NextResponse.json(
      {
        error: "Failed to sync public APIs",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
