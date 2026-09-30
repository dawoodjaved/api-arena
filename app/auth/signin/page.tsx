import { Suspense } from "react";
import SignInClient from "./signin-client";

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center text-gray-400">
          Loading…
        </div>
      }
    >
      <SignInClient />
    </Suspense>
  );
}
