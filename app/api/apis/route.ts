import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/get-session";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { z } from "zod";

const createAPISchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  logo: z.string().optional(),
  isPublic: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  try {
    // Session is optional for public API listing
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const featured = searchParams.get("featured") === "true";
    const auth = searchParams.get("auth");
    const openapi = searchParams.get("openapi");
    const cors = searchParams.get("cors");
    const tryReady = searchParams.get("tryReady") === "true";
    const minScore = Number(searchParams.get("minScore") || "0");
    const sort = searchParams.get("sort") || "score"; // score | newest | name
    const take = Math.min(Number(searchParams.get("limit") || "100") || 100, 500);

    const where: any = {
      isPublic: true,
      isApproved: true,
    };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { tags: { has: search.toLowerCase() } },
      ];
    }

    if (featured) {
      where.isFeatured = true;
    }

    if (auth) {
      where.authType = auth;
    }

    if (openapi === "true") {
      where.hasOpenApi = true;
    }

    if (tryReady) {
      where.tryReady = true;
    }

    if (cors) {
      where.cors = cors;
    }

    if (minScore > 0) {
      where.arenaScore = { gte: minScore };
    }

    const orderBy =
      sort === "name"
        ? { name: "asc" as const }
        : sort === "newest"
          ? { createdAt: "desc" as const }
          : [{ arenaScore: "desc" as const }, { createdAt: "desc" as const }];

    const apis = await prisma.aPI.findMany({
      where,
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
        },
        reviews: {
          select: {
            rating: true,
          },
        },
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
      orderBy,
      take,
    });

    const apisWithStats = apis.map((api) => {
      const ratings = api.reviews.map((r) => r.rating);
      const avgRating =
        ratings.length > 0
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length
          : 0;

      const { source: _s, sourceKey: _sk, ...rest } = api;
      return {
        ...rest,
        // Hide internal sync tags from the product UI
        tags: (api.tags || []).filter((t) => !t.startsWith("src:")),
        rating: avgRating,
        reviewCount: api.reviews.length,
        subscriberCount: api._count.subscriptions,
      };
    });

    return NextResponse.json(apisWithStats);
  } catch (error) {
    console.error("Error fetching APIs:", error);
    // Always return an array, even on error
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = createAPISchema.parse(body);

    const slug = slugify(validated.name);

    // Check if slug already exists
    const existing = await prisma.aPI.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: "API with this name already exists" },
        { status: 400 }
      );
    }

    const api = await prisma.aPI.create({
      data: {
        ...validated,
        slug,
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(api, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating API:", error);
    return NextResponse.json(
      { error: "Failed to create API" },
      { status: 500 }
    );
  }
}
