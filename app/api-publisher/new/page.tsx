"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Upload, FileText, ArrowRight } from "lucide-react";

export default function NewAPIPage() {
  const { data: session } = useSession();
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
        openApiSpec = JSON.parse(text);
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
          alert("Failed to create API");
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
      alert("Failed to create API");
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Please sign in to publish an API</h1>
          <a href="/auth/signin" className="text-[#4F7FFF] hover:text-[#6B92FF]">
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0E1A]">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-6xl font-bold mb-8 leading-tight">Publish New API</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              API Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 border border-[rgba(255,255,255,0.05)] rounded-lg bg-[#151B2B] text-white placeholder-gray-500 focus:ring-2 focus:ring-[#4F7FFF] focus:border-transparent outline-none"
              placeholder="My Awesome API"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description *
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-4 py-3 border border-[rgba(255,255,255,0.05)] rounded-lg bg-[#151B2B] text-white placeholder-gray-500 focus:ring-2 focus:ring-[#4F7FFF] focus:border-transparent outline-none"
              placeholder="Describe what your API does..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Category *
            </label>
            <select
              required
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 border border-[rgba(255,255,255,0.05)] rounded-lg bg-[#151B2B] text-white focus:ring-2 focus:ring-[#4F7FFF] focus:border-transparent outline-none"
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
            <label className="block text-sm font-medium text-gray-300 mb-2">
              OpenAPI Specification (Optional)
            </label>
            <div className="border-2 border-dashed border-[rgba(255,255,255,0.05)] rounded-lg p-8 text-center bg-[#151B2B] hover:border-[rgba(79,127,255,0.2)] transition-all">
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
              <label htmlFor="openapi-file" className="cursor-pointer flex flex-col items-center">
                <Upload className="w-12 h-12 text-[#4F7FFF] mb-4" />
                <span className="text-gray-400">
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
              onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              className="mr-2 h-4 w-4 border-[rgba(255,255,255,0.05)] rounded bg-[#151B2B] text-[#4F7FFF] focus:ring-[#4F7FFF]"
            />
            <label htmlFor="isPublic" className="text-sm text-gray-300">
              Make this API public
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full px-6 py-3 bg-[#4F7FFF] hover:bg-[#6B92FF] text-white rounded-lg font-medium transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(79,127,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                Create API
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
