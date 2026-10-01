import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/get-session";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  hydrateApiOpenApi,
  isStubOnly,
} from "@/lib/services/openapi-hydrate";

const updateAPISchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  logo: z.string().optional(),
  baseUrl: z.string().url().optional().or(z.literal("")),
  isPublic: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { apiId: string } }
) {
  try {
    const hydrateParam = request.nextUrl.searchParams.get("hydrate");
    let api = await prisma.aPI.findUnique({
      where: { id: params.apiId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
          },
        },
        versions: {
          orderBy: { createdAt: "desc" },
          include: {
            endpoints: true,
          },
        },
        reviews: {
          include: {
            user: {
              select: {
                name: true,
                image: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
    });

    if (!api) {
      return NextResponse.json({ error: "API not found" }, { status: 404 });
    }

    const latest = api.versions[0];
    const needsHydrate =
      Boolean(api.openapiUrl) &&
      (hydrateParam === "1" ||
        hydrateParam === "true" ||
        isStubOnly(latest?.endpoints || []) ||
        api.endpointCount < 2);

    if (needsHydrate && api.openapiUrl) {
      try {
        await hydrateApiOpenApi(api.id);
        api = await prisma.aPI.findUnique({
          where: { id: params.apiId },
          include: {
            user: {
              select: { id: true, name: true, image: true },
            },
            versions: {
              orderBy: { createdAt: "desc" },
              include: { endpoints: true },
            },
            reviews: {
              include: {
                user: { select: { name: true, image: true } },
              },
              orderBy: { createdAt: "desc" },
            },
            _count: { select: { subscriptions: true } },
          },
        });
      } catch (e) {
        console.warn("Lazy hydrate failed:", e);
      }
    }

    if (!api) {
      return NextResponse.json({ error: "API not found" }, { status: 404 });
    }

    const reviews = Array.isArray(api.reviews) ? api.reviews : [];
    const ratings = reviews.map((r) => r.rating);
    const avgRating =
      ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 0;

    // Usage signal for reviews context (request logs for this API's keys)
    const usageCalls = await prisma.requestLog.count({
      where: { apiKey: { apiId: api.id } },
    });

    // Keep source/sourceKey internal for sync — do not expose in the public payload
    const { source: _source, sourceKey: _sourceKey, ...publicApi } = api;

    const sanitizeChangelog = (text: string | null | undefined) => {
      if (!text) return text;
      if (/public-apis|apis\.guru|Synced from|Imported from/i.test(text)) {
        return "Listing updated";
      }
      return text;
    };

    return NextResponse.json({
      ...publicApi,
      tags: (api.tags || []).filter((t) => !t.startsWith("src:")),
      reviews,
      versions: (Array.isArray(api.versions) ? api.versions : []).map((v) => ({
        ...v,
        changelog: sanitizeChangelog(v.changelog),
      })),
      rating: avgRating,
      reviewCount: reviews.length,
      subscriberCount: api._count.subscriptions,
      usageCalls,
    });
  } catch (error) {
    console.error("Error fetching API:", error);
    return NextResponse.json(
      { error: "Failed to fetch API" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { apiId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const api = await prisma.aPI.findUnique({
      where: { id: params.apiId },
    });

    if (!api) {
      return NextResponse.json({ error: "API not found" }, { status: 404 });
    }

    if (api.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validated = updateAPISchema.parse(body);

    const updated = await prisma.aPI.update({
      where: { id: params.apiId },
      data: validated,
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating API:", error);
    return NextResponse.json(
      { error: "Failed to update API" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { apiId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const api = await prisma.aPI.findUnique({
      where: { id: params.apiId },
    });

    if (!api) {
      return NextResponse.json({ error: "API not found" }, { status: 404 });
    }

    if (api.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.aPI.delete({
      where: { id: params.apiId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting API:", error);
    return NextResponse.json(
      { error: "Failed to delete API" },
      { status: 500 }
    );
  }
}
