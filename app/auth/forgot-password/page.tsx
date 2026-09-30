"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { Mail, ArrowRight } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setResetUrl(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }
      setMessage(data.message);
      if (data.resetUrl) setResetUrl(data.resetUrl);
    } catch {
      setError("Unable to send reset request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell flex min-h-[70vh] items-center justify-center px-5 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[rgba(11,18,32,0.08)] bg-surface p-8 shadow-soft">
        <h1 className="font-display text-3xl font-bold text-ink">Reset password</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Enter your account email. We&apos;ll generate a reset link (shown here in
          local/dev — wire an email provider for production).
        </p>

        {message && (
          <div className="mt-6 rounded-xl border border-accent-line bg-accent-soft p-4 text-sm">
            <p className="text-ink">{message}</p>
            {resetUrl && (
              <p className="mt-3 break-all">
                <Link href={resetUrl} className="font-medium text-accent underline">
                  Open reset link
                </Link>
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-5" onSubmit={onSubmit}>
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-ink">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-faint" />
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-[rgba(11,18,32,0.08)] bg-canvas py-3 pl-10 pr-4 text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                placeholder="name@company.com"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? "Working…" : (
              <>
                Continue
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-muted">
          <Link href="/auth/signin" className="font-medium text-accent">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
