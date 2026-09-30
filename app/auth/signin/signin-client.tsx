"use client";

import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Github, Mail, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function SignInClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const error = searchParams.get("error");
  const registered = searchParams.get("registered");
  const [loading, setLoading] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [oauth, setOauth] = useState<{ google: boolean; github: boolean }>({
    google: false,
    github: false,
  });

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((r) => r.json())
      .then((providers) => {
        setOauth({
          google: Boolean(providers?.google),
          github: Boolean(providers?.github),
        });
      })
      .catch(() => {});
  }, []);

  const handleOAuthSignIn = async (provider: string) => {
    setLoading(provider);
    try {
      await signIn(provider, { callbackUrl });
    } catch (err) {
      console.error("Sign in error:", err);
    } finally {
      setLoading(null);
    }
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setLoading("credentials");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        remember: rememberMe ? "true" : "false",
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        const msg =
          result.error === "CredentialsSignin"
            ? "Invalid email or password"
            : result.error === "Please sign up first"
              ? "No account found. Please sign up first."
              : result.error;
        setFormError(msg);
        setLoading(null);
      } else if (result?.ok) {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      console.error("Sign in error:", err);
      setFormError("An error occurred. Please try again.");
      setLoading(null);
    }
  };

  const showOauth = oauth.google || oauth.github;

  return (
    <div className="page-shell flex min-h-[70vh] items-center justify-center px-5 py-12">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-[rgba(11,18,32,0.08)] bg-surface p-8 shadow-soft">
        <div>
          <h2 className="text-center font-display text-3xl font-bold text-ink">
            Sign in to APIArena
          </h2>
          <p className="mt-2 text-center text-sm text-ink-muted">
            Access the API marketplace and developer portal
          </p>
        </div>

        {registered && (
          <div className="rounded-xl border border-accent-line bg-accent-soft p-4">
            <p className="text-sm text-ink">Account ready — sign in below.</p>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">
              {error === "Configuration"
                ? "Authentication is not properly configured. Check environment variables."
                : error === "AccessDenied"
                  ? "Access denied. Please try again."
                  : error === "CredentialsSignin"
                    ? "Invalid email or password."
                    : error === "OAuthCallback" || error === "OAuthSignin"
                      ? "Social sign-in failed. Use email/password or configure OAuth keys."
                      : error === "OAuthAccountNotLinked"
                        ? "This email is already used with another sign-in method."
                        : "An error occurred during sign in. Please try again."}
            </p>
          </div>
        )}

        {formError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">{formError}</p>
          </div>
        )}

        <form className="mt-2 space-y-6" onSubmit={handleEmailSignIn}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-ink">
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-[rgba(11,18,32,0.08)] bg-canvas py-3 pl-10 pr-4 text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-ink">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-faint" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-[rgba(11,18,32,0.08)] bg-canvas py-3 pl-10 pr-4 text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  placeholder="Enter your password"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-ink-muted">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-[rgba(11,18,32,0.2)] text-accent focus:ring-accent"
              />
              Remember me
            </label>

            <Link
              href="/auth/forgot-password"
              className="text-sm font-medium text-accent hover:text-accent-hover"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading !== null}
            className="btn btn-primary w-full disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading === "credentials" ? (
              <span className="inline-block h-5 w-5 animate-spin rounded-full border-b-2 border-white" />
            ) : (
              <>
                Sign In
                <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>

          <p className="text-center text-sm text-ink-muted">
            Don&apos;t have an account?{" "}
            <Link href="/auth/signup" className="font-medium text-accent">
              Sign up for free
            </Link>
          </p>
        </form>

        {showOauth && (
          <div className="mt-2">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[rgba(11,18,32,0.08)]" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-surface px-2 text-ink-muted">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {oauth.google && (
                <button
                  type="button"
                  onClick={() => handleOAuthSignIn("google")}
                  disabled={loading !== null}
                  className="btn btn-secondary text-sm disabled:opacity-50"
                >
                  {loading === "google" ? (
                    <span className="inline-block h-5 w-5 animate-spin rounded-full border-b-2 border-ink" />
                  ) : (
                    <>
                      <Mail className="h-5 w-5" />
                      Google
                    </>
                  )}
                </button>
              )}
              {oauth.github && (
                <button
                  type="button"
                  onClick={() => handleOAuthSignIn("github")}
                  disabled={loading !== null}
                  className="btn btn-secondary text-sm disabled:opacity-50"
                >
                  {loading === "github" ? (
                    <span className="inline-block h-5 w-5 animate-spin rounded-full border-b-2 border-ink" />
                  ) : (
                    <>
                      <Github className="h-5 w-5" />
                      GitHub
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-ink-faint">
          By signing in, you agree to our{" "}
          <Link href="/terms" className="text-accent underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-accent underline">
            Privacy Policy
          </Link>
        </p>
      </div>
    </div>
  );
}
