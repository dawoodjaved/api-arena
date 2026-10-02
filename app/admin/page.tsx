"use client";

import { useSession } from "next-auth/react";
import { Shield } from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-ink-muted">
        Loading…
      </div>
    );
  }

  if (!session || (session.user as any)?.role !== "admin") {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-5">
        <h1 className="font-display text-2xl font-bold text-ink">Access Denied</h1>
        <p className="text-ink-muted">
          You need admin privileges to access this page.
        </p>
        <Link href="/auth/signin" className="text-accent">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="mb-2 font-display text-4xl font-bold text-ink">
            Admin Panel
          </h1>
          <p className="text-ink-muted">Manage the Endpointly platform</p>
        </div>

        <Link
          href="/admin/apis"
          className="block max-w-md rounded-2xl border border-[rgba(11,18,32,0.08)] bg-surface p-6 shadow-soft transition-shadow hover:shadow-lift"
        >
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h3 className="mb-2 text-xl font-semibold text-ink">API Management</h3>
          <p className="text-ink-muted">
            Approve listings and feature the ones that should lead the catalog.
          </p>
        </Link>
      </div>
    </div>
  );
}
