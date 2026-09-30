"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import * as yaml from "js-yaml";

interface Version {
  id: string;
  version: string;
  changelog: string | null;
  isDeprecated: boolean;
  deprecationDate: string | null;
  createdAt: string;
  endpoints: Array<{ id: string; method: string; path: string }>;
}

export default function APIVersionsPage() {
  const { apiId } = useParams<{ apiId: string }>();
  const { data: session } = useSession();
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    version: "",
    changelog: "",
    isDeprecated: false,
    deprecationDate: "",
    specText: "",
  });

  const load = () => {
    fetch(`/api/apis/${apiId}/versions`)
      .then((r) => r.json())
      .then((data) => setVersions(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (apiId) load();
  }, [apiId]);

  const parseSpec = (text: string) => {
    const trimmed = text.trim();
    if (trimmed.startsWith("{")) return JSON.parse(trimmed);
    return yaml.load(trimmed);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const openApiSpec = parseSpec(form.specText);
      const res = await fetch(`/api/apis/${apiId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          version: form.version,
          changelog: form.changelog || undefined,
          isDeprecated: form.isDeprecated,
          deprecationDate: form.deprecationDate || undefined,
          openApiSpec,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to create version");
        return;
      }
      setShowForm(false);
      setForm({
        version: "",
        changelog: "",
        isDeprecated: false,
        deprecationDate: "",
        specText: "",
      });
      load();
    } catch (err: any) {
      alert(err?.message || "Invalid OpenAPI JSON/YAML");
    } finally {
      setSubmitting(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
        <a href="/auth/signin" className="text-[#4F7FFF]">
          Sign in
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0E1A]">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <Link
            href={`/api-publisher/${apiId}/edit`}
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" /> Edit API
          </Link>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#4F7FFF] text-white"
          >
            <Plus className="w-4 h-4" /> New version
          </button>
        </div>

        <h1 className="text-4xl font-bold text-white mb-8">API Versions</h1>

        {showForm && (
          <form
            onSubmit={handleCreate}
            className="mb-8 p-6 rounded-2xl bg-[#151B2B] border border-[rgba(255,255,255,0.05)] space-y-4"
          >
            <input
              placeholder="Version (e.g. 1.1.0)"
              required
              className="w-full px-4 py-3 rounded-lg bg-[#0A0E1A] border border-[rgba(255,255,255,0.05)] text-white"
              value={form.version}
              onChange={(e) => setForm({ ...form, version: e.target.value })}
            />
            <textarea
              placeholder="Changelog"
              className="w-full px-4 py-3 rounded-lg bg-[#0A0E1A] border border-[rgba(255,255,255,0.05)] text-white min-h-[80px]"
              value={form.changelog}
              onChange={(e) => setForm({ ...form, changelog: e.target.value })}
            />
            <textarea
              placeholder="Paste OpenAPI JSON or YAML"
              required
              className="w-full px-4 py-3 rounded-lg bg-[#0A0E1A] border border-[rgba(255,255,255,0.05)] text-white font-mono text-sm min-h-[200px]"
              value={form.specText}
              onChange={(e) => setForm({ ...form, specText: e.target.value })}
            />
            <label className="flex items-center gap-2 text-gray-300">
              <input
                type="checkbox"
                checked={form.isDeprecated}
                onChange={(e) =>
                  setForm({ ...form, isDeprecated: e.target.checked })
                }
              />
              Mark deprecated
            </label>
            {form.isDeprecated && (
              <input
                type="date"
                className="w-full px-4 py-3 rounded-lg bg-[#0A0E1A] border border-[rgba(255,255,255,0.05)] text-white"
                value={form.deprecationDate}
                onChange={(e) =>
                  setForm({ ...form, deprecationDate: e.target.value })
                }
              />
            )}
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 rounded-lg bg-[#4F7FFF] text-white disabled:opacity-50"
            >
              {submitting ? "Creating…" : "Create version"}
            </button>
          </form>
        )}

        {loading ? (
          <p className="text-gray-400">Loading…</p>
        ) : versions.length === 0 ? (
          <p className="text-gray-400">No versions yet. Import an OpenAPI spec or create one.</p>
        ) : (
          <div className="space-y-4">
            {versions.map((v) => (
              <div
                key={v.id}
                className="p-6 rounded-2xl bg-[#151B2B] border border-[rgba(255,255,255,0.05)]"
              >
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-semibold text-white">
                    v{v.version}
                    {v.isDeprecated && (
                      <span className="ml-2 text-sm text-amber-400">Deprecated</span>
                    )}
                  </h2>
                  <span className="text-sm text-gray-500">
                    {v.endpoints?.length || 0} endpoints
                  </span>
                </div>
                {v.deprecationDate && (
                  <p className="text-sm text-amber-400/80 mb-2">
                    Sunset: {new Date(v.deprecationDate).toLocaleDateString()}
                  </p>
                )}
                {v.changelog && (
                  <p className="text-gray-400 text-sm whitespace-pre-wrap">{v.changelog}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
