import { NextRequest, NextResponse } from "next/server";
import { importPublicAPIs } from "@/lib/services/public-apis";

/**
 * Fetch and import real-world APIs from publicapis.org
 * This endpoint fetches from https://api.publicapis.org/entries and populates the marketplace
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const limit = body.limit || 100; // Default to 100 APIs

    // Import real APIs from publicapis.org
    // The importPublicAPIs function will create the system user if needed
    const result = await importPublicAPIs(undefined, limit);

    return NextResponse.json({
      message: "Real-world APIs imported successfully from publicapis.org",
      ...result,
    });
  } catch (error) {
    console.error("Error importing APIs from publicapis.org:", error);
    return NextResponse.json(
      {
        error: "Failed to import APIs",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
