import Stripe from "stripe";
import { PLANS } from "./plans";

export { PLANS };

function readStripeKey(): string | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return null;
  if (
    key.includes("placeholder") ||
    key.includes("your_") ||
    key.includes("xxx") ||
    key === "sk_test_" ||
    key.length < 20
  ) {
    return null;
  }
  return key;
}

export function isStripeConfigured(): boolean {
  return Boolean(readStripeKey());
}

const stripeKey = readStripeKey() || "sk_test_placeholder_not_configured";

export const stripe = new Stripe(stripeKey, {
  apiVersion: "2025-12-15.clover",
});
