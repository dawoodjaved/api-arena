"use client";

interface CompareApi {
  id: string;
  name: string;
  slug: string;
  category: string;
  description?: string;
  rating?: number;
  reviewCount?: number;
  isFeatured?: boolean;
}

export function ApiComparison({ apis }: { apis: CompareApi[] }) {
  if (!apis.length) {
    return <p className="text-ink-muted">Select 2–3 APIs to compare.</p>;
  }

  const rows: Array<{ label: string; get: (a: CompareApi) => string }> = [
    { label: "Name", get: (a) => a.name },
    { label: "Category", get: (a) => a.category },
    {
      label: "Rating",
      get: (a) => `${(a.rating ?? 0).toFixed(1)} (${a.reviewCount ?? 0})`,
    },
    {
      label: "Featured",
      get: (a) => (a.isFeatured ? "Yes" : "No"),
    },
    {
      label: "Plans",
      get: () => "Free / Pro",
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
