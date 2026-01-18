"use client";

import Link from "next/link";
import { Star, ExternalLink } from "lucide-react";
import { useState } from "react";
import { LoadingAnimation } from "../animations/LoadingAnimation";

interface APICardProps {
  api: {
    id: string;
    name: string;
    slug: string;
    description: string;
    category: string;
    rating: number;
    reviewCount: number;
    logo?: string;
    pricing?: { free: boolean; pro?: number; enterprise?: boolean };
    externalLink?: string;
  };
}

export function APICard({ api }: APICardProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={`/marketplace/api/${api.slug}`}
      className="block bg-[#151B2B] border border-[rgba(255,255,255,0.05)] rounded-2xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.2)] hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(79,127,255,0.15)] hover:border-[rgba(79,127,255,0.2)] transition-all group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {api.logo ? (
            <div className="relative w-12 h-12 rounded-lg overflow-hidden">
              {imageLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <LoadingAnimation size={48} />
                </div>
              )}
              <img
                src={api.logo}
                alt={api.name}
                className="w-12 h-12 rounded-lg object-cover"
                onLoad={() => setImageLoading(false)}
                onError={() => setImageLoading(false)}
                style={{ display: imageLoading ? "none" : "block" }}
              />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#4F7FFF] to-[#8B5CF6] flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform">
              {api.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="text-xl font-semibold text-white group-hover:text-[#6B92FF] transition-colors">
              {api.name}
            </h3>
            <span className="text-sm text-gray-400">{api.category}</span>
          </div>
        </div>
        {api.externalLink && (
          <a
            href={api.externalLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-gray-400 hover:text-[#4F7FFF] transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>

      <p className="text-gray-400 mb-4 line-clamp-2">{api.description}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 fill-[#10B981] text-[#10B981]" />
          <span className="text-sm font-medium text-white">
            {api.rating.toFixed(1)}
          </span>
          <span className="text-sm text-gray-400">({api.reviewCount})</span>
        </div>

        <div className="flex gap-2">
          {api.pricing?.free && (
            <span className="px-2 py-1 text-xs bg-[#10B981]/20 text-[#10B981] rounded border border-[#10B981]/30">
              Free
            </span>
          )}
          {api.pricing?.pro && (
            <span className="px-2 py-1 text-xs bg-[#4F7FFF]/20 text-[#4F7FFF] rounded border border-[#4F7FFF]/30">
              ${api.pricing.pro}/mo
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
