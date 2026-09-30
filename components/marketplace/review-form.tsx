"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Star } from "lucide-react";
import Link from "next/link";

export function ReviewForm({
  apiId,
  onSubmitted,
}: {
  apiId: string;
  onSubmitted?: () => void;
}) {
  const { data: session } = useSession();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!session) {
    return (
      <p className="mb-6 text-sm text-ink-muted">
        <Link href="/auth/signin" className="text-accent">
          Sign in
        </Link>{" "}
        to leave a review.
      </p>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiId, rating, comment }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to submit review");
        return;
      }
      setComment("");
      onSubmitted?.();
    } catch {
      alert("Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 space-y-3">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className="p-0.5"
          >
            <Star
              className={`h-5 w-5 ${
                n <= rating
                  ? "fill-emerald-500 text-emerald-500"
                  : "text-ink-faint"
              }`}
            />
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your experience…"
        className="min-h-[80px] w-full rounded-lg border border-[rgba(11,18,32,0.08)] bg-canvas px-4 py-3 text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
      />
      <button
        type="submit"
        disabled={submitting}
        className="btn btn-primary text-sm disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
