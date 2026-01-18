"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Star, Code, BookOpen, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function APIDetailPage() {
  const params = useParams();
  const [api, setApi] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.slug) {
      fetchAPI();
    }
  }, [params.slug]);

  const fetchAPI = async () => {
    try {
      const res = await fetch("/api/apis");
      const apis = await res.json();
      
      if (Array.isArray(apis)) {
        const found = apis.find((a: any) => a.slug === params.slug);

        if (found) {
          const detailRes = await fetch(`/api/apis/${found.id}`);
          if (detailRes.ok) {
            const detail = await detailRes.json();
            setApi(detail);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching API:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#4F7FFF]"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!api) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">API Not Found</h1>
          <Link href="/marketplace" className="text-[#4F7FFF] hover:text-[#6B92FF]">
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  const latestVersion = api.versions?.[0];

  return (
    <div className="min-h-screen bg-[#0A0E1A]">
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Header Section */}
        <div className="bg-[#151B2B] border border-[rgba(255,255,255,0.05)] rounded-2xl p-8 mb-8 backdrop-blur-xl">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              {api.logo ? (
                <img src={api.logo} alt={api.name} className="w-20 h-20 rounded-lg object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-[#4F7FFF] to-[#8B5CF6] flex items-center justify-center text-white font-bold text-2xl">
                  {api.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">{api.name}</h1>
                <div className="flex items-center gap-4">
                  <span className="px-3 py-1 bg-[#4F7FFF]/20 text-[#4F7FFF] rounded-full text-sm font-medium border border-[#4F7FFF]/30">
                    {api.category}
                  </span>
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-[#10B981] text-[#10B981]" />
                    <span className="text-lg font-semibold text-white">
                      {api.rating?.toFixed(1) || "0.0"}
                    </span>
                    <span className="text-gray-400">({api.reviewCount || 0} reviews)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="text-gray-300 text-lg mb-8">{api.description}</p>

          <div className="flex gap-4">
            <button className="px-6 py-3 bg-[#4F7FFF] hover:bg-[#6B92FF] text-white rounded-lg font-medium transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(79,127,255,0.3)]">
              Subscribe
            </button>
            <button className="px-6 py-3 bg-transparent border border-[rgba(255,255,255,0.05)] text-gray-300 rounded-lg font-medium hover:bg-[#151B2B] hover:border-[rgba(79,127,255,0.1)] transition-all flex items-center gap-2">
              <Code className="w-5 h-5" />
              Try It Out
            </button>
            <button className="px-6 py-3 bg-transparent border border-[rgba(255,255,255,0.05)] text-gray-300 rounded-lg font-medium hover:bg-[#151B2B] hover:border-[rgba(79,127,255,0.1)] transition-all flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Documentation
            </button>
          </div>
        </div>

        {/* API Versions */}
        {api.versions && Array.isArray(api.versions) && api.versions.length > 0 && (
          <div className="bg-[#151B2B] border border-[rgba(255,255,255,0.05)] rounded-2xl p-8 mb-8 backdrop-blur-xl">
            <h2 className="text-2xl font-semibold text-white mb-4">Versions</h2>
            <div className="space-y-4">
              {api.versions.map((version: any) => (
                <div
                  key={version.id}
                  className="p-4 border border-[rgba(255,255,255,0.05)] rounded-lg hover:border-[rgba(79,127,255,0.1)] transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">v{version.version}</h3>
                      {version.isDeprecated && (
                        <span className="text-sm text-red-400">Deprecated</span>
                      )}
                    </div>
                    <span className="text-sm text-gray-400">
                      {new Date(version.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {version.changelog && (
                    <p className="mt-2 text-gray-400">{version.changelog}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        {api.reviews && Array.isArray(api.reviews) && api.reviews.length > 0 && (
          <div className="bg-[#151B2B] border border-[rgba(255,255,255,0.05)] rounded-2xl p-8 backdrop-blur-xl">
            <h2 className="text-2xl font-semibold text-white mb-4">Reviews</h2>
            <div className="space-y-4">
              {api.reviews.map((review: any) => (
                <div
                  key={review.id}
                  className="p-4 border border-[rgba(255,255,255,0.05)] rounded-lg"
                >
                  <div className="flex items-center gap-3 mb-2">
                    {review.user?.image ? (
                      <img
                        src={review.user.image}
                        alt={review.user.name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#4F7FFF] flex items-center justify-center text-white">
                        {review.user?.name?.charAt(0) || "U"}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-white">{review.user?.name || "Anonymous"}</p>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? "fill-[#10B981] text-[#10B981]"
                                : "text-gray-600"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  {review.comment && <p className="text-gray-300">{review.comment}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
