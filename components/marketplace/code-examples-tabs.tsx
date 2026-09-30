"use client";

import { useEffect, useState } from "react";

interface CodeExample {
  language: string;
  label: string;
  code: string;
}

export function CodeExamplesTabs({
  apiId,
  version,
}: {
  apiId: string;
  version: string;
}) {
  const [examples, setExamples] = useState<CodeExample[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/apis/${apiId}/code-examples?version=${encodeURIComponent(version)}`)
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.examples || [];
        setExamples(list);
      })
      .catch(() => setExamples([]))
      .finally(() => setLoading(false));
  }, [apiId, version]);

  if (loading) return <p className="text-gray-400 text-sm">Loading examples…</p>;
  if (!examples.length) {
    return <p className="text-gray-400 text-sm">No code examples available.</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        {examples.map((ex, i) => (
          <button
            key={ex.language}
            type="button"
            onClick={() => setActive(i)}
            className={`px-3 py-1.5 rounded-lg text-sm ${
              active === i
                ? "bg-[#4F7FFF] text-white"
                : "bg-[#0A0E1A] text-gray-400 border border-[rgba(255,255,255,0.05)]"
            }`}
          >
            {ex.label || ex.language}
          </button>
        ))}
      </div>
      <pre className="p-4 rounded-lg bg-[#0A0E1A] border border-[rgba(255,255,255,0.05)] text-sm text-gray-300 overflow-x-auto max-h-96">
        {examples[active]?.code}
      </pre>
    </div>
  );
}
