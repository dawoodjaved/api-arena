export const PLANS = {
  free: {
    name: "Free",
    price: 0,
    requests: 100,
    rateLimit: "100 requests/hour",
    features: ["Basic support", "Public APIs only"],
  },
  pro: {
    name: "Pro",
    price: 49,
    requests: 10000,
    rateLimit: "10k requests/hour",
    features: [
      "Priority support",
      "All APIs",
      "Advanced analytics",
      "SLA guarantee",
    ],
  },
  enterprise: {
    name: "Enterprise",
    price: "Custom" as const,
    requests: Infinity,
    rateLimit: "Unlimited",
    features: [
      "Dedicated support",
      "Custom contracts",
      "White-label options",
      "Custom integrations",
    ],
  },
} as const;
