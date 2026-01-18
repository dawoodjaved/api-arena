"use client";

import { useSession } from "next-auth/react";
import { Shield, Users, BarChart, Star } from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  const { data: session } = useSession();

  if (!session || (session.user as any)?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            You need admin privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  const menuItems = [
    {
      title: "API Management",
      description: "Approve and manage APIs",
      icon: Shield,
      href: "/admin/apis",
      color: "bg-blue-500",
    },
    {
      title: "User Management",
      description: "Manage users and permissions",
      icon: Users,
      href: "/admin/users",
      color: "bg-green-500",
    },
    {
      title: "Platform Analytics",
      description: "View platform-wide metrics",
      icon: BarChart,
      href: "/admin/analytics",
      color: "bg-purple-500",
    },
    {
      title: "Featured APIs",
      description: "Curate featured APIs",
      icon: Star,
      href: "/admin/featured",
      color: "bg-orange-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Admin Panel
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage the APIArena platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="block p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700"
              >
                <div className={`${item.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
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
