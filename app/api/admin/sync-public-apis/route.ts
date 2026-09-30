import { NextRequest, NextResponse } from "next/server";
import {
  importPublicAPIs,
  importFromAPIsGuru,
} from "@/lib/services/public-apis";

type SyncSource = "github" | "guru" | "all";

export async function POST(request: NextRequest) {
  try {
    // For development, allow without admin check
    // In production, uncomment the admin check below
    /*
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any)?.role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 403 }
      );
    }
    */

    const body = await request.json().catch(() => ({}));
    const limit = Math.min(Math.max(Number(body.limit) || 50, 1), 500);
    const rawSource = (body.source ?? "github") as string;
    const source: SyncSource =
      rawSource === "guru" || rawSource === "all" ? rawSource : "github";

    let imported = 0;
    let skipped = 0;
    let errors = 0;
    const details: Record<string, { imported: number; skipped: number; errors: number }> = {};

    if (source === "github" || source === "all") {
      const r = await importPublicAPIs(undefined, limit);
      imported += r.imported;
      skipped += r.skipped;
      errors += r.errors;
      details.github = r;
    }

    if (source === "guru" || source === "all") {
      const r = await importFromAPIsGuru(undefined, limit);
      imported += r.imported;
      skipped += r.skipped;
      errors += r.errors;
      details.guru = r;
    }

    return NextResponse.json({
      message: "Public APIs synced successfully",
      source,
      imported,
      skipped,
      errors,
      ...(Object.keys(details).length > 1 ? { details } : {}),
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
