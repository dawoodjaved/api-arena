"use client";

import { useEffect, useState, useRef } from "react";
import { APICard } from "@/components/marketplace/api-card";
import { Search, Download } from "lucide-react";
import Link from "next/link";

const categories = [
  "All",
  "Data",
  "AI/ML",
  "Finance",
  "Social",
  "Communication",
  "Payment",
  "Analytics",
  "Storage",
  "Other",
];

const AUTO_IMPORT_LIMIT = 100;

export default function MarketplacePage() {
  const [apis, setApis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [featured, setFeatured] = useState<any[]>([]);
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);
  const autoImportAttemptedRef = useRef(false);

  useEffect(() => {
    fetchAPIs();
    fetchFeatured();
  }, [selectedCategory, search]);

  useEffect(() => {
    if (
      loading ||
      apis.length > 0 ||
      search ||
      selectedCategory !== "All" ||
      autoImportAttemptedRef.current
    ) {
      return;
    }
    autoImportAttemptedRef.current = true;
    importSampleAPIs("all", AUTO_IMPORT_LIMIT);
  }, [loading, apis.length, search, selectedCategory]);

  const fetchAPIs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== "All") params.append("category", selectedCategory);
      if (search) params.append("search", search);
      const res = await fetch(`/api/apis?${params}`);
      const data = await res.json();
      setApis(Array.isArray(data) ? data : []);
    } catch {
      setApis([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeatured = async () => {
    try {
      const res = await fetch("/api/apis?featured=true");
      const data = await res.json();
      setFeatured(Array.isArray(data) ? data.slice(0, 4) : []);
    } catch {
      setFeatured([]);
    }
  };

  const importSampleAPIs = async (
    source: "github" | "guru" | "all" = "all",
    limit: number = 50
  ) => {
    setSeedError(null);
    setSeeding(true);
    try {
      const res = await fetch("/api/admin/sync-public-apis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ limit: Math.min(limit, 500), source }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || data.error || "Import failed");
      await fetchAPIs();
      await fetchFeatured();
    } catch (err) {
      setSeedError(err instanceof Error ? err.message : "Failed to import APIs");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-container px-5 py-12 sm:py-16">
        <div className="flex flex-col gap-6 border-b border-[rgba(11,18,32,0.08)] pb-10 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">
              Marketplace
            </h1>
            <p className="mt-3 max-w-xl text-ink-muted">
              Discover APIs, open docs, and create keys from one catalog.
            </p>
          </div>
          <Link href="/marketplace/compare" className="btn btn-secondary shrink-0">
            Compare APIs
          </Link>
        </div>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
            <input
              type="text"
              placeholder="Search by name or description"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-[10px] border border-[rgba(11,18,32,0.08)] bg-surface py-3 pl-10 pr-4 text-sm text-ink outline-none focus:border-accent"
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`rounded-[8px] px-3 py-1.5 text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? "bg-accent !text-white border border-accent"
                  : "bg-surface text-ink-muted border border-[rgba(11,18,32,0.08)] hover:text-ink"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {featured.length > 0 && selectedCategory === "All" && !search && (
          <section className="mt-12">
            <h2 className="font-display text-xl font-semibold text-ink">Featured</h2>
            <div className="mt-2 divide-y divide-[rgba(11,18,32,0.08)] rounded-2xl border border-[rgba(11,18,32,0.08)] bg-surface px-2">
              {featured.map((api) => (
                <APICard key={api.id} api={api} />
              ))}
            </div>
          </section>
        )}

        <section className="mt-12">
          <div className="mb-2 flex items-baseline justify-between gap-3">
            <h2 className="font-display text-xl font-semibold text-ink">
              {selectedCategory === "All" ? "All APIs" : selectedCategory}
            </h2>
            <p className="text-sm text-ink-faint">
              {loading ? "…" : `${apis.length} result${apis.length === 1 ? "" : "s"}`}
            </p>
          </div>

          {loading ? (
            <p className="py-16 text-center text-ink-muted">Loading APIs…</p>
          ) : apis.length === 0 ? (
            <div className="rounded-2xl border border-[rgba(11,18,32,0.08)] bg-surface px-6 py-14 text-center">
              <p className="font-display text-lg font-semibold text-ink">
                {seeding ? "Importing catalog…" : "No APIs yet"}
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
                Import open catalogs or{" "}
                <Link href="/api-publisher/new" className="text-accent hover:underline">
                  publish your own
                </Link>
                .
              </p>
              {seedError && <p className="mt-3 text-sm text-red-600">{seedError}</p>}
              <button
                onClick={() => importSampleAPIs("all")}
                disabled={seeding}
                className="btn btn-primary mt-6"
              >
                <Download className="h-4 w-4" />
                {seeding ? "Importing…" : "Import sample APIs"}
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[rgba(11,18,32,0.08)] rounded-2xl border border-[rgba(11,18,32,0.08)] bg-surface px-2">
              {apis.map((api) => (
                <APICard key={api.id} api={api} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
