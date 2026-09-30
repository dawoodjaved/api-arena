"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, ArrowRight } from "lucide-react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (!token) {
      setError("Missing reset token. Request a new link.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Reset failed");
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/auth/signin?registered=1"), 1200);
    } catch {
      setError("Unable to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-[rgba(11,18,32,0.08)] bg-surface p-8 shadow-soft">
      <h1 className="font-display text-3xl font-bold text-ink">Choose a new password</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Use at least 8 characters. You&apos;ll be signed out of old sessions after reset.
      </p>

      {done && (
        <div className="mt-6 rounded-xl border border-accent-line bg-accent-soft p-4 text-sm text-ink">
          Password updated. Redirecting to sign in…
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {!done && (
        <form className="mt-8 space-y-5" onSubmit={onSubmit}>
          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-ink">
              New password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-faint" />
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-[rgba(11,18,32,0.08)] bg-canvas py-3 pl-10 pr-4 text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                placeholder="••••••••"
              />
            </div>
          </div>
          <div>
            <label htmlFor="confirm" className="mb-2 block text-sm font-medium text-ink">
              Confirm password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-faint" />
              <input
                id="confirm"
                type="password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-lg border border-[rgba(11,18,32,0.08)] bg-canvas py-3 pl-10 pr-4 text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                placeholder="••••••••"
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn btn-primary w-full">
            {loading ? "Saving…" : (
              <>
                Update password
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-ink-muted">
        <Link href="/auth/signin" className="font-medium text-accent">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="page-shell flex min-h-[70vh] items-center justify-center px-5 py-12">
      <Suspense fallback={<p className="text-ink-muted">Loading…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
