"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Home } from "lucide-react";

export default function AuthErrorClient() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    Configuration:
      "There is a problem with the server configuration. Please contact support if this problem persists.",
    AccessDenied:
      "You do not have permission to sign in. Please contact an administrator.",
    Verification:
      "The verification token has expired or has already been used.",
    CredentialsSignin: "Invalid email or password. Please try again.",
    OAuthSignin:
      "Sign-in with the provider could not be started. Please try again or use email/password.",
    OAuthCallback:
      "Sign-in callback failed. Please try again or use a different sign-in method.",
    OAuthCreateAccount:
      "Could not create an account with this provider. Try signing in with email first.",
    OAuthAccountNotLinked:
      "This email is already used with another sign-in method. Use the same method you signed up with.",
    Callback:
      "Authentication callback failed. Please try again.",
    Default: "An unexpected error occurred during authentication.",
  };

  const errorMessage = error
    ? errorMessages[error] ?? errorMessages.Default
    : errorMessages.Default;

  return (
    <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
          <h2 className="mt-6 text-2xl sm:text-3xl font-extrabold text-white">
            Authentication Error
          </h2>
          <p className="mt-2 text-sm sm:text-base text-gray-400">
            {errorMessage}
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <Link
            href="/auth/signin"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Try Again
          </Link>
          <Link
            href="/"
            className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 dark:border-gray-700 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Link>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-[#151B2B]/60 border border-[rgba(255,255,255,0.08)] rounded-lg">
            <p className="text-xs text-gray-400">
              Error code: <code className="font-mono text-gray-300">{error}</code>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
