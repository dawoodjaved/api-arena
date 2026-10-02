"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Mail, Lock, User, ArrowRight } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const email = formData.email.trim().toLowerCase();
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || data.error || "Failed to create account");
        setLoading(false);
        return;
      }

      const result = await signIn("credentials", {
        email,
        password: formData.password,
        remember: "true",
        redirect: false,
        callbackUrl: "/dashboard",
      });

      if (result?.ok) {
        router.push("/dashboard");
        router.refresh();
        return;
      }

      router.push("/auth/signin?registered=true");
    } catch (err) {
      console.error("Sign up error:", err);
      setError("An error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="page-shell flex min-h-[70vh] items-center justify-center px-5 py-12">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-[rgba(11,18,32,0.08)] bg-surface p-8 shadow-soft">
        <div>
          <h2 className="text-center font-display text-3xl font-bold text-ink">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-ink-muted">
            Join APIDoorway and start building with APIs
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-ink-soft">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-faint" />
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg border border-[rgba(11,18,32,0.08)] bg-canvas py-3 pl-10 pr-4 text-ink outline-none placeholder:text-ink-faint focus:ring-2 focus:ring-accent"
                  placeholder="Your full name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-ink-soft">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-faint" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg border border-[rgba(11,18,32,0.08)] bg-canvas py-3 pl-10 pr-4 text-ink outline-none placeholder:text-ink-faint focus:ring-2 focus:ring-accent"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-ink-soft">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-faint" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-lg border border-[rgba(11,18,32,0.08)] bg-canvas py-3 pl-10 pr-4 text-ink outline-none placeholder:text-ink-faint focus:ring-2 focus:ring-accent"
                  placeholder="At least 8 characters"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-medium text-ink-soft"
              >
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-faint" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  className="w-full rounded-lg border border-[rgba(11,18,32,0.08)] bg-canvas py-3 pl-10 pr-4 text-ink outline-none placeholder:text-ink-faint focus:ring-2 focus:ring-accent"
                  placeholder="Confirm your password"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full justify-center disabled:opacity-50"
          >
            {loading ? (
              <div className="inline-block h-5 w-5 animate-spin rounded-full border-b-2 border-white" />
            ) : (
              <>
                Sign Up for Free
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>

          <p className="text-center text-sm text-ink-muted">
            Already have an account?{" "}
            <Link href="/auth/signin" className="font-medium text-accent hover:text-accent-hover">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
