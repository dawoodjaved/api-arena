"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { CheckCircle2 } from "lucide-react";
import { PLANS } from "@/lib/stripe";

export default function BillingPage() {
  const { data: session } = useSession();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch("/api/subscriptions");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setSubscriptions(data);
        } else {
          setSubscriptions([]);
        }
      } else {
        setSubscriptions([]);
      }
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan: string) => {
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      if (res.ok) {
        const { url } = await res.json();
        window.location.href = url;
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#4F7FFF]"></div>
          <p className="mt-4 text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0E1A]">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <h1 className="text-6xl font-bold mb-8 leading-tight">
          Billing & Subscriptions
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {Object.entries(PLANS).map(([key, plan]) => {
            const isCurrentPlan = subscriptions.some(
              (s) => s.plan === key && s.status === "active"
            );

            return (
              <div
                key={key}
                className={`bg-[#151B2B] border rounded-2xl p-8 backdrop-blur-xl transition-all ${
                  isCurrentPlan
                    ? "border-[#4F7FFF] shadow-[0_8px_32px_rgba(79,127,255,0.15)]"
                    : "border-[rgba(255,255,255,0.05)] hover:border-[rgba(79,127,255,0.2)] hover:-translate-y-1"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-white">{plan.name}</h3>
                  {isCurrentPlan && (
                    <span className="px-3 py-1 bg-[#10B981]/20 text-[#10B981] rounded-full text-sm border border-[#10B981]/30">
                      Current
                    </span>
                  )}
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">
                    {typeof plan.price === "number" ? `$${plan.price}` : plan.price}
                  </span>
                  {typeof plan.price === "number" && (
                    <span className="text-gray-400 ml-2">/month</span>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start text-sm text-gray-300">
                      <CheckCircle2 className="w-5 h-5 text-[#10B981] mr-2 flex-shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {!isCurrentPlan && key !== "free" && (
                  <button
                    onClick={() => handleUpgrade(key)}
                    className="w-full px-4 py-3 bg-[#4F7FFF] hover:bg-[#6B92FF] text-white rounded-lg font-medium transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(79,127,255,0.3)]"
                  >
                    {key === "enterprise" ? "Contact Sales" : "Upgrade"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-[#151B2B] border border-[rgba(255,255,255,0.05)] rounded-2xl p-8 backdrop-blur-xl">
          <h2 className="text-2xl font-semibold text-white mb-4">Payment Methods</h2>
          <p className="text-gray-400">Manage your payment methods and billing information</p>
        </div>
      </div>
    </div>
  );
}
