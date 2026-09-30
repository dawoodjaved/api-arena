import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Generate analytics snapshots for all APIs
 * This should be called by a cron job daily
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all APIs
    const apis = await prisma.aPI.findMany({
      where: { isApproved: true },
      include: {
        versions: {
          include: {
            endpoints: {
              include: {
                requestLogs: {
                  where: {
                    timestamp: {
                      gte: today,
                      lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const snapshots = [];

    for (const api of apis) {
      // Collect all request logs for today
      const allLogs: any[] = [];
      for (const version of api.versions) {
        for (const endpoint of version.endpoints) {
          allLogs.push(...endpoint.requestLogs);
        }
      }

      if (allLogs.length === 0) {
        continue; // Skip APIs with no requests today
      }

      // Calculate metrics
      const totalRequests = allLogs.length;
      const successRequests = allLogs.filter(
        (log) => log.statusCode >= 200 && log.statusCode < 300
      ).length;
      const errorRequests = totalRequests - successRequests;

      const latencies = allLogs.map((log) => log.latency).filter(Boolean);
      const avgLatency =
        latencies.length > 0
          ? latencies.reduce((a, b) => a + b, 0) / latencies.length
          : 0;

      // Calculate percentiles
      const sortedLatencies = [...latencies].sort((a, b) => a - b);
      const p95Index = Math.floor(sortedLatencies.length * 0.95);
      const p99Index = Math.floor(sortedLatencies.length * 0.99);
      const p95Latency = sortedLatencies[p95Index] || 0;
      const p99Latency = sortedLatencies[p99Index] || 0;

      // Count unique users
      const uniqueUsers = new Set(
        allLogs
          .map((log) => log.apiKeyId)
          .filter(Boolean)
      ).size;

      // Top endpoints
      const endpointCounts: Record<string, number> = {};
      for (const version of api.versions) {
        for (const endpoint of version.endpoints) {
          const key = `${endpoint.method} ${endpoint.path}`;
          endpointCounts[key] = (endpointCounts[key] || 0) + endpoint.requestLogs.length;
        }
      }
      const topEndpoints = Object.entries(endpointCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([endpoint, count]) => ({ endpoint, count }));

      // Top countries (simplified - would need IP geolocation in production)
      const topCountries: any[] = [];

      // Calculate revenue (simplified - would need subscription data)
      const revenue = 0; // TODO: Calculate from subscriptions

      // Create or update snapshot
      const snapshot = await prisma.analyticsSnapshot.upsert({
        where: {
          apiId_date: {
            apiId: api.id,
            date: today,
          },
        },
        update: {
          totalRequests,
          successRequests,
          errorRequests,
          avgLatency,
          p95Latency,
          p99Latency,
          uniqueUsers,
          revenue,
          topEndpoints: topEndpoints as any,
          topCountries: topCountries as any,
        },
        create: {
          apiId: api.id,
          date: today,
          totalRequests,
          successRequests,
          errorRequests,
          avgLatency,
          p95Latency,
          p99Latency,
          uniqueUsers,
          revenue,
          topEndpoints: topEndpoints as any,
          topCountries: topCountries as any,
        },
      });

      snapshots.push(snapshot);
    }

    return NextResponse.json({
      success: true,
      snapshotsGenerated: snapshots.length,
      date: today.toISOString(),
    });
  } catch (error) {
    console.error("Error generating analytics snapshots:", error);
    return NextResponse.json(
      { error: "Failed to generate snapshots" },
      { status: 500 }
    );
  }
}
