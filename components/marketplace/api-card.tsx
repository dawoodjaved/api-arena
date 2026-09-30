"use client";

import Link from "next/link";
import { Star, ExternalLink } from "lucide-react";
import { useState } from "react";

interface APICardProps {
  api: {
    id: string;
    name: string;
    slug: string;
    description: string;
    category: string;
    rating: number;
    reviewCount: number;
    logo?: string | null;
    pricing?: { free: boolean; pro?: number; enterprise?: boolean };
    externalLink?: string;
  };
}

export function APICard({ api }: APICardProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const rating = Number.isFinite(api.rating) ? api.rating : 0;
  const reviews = api.reviewCount || 0;
  const showLogo = Boolean(api.logo) && !imgFailed;

  return (
    <Link
      href={`/marketplace/api/${api.slug}`}
      className="group block border-b border-[rgba(11,18,32,0.08)] py-6 transition-colors hover:bg-accent-soft/40 sm:px-3"
    >
      <div className="flex items-start gap-4">
        {showLogo ? (
          <img
            src={api.logo!}
            alt={`${api.name} logo`}
            className="h-11 w-11 rounded-md object-cover bg-accent-soft"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-accent-soft font-display text-lg font-bold text-accent">
            {api.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-semibold text-ink group-hover:text-accent">
                {api.name}
              </h3>
              <p className="mt-0.5 text-xs font-medium uppercase tracking-wide text-ink-faint">
                {api.category}
              </p>
            </div>
            {api.externalLink && (
              <span
                onClick={(e) => {
                  e.preventDefault();
                  window.open(api.externalLink, "_blank");
                }}
                className="text-ink-faint hover:text-accent"
              >
                <ExternalLink className="h-4 w-4" />
              </span>
            )}
          </div>
          <p className="mt-2 line-clamp-2 text-sm text-ink-muted">
            {api.description}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
            <span className="inline-flex items-center gap-1 text-ink-soft">
              <Star className="h-3.5 w-3.5 fill-accent text-accent" />
              {rating.toFixed(1)}
              <span className="text-ink-faint">({reviews})</span>
            </span>
            <span className="text-xs font-medium text-accent">Free plan</span>
            {api.pricing?.pro ? (
              <span className="text-xs text-ink-muted">Pro ${api.pricing.pro}/mo</span>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
