import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/get-session";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const apiKeys = await prisma.aPIKey.findMany({
      where: { userId: session.user.id },
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
      orderBy: { timestamp: "asc" },
    });

    const totalRequests = logs.length;
    const successRequests = logs.filter((l) => l.statusCode < 400).length;
    const errorRequests = totalRequests - successRequests;
    const successRate =
      totalRequests > 0 ? (successRequests / totalRequests) * 100 : 0;
    const errorRate =
      totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;
    const avgLatency =
      logs.length > 0
        ? logs.reduce((sum, l) => sum + l.latency, 0) / logs.length
        : 0;

    // Daily series
    const dailyMap = new Map<string, { requests: number; errors: number }>();
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dailyMap.set(key, { requests: 0, errors: 0 });
    }
    for (const log of logs) {
      const key = log.timestamp.toISOString().slice(0, 10);
      const entry = dailyMap.get(key);
      if (entry) {
        entry.requests += 1;
        if (log.statusCode >= 400) entry.errors += 1;
      }
    }
    const daily = Array.from(dailyMap.entries()).map(([date, v]) => ({
      date: date.slice(5),
      requests: v.requests,
      errors: v.errors,
    }));

    // Endpoint breakdown
    const endpointMap = new Map<
      string,
      { requests: number; totalLatency: number }
    >();
    for (const log of logs) {
      const label = `${log.endpoint?.method || log.method} ${log.endpoint?.path || log.path}`;
      const entry = endpointMap.get(label) || { requests: 0, totalLatency: 0 };
      entry.requests += 1;
      entry.totalLatency += log.latency;
      endpointMap.set(label, entry);
    }
    const endpoints = Array.from(endpointMap.entries())
      .map(([endpoint, v]) => ({
        endpoint,
        requests: v.requests,
        avgLatency: Math.round(v.totalLatency / v.requests),
      }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 10);

    return NextResponse.json({
      totalRequests,
      successRequests,
      errorRequests,
      successRate: Number(successRate.toFixed(2)),
      errorRate: Number(errorRate.toFixed(2)),
      avgLatency: Math.round(avgLatency),
      daily,
      endpoints,
    });
  } catch (error) {
    console.error("Error fetching usage:", error);
    return NextResponse.json(
      { error: "Failed to fetch usage" },
      { status: 500 }
    );
  }
}
