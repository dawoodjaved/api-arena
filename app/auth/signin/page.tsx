"use client";

import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { useState } from "react";
import { Github, Mail, Lock, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function SignInPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const error = searchParams.get("error");
  const registered = searchParams.get("registered");
  const [loading, setLoading] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

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
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        setFormError(result.error);
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

  return (
    <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Sign in to APIArena
          </h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Access the API marketplace and developer portal
          </p>
        </div>

        {registered && (
          <div className="bg-[#151B2B]/60 backdrop-blur-xl border border-[#10B981]/30 rounded-2xl p-4">
            <p className="text-sm text-[#10B981]">
              Account created successfully! Please sign in.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-[#151B2B]/60 backdrop-blur-xl border border-red-500/30 rounded-2xl p-4">
            <p className="text-sm text-red-400">
              {error === "Configuration"
                ? "Authentication is not properly configured. Please check your environment variables."
                : error === "AccessDenied"
                ? "Access denied. Please try again."
                : "An error occurred during sign in. Please try again."}
            </p>
          </div>
        )}

        {formError && (
          <div className="bg-[#151B2B]/60 backdrop-blur-xl border border-red-500/30 rounded-2xl p-4">
            <p className="text-sm text-red-400">{formError}</p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleEmailSignIn}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-[rgba(255,255,255,0.05)] rounded-lg bg-[#151B2B] text-white placeholder-gray-500 focus:ring-2 focus:ring-[#4F7FFF] focus:border-transparent outline-none"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-[rgba(255,255,255,0.05)] rounded-lg bg-[#151B2B] text-white placeholder-gray-500 focus:ring-2 focus:ring-[#4F7FFF] focus:border-transparent outline-none"
                  placeholder="Enter your password"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 border-[rgba(255,255,255,0.05)] rounded bg-[#151B2B] text-[#4F7FFF] focus:ring-[#4F7FFF]"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-400">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <Link href="/auth/forgot-password" className="text-[#4F7FFF] hover:text-[#6B92FF]">
                Forgot password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading !== null}
              className="w-full px-6 py-3 bg-[#4F7FFF] hover:bg-[#6B92FF] text-white rounded-lg font-medium transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(79,127,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading === "credentials" ? (
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-400">
              Don't have an account?{" "}
              <Link href="/auth/signup" className="text-[#4F7FFF] hover:text-[#6B92FF] font-medium">
                Sign up for free
              </Link>
            </p>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[rgba(255,255,255,0.05)]"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#0A0E1A] text-gray-400">Or continue with</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              onClick={() => handleOAuthSignIn("google")}
              disabled={loading !== null}
              className="px-6 py-3 bg-transparent border border-[rgba(255,255,255,0.05)] text-gray-300 rounded-lg font-medium hover:bg-[#151B2B] hover:border-[rgba(79,127,255,0.1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading === "google" ? (
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-gray-300"></div>
              ) : (
                <>
                  <Mail className="w-5 h-5" />
                  Google
                </>
              )}
            </button>

            <button
              onClick={() => handleOAuthSignIn("github")}
              disabled={loading !== null}
              className="px-6 py-3 bg-transparent border border-[rgba(255,255,255,0.05)] text-gray-300 rounded-lg font-medium hover:bg-[#151B2B] hover:border-[rgba(79,127,255,0.1)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading === "github" ? (
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-gray-300"></div>
              ) : (
                <>
                  <Github className="w-5 h-5" />
                  GitHub
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
