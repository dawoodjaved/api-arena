"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function UsagePage() {
  const { data: session } = useSession();
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/usage")
      .then((r) => r.json())
      .then(setUsage)
      .catch(() => setUsage(null))
      .finally(() => setLoading(false));
  }, []);

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
        <Link href="/auth/signin" className="text-[#4F7FFF]">
          Sign in
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center text-gray-400">
        Loading…
      </div>
    );
  }

  const daily = usage?.daily || [];
  const endpoints = usage?.endpoints || [];

  return (
    <div className="min-h-screen bg-[#0A0E1A]">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-white mb-8">Usage Analytics</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Requests", value: usage?.totalRequests ?? 0 },
            { label: "Success Rate", value: `${usage?.successRate ?? 0}%` },
            { label: "Avg Latency", value: `${usage?.avgLatency ?? 0}ms` },
            { label: "Errors", value: usage?.errorRequests ?? 0 },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-xl p-5 bg-[#151B2B] border border-[rgba(255,255,255,0.05)]"
            >
              <p className="text-xs text-gray-400 uppercase mb-2">{card.label}</p>
              <p className="text-3xl font-bold text-white">{card.value}</p>
            </div>
          ))}
        </div>

        {daily.length === 0 || daily.every((d: any) => d.requests === 0) ? (
          <div className="rounded-2xl p-10 text-center bg-[#151B2B] border border-[rgba(255,255,255,0.05)] text-gray-400 mb-8">
            No request logs yet. Use the{" "}
            <Link href="/dashboard/playground" className="text-[#4F7FFF]">
              playground
            </Link>{" "}
            with an API key to generate usage data.
          </div>
        ) : (
          <>
            <div className="rounded-2xl p-6 bg-[#151B2B] border border-[rgba(255,255,255,0.05)] mb-8">
              <h2 className="text-lg font-semibold text-white mb-4">
                Requests (30 days)
              </h2>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="date" stroke="#666" fontSize={12} />
                  <YAxis stroke="#666" fontSize={12} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="requests"
                    stroke="#4F7FFF"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="errors"
                    stroke="#EF4444"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {endpoints.length > 0 && (
              <div className="rounded-2xl p-6 bg-[#151B2B] border border-[rgba(255,255,255,0.05)]">
                <h2 className="text-lg font-semibold text-white mb-4">
                  Top endpoints
                </h2>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={endpoints}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                    <XAxis dataKey="endpoint" stroke="#666" fontSize={10} />
                    <YAxis stroke="#666" fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="requests" fill="#4F7FFF" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
