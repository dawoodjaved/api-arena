"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, Save, GitBranch } from "lucide-react";

export default function EditAPIPage() {
  const { apiId } = useParams<{ apiId: string }>();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "Other",
    baseUrl: "",
    isPublic: true,
  });

  useEffect(() => {
    if (!apiId) return;
    fetch(`/api/apis/${apiId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          alert(data.error);
          router.push("/dashboard");
          return;
        }
        setFormData({
          name: data.name || "",
          description: data.description || "",
          category: data.category || "Other",
          baseUrl: data.baseUrl || "",
          isPublic: data.isPublic ?? true,
        });
      })
      .finally(() => setLoading(false));
  }, [apiId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/apis/${apiId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          baseUrl: formData.baseUrl || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to save");
        return;
      }
      alert("API updated");
    } catch {
      alert("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center text-gray-400">
        Loading...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
        <a href="/auth/signin" className="text-[#4F7FFF]">
          Sign in to edit
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0E1A]">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <Link
            href={`/api-publisher/${apiId}/versions`}
            className="inline-flex items-center gap-2 text-[#4F7FFF] hover:text-[#6B92FF]"
          >
            <GitBranch className="w-4 h-4" /> Versions
          </Link>
        </div>

        <h1 className="text-4xl font-bold text-white mb-8">Edit API</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm text-gray-300 mb-2">Name</label>
            <input
              className="w-full px-4 py-3 rounded-lg bg-[#151B2B] border border-[rgba(255,255,255,0.05)] text-white"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Description</label>
            <textarea
              className="w-full px-4 py-3 rounded-lg bg-[#151B2B] border border-[rgba(255,255,255,0.05)] text-white min-h-[120px]"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">Category</label>
            <select
              className="w-full px-4 py-3 rounded-lg bg-[#151B2B] border border-[rgba(255,255,255,0.05)] text-white"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
            >
              {[
                "Data",
                "AI/ML",
                "Finance",
                "Social",
                "Communication",
                "Other",
              ].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-2">
              Upstream base URL (gateway proxy)
            </label>
            <input
              type="url"
              placeholder="https://api.example.com"
              className="w-full px-4 py-3 rounded-lg bg-[#151B2B] border border-[rgba(255,255,255,0.05)] text-white"
              value={formData.baseUrl}
              onChange={(e) =>
                setFormData({ ...formData, baseUrl: e.target.value })
              }
            />
            <p className="text-xs text-gray-500 mt-1">
              Falls back to OpenAPI servers[0].url if empty.
            </p>
          </div>
          <label className="flex items-center gap-2 text-gray-300">
            <input
              type="checkbox"
              checked={formData.isPublic}
              onChange={(e) =>
                setFormData({ ...formData, isPublic: e.target.checked })
              }
            />
            Public listing
          </label>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#4F7FFF] text-white font-medium disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Save changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
