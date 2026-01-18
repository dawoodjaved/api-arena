import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
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

    // Check if user owns the API
    if (api.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get request logs for this API
    const apiKeys = await prisma.aPIKey.findMany({
      where: { apiId: params.apiId },
      select: { id: true },
    });

    const keyIds = apiKeys.map((k) => k.id);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const logs = await prisma.requestLog.findMany({
      where: {
        apiKeyId: { in: keyIds },
        timestamp: { gte: thirtyDaysAgo },
      },
    });

    const totalRequests = logs.length;
    const successRequests = logs.filter((l) => l.statusCode < 400).length;
    const errorRequests = totalRequests - successRequests;
    const successRate = totalRequests > 0 ? (successRequests / totalRequests) * 100 : 0;
    const avgLatency =
      logs.length > 0
        ? logs.reduce((sum, l) => sum + l.latency, 0) / logs.length
        : 0;

    // Calculate revenue from subscriptions
    const subscriptions = await prisma.subscription.findMany({
      where: {
        apiId: params.apiId,
        status: "active",
      },
    });

    const revenue = subscriptions.reduce((sum, sub) => {
      if (sub.plan === "pro") return sum + 49;
      return sum;
    }, 0);

    return NextResponse.json({
      totalRequests,
      successRequests,
      errorRequests,
      successRate: successRate.toFixed(2),
      avgLatency: Math.round(avgLatency),
      revenue,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
