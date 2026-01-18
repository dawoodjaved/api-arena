import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { importPublicAPIs } from "@/lib/services/public-apis";

export async function POST(request: NextRequest) {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any)?.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const limit = body.limit || 50; // Default to 50 APIs per sync

    const result = await importPublicAPIs(
      session.user.id,
      limit
    );

    return NextResponse.json({
      message: "Public APIs synced successfully",
      ...result,
    });
  } catch (error) {
    console.error("Error syncing public APIs:", error);
    return NextResponse.json(
      {
        error: "Failed to sync public APIs",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
