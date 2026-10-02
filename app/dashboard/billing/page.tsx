"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { PLANS } from "@/lib/plans";

export default function BillingPage() {
  const { data: session, status } = useSession();
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stripeConfigured, setStripeConfigured] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/subscriptions").then((r) => r.json()).catch(() => []),
      fetch("/api/billing/invoices").then((r) => r.json()).catch(() => []),
      fetch("/api/health").then((r) => r.json()).catch(() => null),
    ])
      .then(([subs, inv, health]) => {
        setSubscriptions(Array.isArray(subs) ? subs : []);
        setInvoices(Array.isArray(inv) ? inv : inv?.invoices || []);
        setStripeConfigured(Boolean(health?.config?.stripeConfigured));
      })
      .finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async (plan: string) => {
    if (plan === "enterprise") {
      setNotice("Email sales@apidoorway.local for Enterprise.");
      return;
    }
    if (stripeConfigured === false) {
      setNotice(
        "Stripe is not configured. Add a real STRIPE_SECRET_KEY to .env.local to enable upgrades."
      );
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setNotice(data.error || "Checkout failed");
    } finally {
      setBusy(false);
    }
  };

  const openPortal = async () => {
    if (stripeConfigured === false) {
      setNotice(
        "Stripe is not configured. Add STRIPE_SECRET_KEY to enable the customer portal."
      );
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const res = await fetch("/api/stripe/create-portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setNotice(data.error || "Portal unavailable");
    } finally {
      setBusy(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-ink-muted">
        Loading…
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Link href="/auth/signin" className="text-accent">
          Sign in
        </Link>
      </div>
    );
  }

  const hasPro = subscriptions.some(
    (s) => s.plan === "pro" && s.status === "active"
  );
  const apiSubs = subscriptions.filter(
    (s) => s.status === "active" && s.api
  );

  return (
    <div className="page-shell">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-display text-4xl font-bold text-ink">Billing</h1>
          <button
            type="button"
            onClick={openPortal}
            disabled={busy}
            className="btn btn-secondary text-sm disabled:opacity-50"
          >
            Manage in Stripe
          </button>
        </div>

        {stripeConfigured === false && (
          <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
            Stripe keys are not configured. Free API subscriptions still work;
            Pro upgrades and the customer portal need a real{" "}
            <code className="rounded bg-white/70 px-1">STRIPE_SECRET_KEY</code>.
          </div>
        )}

        {notice && (
          <div className="mb-6 rounded-xl border border-[rgba(11,18,32,0.08)] bg-surface p-4 text-sm text-ink">
            {notice}
          </div>
        )}

        <p className="mb-8 text-ink-muted">
          Current platform plan:{" "}
          <span className="font-medium text-ink">{hasPro ? "Pro" : "Free"}</span>
        </p>

        <div className="mb-10 grid gap-6 md:grid-cols-3">
          {Object.entries(PLANS).map(([key, plan]) => {
            const isCurrent =
              (key === "free" && !hasPro) ||
              subscriptions.some(
                (s) => s.plan === key && s.status === "active" && !s.apiId
              ) ||
              (key === "pro" && hasPro);
            return (
              <div
                key={key}
                className={`rounded-2xl border p-6 ${
                  isCurrent
                    ? "border-accent bg-surface shadow-soft"
                    : "border-[rgba(11,18,32,0.08)] bg-surface"
                }`}
              >
                <h3 className="mb-2 text-xl font-semibold text-ink">{plan.name}</h3>
                <p className="mb-4 text-3xl font-bold text-ink">
                  {typeof plan.price === "number" ? `$${plan.price}` : plan.price}
                  {typeof plan.price === "number" && (
                    <span className="text-sm font-normal text-ink-muted">/mo</span>
                  )}
                </p>
                <ul className="mb-6 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex gap-2 text-sm text-ink-soft">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                      {f}
                    </li>
                  ))}
                </ul>
                {!isCurrent && key !== "free" && (
                  <button
                    type="button"
                    onClick={() => handleUpgrade(key)}
                    disabled={busy}
                    className="btn btn-primary w-full disabled:opacity-50"
                  >
                    {key === "enterprise" ? "Contact sales" : "Upgrade"}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <div className="mb-10 rounded-2xl border border-[rgba(11,18,32,0.08)] bg-surface p-6 shadow-soft">
          <h2 className="mb-4 text-xl font-semibold text-ink">API subscriptions</h2>
          {apiSubs.length === 0 ? (
            <p className="text-sm text-ink-muted">
              No API subscriptions yet. Use Subscribe on a marketplace listing.
            </p>
          ) : (
            <ul className="divide-y divide-[rgba(11,18,32,0.08)]">
              {apiSubs.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-ink">{s.api?.name}</p>
                    <p className="text-ink-muted">
                      {s.plan} · {s.status}
                    </p>
                  </div>
                  {s.api?.slug && (
                    <Link
                      href={`/marketplace/api/${s.api.slug}`}
                      className="text-accent"
                    >
                      View
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-[rgba(11,18,32,0.08)] bg-surface p-6 shadow-soft">
          <h2 className="mb-4 text-xl font-semibold text-ink">Invoices</h2>
          {invoices.length === 0 ? (
            <p className="text-sm text-ink-muted">No invoices yet.</p>
          ) : (
            <ul className="space-y-3">
              {invoices.map((inv) => (
                <li
                  key={inv.id}
                  className="flex items-center justify-between border-b border-[rgba(11,18,32,0.08)] pb-3 text-sm"
                >
                  <span className="text-ink-soft">
                    ${inv.amount} {inv.currency?.toUpperCase()} · {inv.status}
                  </span>
                  {inv.stripePdfUrl ? (
                    <a
                      href={inv.stripePdfUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent"
                    >
                      PDF
                    </a>
                  ) : (
                    <span className="text-ink-faint">
                      {new Date(inv.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
