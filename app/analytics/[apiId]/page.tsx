"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#10b981", "#f59e0b", "#ef4444"];

export default function AnalyticsPage() {
  const params = useParams();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params.apiId) return;
    fetch(`/api/analytics/${params.apiId}`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Failed");
        setAnalytics(data);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [params.apiId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center text-gray-400">
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Link href="/dashboard" className="text-[#4F7FFF]">
            Back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0E1A]">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-white mb-8">API Analytics</h1>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Requests", value: analytics?.totalRequests ?? 0 },
            { label: "Success rate", value: `${analytics?.successRate ?? 0}%` },
            { label: "Avg latency", value: `${analytics?.avgLatency ?? 0}ms` },
            { label: "MRR (est.)", value: `$${analytics?.revenue ?? 0}` },
          ].map((c) => (
            <div
              key={c.label}
              className="rounded-xl p-5 bg-[#151B2B] border border-[rgba(255,255,255,0.05)]"
            >
              <p className="text-xs text-gray-400 uppercase mb-2">{c.label}</p>
              <p className="text-3xl font-bold text-white">{c.value}</p>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl p-6 bg-[#151B2B] border border-[rgba(255,255,255,0.05)]">
            <h2 className="text-white font-semibold mb-4">Requests over time</h2>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={analytics?.daily || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="date" stroke="#666" fontSize={11} />
                <YAxis stroke="#666" fontSize={11} />
                <Tooltip />
                <Line type="monotone" dataKey="requests" stroke="#4F7FFF" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-2xl p-6 bg-[#151B2B] border border-[rgba(255,255,255,0.05)]">
            <h2 className="text-white font-semibold mb-4">Status codes</h2>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={analytics?.statusCodeData || []}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
                  {(analytics?.statusCodeData || []).map((_: any, i: number) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="md:col-span-2 rounded-2xl p-6 bg-[#151B2B] border border-[rgba(255,255,255,0.05)]">
            <h2 className="text-white font-semibold mb-4">Top endpoints</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={analytics?.endpoints || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                <XAxis dataKey="endpoint" stroke="#666" fontSize={10} />
                <YAxis stroke="#666" fontSize={11} />
                <Tooltip />
                <Bar dataKey="requests" fill="#4F7FFF" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
