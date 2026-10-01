import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { importPublicAPIs } from "@/lib/services/catalog-import";

/**
 * Clear system-owned sample APIs and import a fresh catalog batch.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const limit = body.limit || 100;

    // Find system user
    const systemUser = await prisma.user.findFirst({
      where: { email: "system@apiarena.com" },
    });

    if (!systemUser) {
      return NextResponse.json(
        { error: "System user not found" },
        { status: 404 }
      );
    }

    // Delete all APIs created by system user (sample APIs)
    const deleteResult = await prisma.aPI.deleteMany({
      where: {
        userId: systemUser.id,
      },
    });

    console.log(`Deleted ${deleteResult.count} old APIs`);

    // Import fresh catalog APIs
    const importResult = await importPublicAPIs(systemUser.id, limit);

    return NextResponse.json({
      message: "APIs cleared and imported successfully",
      deleted: deleteResult.count,
      ...importResult,
    });
  } catch (error) {
    console.error("Error clearing and importing APIs:", error);
    return NextResponse.json(
      {
        error: "Failed to clear and import APIs",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
