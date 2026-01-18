"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
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
  Legend,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6"];

export default function AnalyticsPage() {
  const params = useParams();
  const { data: session } = useSession();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.apiId) {
      fetchAnalytics();
    }
  }, [params.apiId]);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`/api/analytics/${params.apiId}`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Mock data for demonstration
  const requestData = [
    { date: "2024-01-01", requests: 1200 },
    { date: "2024-01-02", requests: 1900 },
    { date: "2024-01-03", requests: 3000 },
    { date: "2024-01-04", requests: 2780 },
    { date: "2024-01-05", requests: 1890 },
    { date: "2024-01-06", requests: 2390 },
    { date: "2024-01-07", requests: 3490 },
  ];

  const statusCodeData = [
    { name: "2xx", value: 9500, color: "#10b981" },
    { name: "4xx", value: 300, color: "#f59e0b" },
    { name: "5xx", value: 200, color: "#ef4444" },
  ];

  const endpointData = [
    { endpoint: "/users", requests: 4500 },
    { endpoint: "/products", requests: 3200 },
    { endpoint: "/orders", requests: 2800 },
    { endpoint: "/analytics", requests: 1200 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">
          API Analytics
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Total Requests
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {analytics?.totalRequests || "10,000"}
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Success Rate
            </h3>
            <p className="text-3xl font-bold text-green-600">
              {analytics?.successRate || "95"}%
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Avg Latency
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              {analytics?.avgLatency || "125"}ms
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Revenue
            </h3>
            <p className="text-3xl font-bold text-gray-900 dark:text-white">
              ${analytics?.revenue || "0"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Requests Over Time
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={requestData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="requests"
                  stroke="#3b82f6"
                  name="Requests"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Status Code Distribution
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusCodeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusCodeData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Requests by Endpoint
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={endpointData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="endpoint" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="requests" fill="#3b82f6" name="Requests" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
