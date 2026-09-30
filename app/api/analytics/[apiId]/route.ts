import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/get-session";
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

    if (api.userId !== session.user.id && (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
      include: {
        endpoint: { select: { path: true, method: true } },
      },
    });

    const totalRequests = logs.length;
    const successRequests = logs.filter((l) => l.statusCode < 400).length;
    const errorRequests = totalRequests - successRequests;
    const successRate =
      totalRequests > 0 ? (successRequests / totalRequests) * 100 : 0;
    const avgLatency =
      logs.length > 0
        ? logs.reduce((sum, l) => sum + l.latency, 0) / logs.length
        : 0;

    const dailyMap = new Map<string, number>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dailyMap.set(d.toISOString().slice(0, 10), 0);
    }
    for (const log of logs) {
      const key = log.timestamp.toISOString().slice(0, 10);
      if (dailyMap.has(key)) dailyMap.set(key, (dailyMap.get(key) || 0) + 1);
    }
    const daily = Array.from(dailyMap.entries()).map(([date, requests]) => ({
      date: date.slice(5),
      requests,
    }));

    const endpointMap = new Map<string, number>();
    for (const log of logs) {
      const label = `${log.endpoint?.method || log.method} ${log.endpoint?.path || log.path}`;
      endpointMap.set(label, (endpointMap.get(label) || 0) + 1);
    }
    const endpoints = Array.from(endpointMap.entries())
      .map(([endpoint, requests]) => ({ endpoint, requests }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 8);

    const statusCodeData = [
      { name: "2xx", value: logs.filter((l) => l.statusCode >= 200 && l.statusCode < 300).length },
      { name: "4xx", value: logs.filter((l) => l.statusCode >= 400 && l.statusCode < 500).length },
      { name: "5xx", value: logs.filter((l) => l.statusCode >= 500).length },
    ];

    const subscriptions = await prisma.subscription.findMany({
      where: { apiId: params.apiId, status: "active" },
    });
    const revenue = subscriptions.reduce(
      (sum, sub) => (sub.plan === "pro" ? sum + 49 : sum),
      0
    );

    return NextResponse.json({
      totalRequests,
      successRequests,
      errorRequests,
      successRate: Number(successRate.toFixed(2)),
      avgLatency: Math.round(avgLatency),
      revenue,
      daily,
      endpoints,
      statusCodeData,
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
