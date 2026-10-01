import { NextRequest, NextResponse } from "next/server";
import { importPublicAPIs } from "@/lib/services/catalog-import";

/** Admin: import APIs from the configured directory feed. */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const limit = body.limit || 100;

    const result = await importPublicAPIs(undefined, limit);

    return NextResponse.json({
      message: "APIs imported successfully",
      ...result,
    });
  } catch (error) {
    console.error("Error importing APIs:", error);
    return NextResponse.json(
      {
        error: "Failed to import APIs",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
