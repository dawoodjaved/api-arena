import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const compareSchema = z.object({
  apiIds: z.array(z.string()).min(2).max(3),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = compareSchema.parse(body);

    // Fetch all APIs
    const apis = await prisma.aPI.findMany({
      where: {
        id: { in: validated.apiIds },
        isPublic: true,
        isApproved: true,
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
        versions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            endpoints: true,
          },
        },
        reviews: {
          select: {
            rating: true,
            comment: true,
          },
        },
        _count: {
          select: {
            subscriptions: true,
            reviews: true,
          },
        },
      },
    });

    if (apis.length !== validated.apiIds.length) {
      return NextResponse.json(
        { error: "Some APIs not found" },
        { status: 404 }
      );
    }

    const comparison = await Promise.all(
      apis.map(async (api) => {
        const ratings = api.reviews.map((r) => r.rating);
        const avgRating =
          ratings.length > 0
            ? ratings.reduce((a, b) => a + b, 0) / ratings.length
            : 0;

        const latestVersion = api.versions[0];
        const endpointCount =
          api.endpointCount || latestVersion?.endpoints.length || 0;
        const usageCalls = await prisma.requestLog.count({
          where: { apiKey: { apiId: api.id } },
        });

        return {
          id: api.id,
          name: api.name,
          slug: api.slug,
          description: api.description,
          category: api.category,
          logo: api.logo,
          provider: api.user,
          rating: avgRating,
          avgRating,
          reviewCount: api.reviews.length,
          subscriptionCount: api._count.subscriptions,
          subscriberCount: api._count.subscriptions,
          endpointCount,
          arenaScore: api.arenaScore,
          tryReady: api.tryReady,
          hasOpenApi: api.hasOpenApi,
          authType: api.authType,
          https: api.https,
          usageCalls,
          latestVersion: latestVersion?.version || "N/A",
          isFeatured: api.isFeatured,
          createdAt: api.createdAt,
          updatedAt: api.updatedAt,
        };
      })
    );

    return NextResponse.json({
      comparison,
      comparedAt: new Date().toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error comparing APIs:", error);
    return NextResponse.json(
      { error: "Failed to compare APIs" },
      { status: 500 }
    );
  }
}
