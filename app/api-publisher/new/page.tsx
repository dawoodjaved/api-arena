"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Upload, FileText, ArrowRight } from "lucide-react";
import * as yaml from "js-yaml";

function parseSpecFile(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return JSON.parse(trimmed);
  }
  return yaml.load(trimmed);
}

export default function NewAPIPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "Other",
    isPublic: true,
  });
  const [openApiFile, setOpenApiFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let openApiSpec = null;
      if (openApiFile) {
        const text = await openApiFile.text();
        openApiSpec = parseSpecFile(text);
      }

      if (openApiSpec) {
        const res = await fetch("/api/apis/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            openApiSpec,
            apiName: formData.name,
            apiDescription: formData.description,
            category: formData.category,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          router.push(`/api-publisher/${data.api.id}/edit`);
        } else {
          const err = await res.json().catch(() => ({}));
          alert(err.error || "Failed to create API");
        }
      } else {
        const res = await fetch("/api/apis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (res.ok) {
          const data = await res.json();
          router.push(`/api-publisher/${data.id}/edit`);
        } else {
          alert("Failed to create API");
        }
      }
    } catch (error) {
      console.error("Error creating API:", error);
      alert("Failed to create API. Check that the OpenAPI file is valid JSON or YAML.");
    } finally {
      setLoading(false);
    }
  };

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
        <h1 className="font-display text-2xl font-bold text-ink">
          Please sign in to publish an API
        </h1>
        <a href="/auth/signin" className="btn btn-primary">
          Sign In
        </a>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <h1 className="mb-8 font-display text-4xl font-bold text-ink sm:text-5xl">
          Publish New API
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-ink">
              API Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-lg border border-[rgba(11,18,32,0.08)] bg-surface px-4 py-3 text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder="My Awesome API"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-ink">
              Description *
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
              className="w-full rounded-lg border border-[rgba(11,18,32,0.08)] bg-surface px-4 py-3 text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              placeholder="Describe what your API does..."
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-ink">
              Category *
            </label>
            <select
              required
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full rounded-lg border border-[rgba(11,18,32,0.08)] bg-surface px-4 py-3 text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
            >
              <option value="Data">Data</option>
              <option value="AI/ML">AI/ML</option>
              <option value="Finance">Finance</option>
              <option value="Social">Social</option>
              <option value="Communication">Communication</option>
              <option value="Payment">Payment</option>
              <option value="Analytics">Analytics</option>
              <option value="Storage">Storage</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-ink">
              OpenAPI Specification (Optional)
            </label>
            <div className="rounded-lg border-2 border-dashed border-[rgba(11,18,32,0.12)] bg-surface p-8 text-center transition-all hover:border-accent/40">
              <input
                type="file"
                accept=".json,.yaml,.yml"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setOpenApiFile(file);
                  }
                }}
                className="hidden"
                id="openapi-file"
              />
              <label
                htmlFor="openapi-file"
                className="flex cursor-pointer flex-col items-center"
              >
                <Upload className="mb-4 h-12 w-12 text-accent" />
                <span className="text-ink-muted">
                  {openApiFile
                    ? openApiFile.name
                    : "Click to upload OpenAPI spec (JSON or YAML)"}
                </span>
              </label>
            </div>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPublic"
              checked={formData.isPublic}
              onChange={(e) =>
                setFormData({ ...formData, isPublic: e.target.checked })
              }
              className="mr-2 h-4 w-4 rounded border-[rgba(11,18,32,0.2)] text-accent focus:ring-accent"
            />
            <label htmlFor="isPublic" className="text-sm text-ink-soft">
              Make this API public
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block h-5 w-5 animate-spin rounded-full border-b-2 border-white" />
            ) : (
              <>
                Create API
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
