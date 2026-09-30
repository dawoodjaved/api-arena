"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Key, BarChart3, CreditCard, Play, HelpCircle, ArrowRight } from "lucide-react";

export default function DashboardPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-ink-muted">
        Loading…
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-5">
        <h1 className="font-display text-2xl font-bold text-ink">Sign in to continue</h1>
        <Link href="/auth/signin" className="btn btn-primary">
          Sign in
        </Link>
      </div>
    );
  }

  const menuItems = [
    {
      title: "API Keys",
      description: "Create scoped keys per API and environment.",
      icon: Key,
      href: "/dashboard/api-keys",
    },
    {
      title: "Usage",
      description: "Request volume and latency from real gateway logs.",
      icon: BarChart3,
      href: "/dashboard/usage",
    },
    {
      title: "Billing",
      description: "Free or Pro, invoices, and Stripe portal.",
      icon: CreditCard,
      href: "/dashboard/billing",
    },
    {
      title: "Playground",
      description: "Send authenticated requests through the gateway.",
      icon: Play,
      href: "/dashboard/playground",
    },
    {
      title: "Support",
      description: "Open a ticket when something breaks.",
      icon: HelpCircle,
      href: "/dashboard/support",
    },
  ];

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-container px-5 py-12 sm:py-16">
        <p className="text-sm font-medium uppercase tracking-wide text-accent">
          Developer portal
        </p>
        <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
          {session.user?.name || "Welcome back"}
        </h1>
        <p className="mt-3 text-ink-muted">{session.user?.email}</p>

        <div className="mt-12 divide-y divide-[rgba(11,18,32,0.08)] rounded-2xl border border-[rgba(11,18,32,0.08)] bg-surface">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center gap-4 px-5 py-5 transition-colors hover:bg-accent-soft/50 sm:px-6"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-display text-lg font-semibold text-ink group-hover:text-accent">
                    {item.title}
                  </h2>
                  <p className="text-sm text-ink-muted">{item.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-ink-faint group-hover:text-accent" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
