import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const q = searchParams.get("q") || "";
    const category = searchParams.get("category");
    const minRating = searchParams.get("minRating");
    const pricing = searchParams.get("pricing"); // free, paid, freemium
    const sort = searchParams.get("sort") || "relevance"; // relevance, rating, newest, popular
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = parseInt(searchParams.get("offset") || "0");

    const where: any = {
      isPublic: true,
      isApproved: true,
    };

    // Category filter
    if (category) {
      where.category = category;
    }

    // Search query
    if (q) {
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ];
    }

    // Get APIs with reviews for rating calculation
    const apis = await prisma.aPI.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            image: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
        _count: {
          select: {
            subscriptions: true,
            reviews: true,
          },
        },
      },
      take: limit * 2, // Get more to filter by rating
      skip: 0,
    });

    // Calculate ratings and filter
    let filteredApis = apis.map((api) => {
      const ratings = api.reviews.map((r) => r.rating);
      const avgRating =
        ratings.length > 0
          ? ratings.reduce((a, b) => a + b, 0) / ratings.length
          : 0;

      return {
        ...api,
        avgRating,
        reviewCount: api.reviews.length,
        subscriptionCount: api._count.subscriptions,
      };
    });

    // Filter by minimum rating
    if (minRating) {
      const min = parseFloat(minRating);
      filteredApis = filteredApis.filter((api) => api.avgRating >= min);
    }

    // Sort
    if (sort === "rating") {
      filteredApis.sort((a, b) => b.avgRating - a.avgRating);
    } else if (sort === "newest") {
      filteredApis.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (sort === "popular") {
      filteredApis.sort(
        (a, b) => b.subscriptionCount - a.subscriptionCount
      );
    } else {
      // Relevance (default) - simple text matching score
      if (q) {
        filteredApis.sort((a, b) => {
          const aScore =
            (a.name.toLowerCase().includes(q.toLowerCase()) ? 2 : 0) +
            (a.description.toLowerCase().includes(q.toLowerCase()) ? 1 : 0);
          const bScore =
            (b.name.toLowerCase().includes(q.toLowerCase()) ? 2 : 0) +
            (b.description.toLowerCase().includes(q.toLowerCase()) ? 1 : 0);
          return bScore - aScore;
        });
      }
    }

    // Apply pagination
    const paginatedApis = filteredApis.slice(offset, offset + limit);

    // Remove internal fields
    const results = paginatedApis.map((api) => {
      const { _count, reviews, ...rest } = api;
      return rest;
    });

    return NextResponse.json({
      results,
      total: filteredApis.length,
      limit,
      offset,
      hasMore: offset + limit < filteredApis.length,
    });
  } catch (error) {
    console.error("Error searching APIs:", error);
    return NextResponse.json(
      { error: "Failed to search APIs" },
      { status: 500 }
    );
  }
}
