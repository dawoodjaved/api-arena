import { Suspense } from "react";
import CompareClient from "./compare-client";

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center text-gray-400">
          Loading…
        </div>
      }
    >
      <CompareClient />
    </Suspense>
  );
}
