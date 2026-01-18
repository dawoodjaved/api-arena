"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function UsagePage() {
  const { data: session } = useSession();
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const res = await fetch("/api/usage");
      if (res.ok) {
        const data = await res.json();
        setUsage(data);
      }
    } catch (error) {
      console.error("Error fetching usage:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#4F7FFF]"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Mock data for demonstration
  const dailyData = [
    { date: "Mon", requests: 1200, errors: 12 },
    { date: "Tue", requests: 1900, errors: 8 },
    { date: "Wed", requests: 3000, errors: 15 },
    { date: "Thu", requests: 2780, errors: 10 },
    { date: "Fri", requests: 1890, errors: 5 },
    { date: "Sat", requests: 2390, errors: 18 },
    { date: "Sun", requests: 3490, errors: 20 },
  ];

  const endpointData = [
    { endpoint: "/users", requests: 4500, avgLatency: 120 },
    { endpoint: "/products", requests: 3200, avgLatency: 95 },
    { endpoint: "/orders", requests: 2800, avgLatency: 150 },
    { endpoint: "/analytics", requests: 1200, avgLatency: 200 },
  ];

  return (
    <div className="min-h-screen bg-[#0A0E1A]">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <h1 className="text-6xl font-bold mb-8 leading-tight">
          Usage Analytics
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#151B2B] border border-[rgba(255,255,255,0.05)] rounded-xl p-6">
            <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-2">
              Total Requests
            </h3>
            <p className="text-5xl font-bold text-white leading-none">
              {usage?.totalRequests || "15,650"}
            </p>
          </div>
          <div className="bg-[#151B2B] border border-[rgba(255,255,255,0.05)] rounded-xl p-6">
            <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-2">
              Success Rate
            </h3>
            <p className="text-5xl font-bold text-[#10B981] leading-none">
              {usage?.successRate || "98.5"}%
            </p>
          </div>
          <div className="bg-[#151B2B] border border-[rgba(255,255,255,0.05)] rounded-xl p-6">
            <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-2">
              Avg Latency
            </h3>
            <p className="text-5xl font-bold text-white leading-none">
              {usage?.avgLatency || "125"}ms
            </p>
          </div>
          <div className="bg-[#151B2B] border border-[rgba(255,255,255,0.05)] rounded-xl p-6">
            <h3 className="text-sm text-gray-400 uppercase tracking-wider mb-2">
              Error Rate
            </h3>
            <p className="text-5xl font-bold text-[#10B981] leading-none">
              {usage?.errorRate || "1.5"}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#151B2B] border border-[rgba(255,255,255,0.05)] rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Daily Requests
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#151B2B', 
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px'
                  }} 
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="requests"
                  stroke="#4F7FFF"
                  strokeWidth={3}
                  dot={{ fill: '#60A5FA', strokeWidth: 2 }}
                  name="Requests"
                />
                <Line
                  type="monotone"
                  dataKey="errors"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={{ fill: '#10B981' }}
                  name="Errors"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-[#151B2B] border border-[rgba(255,255,255,0.05)] rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Requests by Endpoint
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={endpointData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                <XAxis dataKey="endpoint" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#151B2B', 
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px'
                  }} 
                />
                <Legend />
                <Bar dataKey="requests" fill="#4F7FFF" name="Requests" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
