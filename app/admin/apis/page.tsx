"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Check, X, Star } from "lucide-react";

export default function AdminAPIsPage() {
  const { data: session, status } = useSession();
  const [apis, setApis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAPIs = async () => {
    try {
      const res = await fetch("/api/admin/apis");
      const data = await res.json();
      setApis(Array.isArray(data) ? data : []);
    } catch {
      setApis([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated") fetchAPIs();
    if (status === "unauthenticated") setLoading(false);
  }, [status]);

  const approveAPI = async (apiId: string) => {
    const res = await fetch(`/api/admin/apis/${apiId}/approve`, { method: "POST" });
    if (res.ok) {
      setApis(apis.map((api) => (api.id === apiId ? { ...api, isApproved: true } : api)));
    }
  };

  const rejectAPI = async (apiId: string) => {
    const res = await fetch(`/api/admin/apis/${apiId}/reject`, { method: "POST" });
    if (res.ok) setApis(apis.filter((api) => api.id !== apiId));
  };

  const toggleFeatured = async (apiId: string, isFeatured: boolean) => {
    const res = await fetch(`/api/admin/apis/${apiId}/feature`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isFeatured: !isFeatured }),
    });
    if (res.ok) {
      const updated = await res.json();
      setApis(
        apis.map((api) =>
          api.id === apiId ? { ...api, isFeatured: updated.isFeatured } : api
        )
      );
    }
  };

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
        <p className="text-ink-muted">You need admin privileges to access this page.</p>
        <Link href="/auth/signin" className="text-accent">
          Sign in
        </Link>
      </div>
    );
  }

  const pendingAPIs = apis.filter((api) => !api.isApproved);
  const approvedAPIs = apis.filter((api) => api.isApproved);

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <h1 className="mb-8 font-display text-4xl font-bold text-ink">
          API Management
        </h1>

        {loading ? (
          <p className="text-ink-muted">Loading…</p>
        ) : (
          <>
            <h2 className="mb-4 text-xl font-semibold text-ink">
              Pending ({pendingAPIs.length})
            </h2>
            <div className="mb-10 space-y-4">
              {pendingAPIs.length === 0 ? (
                <p className="text-sm text-ink-muted">No APIs pending approval</p>
              ) : (
                pendingAPIs.map((api) => (
                  <div
                    key={api.id}
                    className="flex justify-between gap-4 rounded-2xl border border-[rgba(11,18,32,0.08)] bg-surface p-6 shadow-soft"
                  >
                    <div>
                      <h3 className="text-lg font-semibold text-ink">{api.name}</h3>
                      <p className="mt-1 text-sm text-ink-muted">{api.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => approveAPI(api.id)}
                        className="rounded-lg bg-emerald-600 p-3 text-white"
                      >
                        <Check className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => rejectAPI(api.id)}
                        className="rounded-lg bg-red-500 p-3 text-white"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <h2 className="mb-4 text-xl font-semibold text-ink">
              Approved ({approvedAPIs.length})
            </h2>
            <div className="space-y-4">
              {approvedAPIs.map((api) => (
                <div
                  key={api.id}
                  className="flex justify-between gap-4 rounded-2xl border border-[rgba(11,18,32,0.08)] bg-surface p-6 shadow-soft"
                >
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-ink">
                      {api.name}
                      {api.isFeatured && (
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      )}
                    </h3>
                    <p className="text-sm text-ink-muted">{api.category}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => toggleFeatured(api.id, api.isFeatured)}
                    className={`rounded-lg px-4 py-2 text-sm ${
                      api.isFeatured
                        ? "border border-amber-300 bg-amber-50 text-amber-800"
                        : "border border-[rgba(11,18,32,0.08)] text-ink-muted"
                    }`}
                  >
                    {api.isFeatured ? "Unfeature" : "Feature"}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
