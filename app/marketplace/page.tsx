"use client";

import { useEffect, useState } from "react";
import { APICard } from "@/components/marketplace/api-card";
import { LoadingAnimation } from "@/components/animations/LoadingAnimation";
import { Search } from "lucide-react";

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

export default function MarketplacePage() {
  const [apis, setApis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [featured, setFeatured] = useState<any[]>([]);

  useEffect(() => {
    fetchAPIs();
    fetchFeatured();
  }, [selectedCategory, search]);

  const fetchAPIs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== "All") {
        params.append("category", selectedCategory);
      }
      if (search) {
        params.append("search", search);
      }

      const res = await fetch(`/api/apis?${params}`);
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setApis(data);
      } else {
        console.error("Invalid API response:", data);
        setApis([]);
      }
    } catch (error) {
      console.error("Error fetching APIs:", error);
      setApis([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeatured = async () => {
    try {
      const res = await fetch("/api/apis?featured=true");
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setFeatured(data.slice(0, 3));
      } else {
        setFeatured([]);
      }
    } catch (error) {
      console.error("Error fetching featured APIs:", error);
      setFeatured([]);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0E1A]">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="mb-8">
          <h1 className="text-6xl font-bold mb-2 leading-tight">
            API Marketplace
          </h1>
          <p className="text-lg text-gray-400">
            Discover and integrate powerful APIs
          </p>
        </div>

        {/* Featured APIs */}
        {featured.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Featured APIs
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((api) => (
                <APICard key={api.id} api={api} />
              ))}
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search APIs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-[rgba(255,255,255,0.05)] rounded-lg bg-[#151B2B] text-white focus:ring-2 focus:ring-[#4F7FFF] focus:border-transparent outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? "bg-[#4F7FFF] text-white"
                    : "bg-[#151B2B] text-gray-400 border border-[rgba(255,255,255,0.05)] hover:border-[rgba(79,127,255,0.1)]"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* API Grid */}
        {loading ? (
          <div className="text-center py-12">
            <LoadingAnimation size={120} />
            <p className="mt-4 text-gray-400">Loading APIs...</p>
          </div>
        ) : apis.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400">
              No APIs found. Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-3">
            {apis.map((api) => (
              <APICard key={api.id} api={api} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
