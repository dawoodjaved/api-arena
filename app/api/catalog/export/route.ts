import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Public catalog export for marketplace consumers.
 * Caps at 500 by default; use ?limit=&minScore=&tryReady=true
 */
export async function GET(request: NextRequest) {
  try {
    const sp = request.nextUrl.searchParams;
    const limit = Math.min(Number(sp.get("limit") || "200") || 200, 500);
    const minScore = Number(sp.get("minScore") || "0") || 0;
    const tryReady = sp.get("tryReady") === "true";
    const openapi = sp.get("openapi") === "true";

    const where: any = {
      isPublic: true,
      isApproved: true,
    };
    if (minScore > 0) where.arenaScore = { gte: minScore };
    if (tryReady) where.tryReady = true;
    if (openapi) where.hasOpenApi = true;

    const apis = await prisma.aPI.findMany({
      where,
      select: {
        slug: true,
        name: true,
        description: true,
        category: true,
        authType: true,
        https: true,
        cors: true,
        docsUrl: true,
        openapiUrl: true,
        hasOpenApi: true,
        tryReady: true,
        endpointCount: true,
        arenaScore: true,
        tags: true,
        baseUrl: true,
        lastSyncedAt: true,
      },
      orderBy: [{ arenaScore: "desc" }, { name: "asc" }],
      take: limit,
    });

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      count: apis.length,
      note: "Endpointly Score ranks developer readiness (HTTPS, auth, CORS, OpenAPI).",
      apis: apis.map((a) => ({
        ...a,
        tags: (a.tags || []).filter((t) => !t.startsWith("src:")),
      })),
    });
  } catch (error) {
    console.error("catalog export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
