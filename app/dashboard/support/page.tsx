"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function SupportPage() {
  const { data: session } = useSession();
  const [tickets, setTickets] = useState<any[]>([]);
  const [form, setForm] = useState({
    subject: "",
    description: "",
    priority: "medium",
  });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    fetch("/api/tickets")
      .then((r) => r.json())
      .then((d) => setTickets(Array.isArray(d) ? d : []))
      .catch(() => setTickets([]));
  };

  useEffect(() => {
    if (session) load();
  }, [session]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to create ticket");
        return;
      }
      setForm({ subject: "", description: "", priority: "medium" });
      load();
    } finally {
      setSubmitting(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
        <Link href="/auth/signin" className="text-[#4F7FFF]">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0E1A]">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/dashboard" className="text-[#4F7FFF] text-sm">
          ← Dashboard
        </Link>
        <h1 className="text-4xl font-bold text-white mt-4 mb-8">Support</h1>

        <form
          onSubmit={submit}
          className="mb-10 p-6 rounded-2xl bg-[#151B2B] border border-[rgba(255,255,255,0.05)] space-y-4"
        >
          <input
            required
            placeholder="Subject"
            className="w-full px-4 py-3 rounded-lg bg-[#0A0E1A] border border-[rgba(255,255,255,0.05)] text-white"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          />
          <textarea
            required
            placeholder="Describe the issue"
            className="w-full px-4 py-3 rounded-lg bg-[#0A0E1A] border border-[rgba(255,255,255,0.05)] text-white min-h-[120px]"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <select
            className="w-full px-4 py-3 rounded-lg bg-[#0A0E1A] border border-[rgba(255,255,255,0.05)] text-white"
            value={form.priority}
            onChange={(e) => setForm({ ...form, priority: e.target.value })}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 rounded-lg bg-[#4F7FFF] text-white disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit ticket"}
          </button>
        </form>

        <h2 className="text-xl font-semibold text-white mb-4">Your tickets</h2>
        {tickets.length === 0 ? (
          <p className="text-gray-400 text-sm">No tickets yet.</p>
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => (
              <div
                key={t.id}
                className="p-4 rounded-xl bg-[#151B2B] border border-[rgba(255,255,255,0.05)]"
              >
                <div className="flex justify-between gap-2">
                  <h3 className="text-white font-medium">{t.subject}</h3>
                  <span className="text-xs text-gray-400 uppercase">{t.status}</span>
                </div>
                <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                  {t.description}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
