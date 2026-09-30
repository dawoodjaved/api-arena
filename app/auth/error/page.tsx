import { Suspense } from "react";
import AuthErrorClient from "./error-client";

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center text-gray-400">
          Loading…
        </div>
      }
    >
      <AuthErrorClient />
    </Suspense>
  );
}
