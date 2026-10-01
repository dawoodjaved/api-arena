"use client";

interface CompareApi {
  id: string;
  name: string;
  slug: string;
  category: string;
  description?: string;
  rating?: number;
  avgRating?: number;
  reviewCount?: number;
  isFeatured?: boolean;
  arenaScore?: number;
  tryReady?: boolean;
  endpointCount?: number;
  authType?: string | null;
  https?: boolean | null;
  hasOpenApi?: boolean;
  subscriberCount?: number;
  subscriptionCount?: number;
  usageCalls?: number;
}

export function ApiComparison({ apis }: { apis: CompareApi[] }) {
  if (!apis.length) {
    return <p className="text-ink-muted">Select 2–3 APIs to compare.</p>;
  }

  const rows: Array<{ label: string; get: (a: CompareApi) => string }> = [
    { label: "Name", get: (a) => a.name },
    { label: "Category", get: (a) => a.category },
    {
      label: "Arena Score",
      get: (a) => String(a.arenaScore ?? 0),
    },
    {
      label: "Try-ready",
      get: (a) => (a.tryReady ? "Yes" : "No"),
    },
    {
      label: "Endpoints",
      get: (a) => String(a.endpointCount ?? 0),
    },
    {
      label: "Auth",
      get: (a) => a.authType || "unknown",
    },
    {
      label: "HTTPS",
      get: (a) => (a.https === false ? "No" : "Yes"),
    },
    {
      label: "OpenAPI",
      get: (a) => (a.hasOpenApi ? "Yes" : "No"),
    },
    {
      label: "Rating",
      get: (a) =>
        `${(a.rating ?? a.avgRating ?? 0).toFixed(1)} (${a.reviewCount ?? 0})`,
    },
    {
      label: "Subscribers",
      get: (a) => String(a.subscriberCount ?? a.subscriptionCount ?? 0),
    },
    {
      label: "Gateway calls",
      get: (a) => String(a.usageCalls ?? 0),
    },
    {
      label: "Featured",
      get: (a) => (a.isFeatured ? "Yes" : "No"),
    },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr>
            <th className="border-b border-[rgba(11,18,32,0.08)] p-3 font-medium text-ink-muted">
              Feature
            </th>
            {apis.map((a) => (
              <th
                key={a.id}
                className="border-b border-[rgba(11,18,32,0.08)] p-3 font-semibold text-ink"
              >
                <a
                  href={`/marketplace/api/${a.slug}`}
                  className="hover:text-accent"
                >
                  {a.name}
                </a>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <td className="border-b border-[rgba(11,18,32,0.08)] p-3 text-ink-muted">
                {row.label}
              </td>
              {apis.map((a) => (
                <td
                  key={a.id + row.label}
                  className="border-b border-[rgba(11,18,32,0.08)] p-3 text-ink-soft"
                >
                  {row.get(a)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
