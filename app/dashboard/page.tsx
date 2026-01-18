"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Key, BarChart, CreditCard, Play, TestTube, HelpCircle } from "lucide-react";

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#4F7FFF]"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Please sign in to access the dashboard
          </h1>
          <Link
            href="/auth/signin"
            className="btn btn-primary"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const menuItems = [
    {
      title: "API Keys",
      description: "Manage your API keys and access tokens",
      icon: Key,
      href: "/dashboard/api-keys",
      color: "bg-[#4F7FFF]",
    },
    {
      title: "Usage Analytics",
      description: "View your API usage statistics and metrics",
      icon: BarChart,
      href: "/dashboard/usage",
      color: "bg-[#10B981]",
    },
    {
      title: "Billing",
      description: "Manage subscriptions and payment methods",
      icon: CreditCard,
      href: "/dashboard/billing",
      color: "bg-[#8B5CF6]",
    },
    {
      title: "API Playground",
      description: "Test APIs interactively",
      icon: Play,
      href: "/dashboard/playground",
      color: "bg-[#60A5FA]",
    },
    {
      title: "Testing Tools",
      description: "Automated testing and validation",
      icon: TestTube,
      href: "/dashboard/testing",
      color: "bg-[#3B82F6]",
    },
    {
      title: "Support",
      description: "Get help and submit tickets",
      icon: HelpCircle,
      href: "/dashboard/support",
      color: "bg-[#6B92FF]",
    },
  ];

  return (
    <div className="min-h-screen bg-[#0A0E1A]">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="mb-8">
          <h1 className="text-6xl font-bold mb-2 leading-tight">
            Developer Portal
          </h1>
          <p className="text-lg text-gray-400">
            Welcome back, {session.user?.name || session.user?.email}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="bg-[#151B2B] border border-[rgba(255,255,255,0.05)] rounded-2xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.2)] hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(79,127,255,0.15)] hover:border-[rgba(79,127,255,0.2)] transition-all"
              >
                <div className={`${item.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-400">
                  {item.description}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
