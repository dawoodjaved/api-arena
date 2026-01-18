"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Plus, Trash2, Copy, Check } from "lucide-react";

export default function APIKeysPage() {
  const { data: session } = useSession();
  const [keys, setKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    try {
      const res = await fetch("/api/api-keys");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setKeys(data);
        } else {
          setKeys([]);
        }
      } else {
        setKeys([]);
      }
    } catch (error) {
      console.error("Error fetching API keys:", error);
      setKeys([]);
    } finally {
      setLoading(false);
    }
  };

  const createKey = async () => {
    const name = prompt("Enter a name for this API key:");
    if (!name) return;

    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (res.ok) {
        const newKey = await res.json();
        setKeys([...keys, newKey]);
        alert(`API Key created! Save it now: ${newKey.key}`);
      }
    } catch (error) {
      console.error("Error creating API key:", error);
    }
  };

  const deleteKey = async (id: string) => {
    if (!confirm("Are you sure you want to delete this API key?")) return;

    try {
      const res = await fetch(`/api/api-keys/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setKeys(keys.filter((k) => k.id !== id));
      }
    } catch (error) {
      console.error("Error deleting API key:", error);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-6xl font-bold mb-2 leading-tight">API Keys</h1>
            <p className="text-lg text-gray-400">Manage your API keys and access tokens</p>
          </div>
          <button
            onClick={createKey}
            className="px-6 py-3 bg-[#4F7FFF] hover:bg-[#6B92FF] text-white rounded-lg font-medium transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(79,127,255,0.3)] flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create API Key
          </button>
        </div>

        {keys.length === 0 ? (
          <div className="bg-[#151B2B] border border-[rgba(255,255,255,0.05)] rounded-2xl p-12 text-center backdrop-blur-xl">
            <p className="text-gray-400 mb-4">You don't have any API keys yet.</p>
            <button
              onClick={createKey}
              className="px-6 py-3 bg-[#4F7FFF] hover:bg-[#6B92FF] text-white rounded-lg font-medium transition-all"
            >
              Create Your First API Key
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {keys.map((key) => (
              <div
                key={key.id}
                className="bg-[#151B2B] border border-[rgba(255,255,255,0.05)] rounded-2xl p-6 backdrop-blur-xl hover:border-[rgba(79,127,255,0.2)] transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-white mb-2">{key.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="font-mono bg-[#0A0E1A] px-3 py-1 rounded border border-[rgba(255,255,255,0.05)]">
                        {key.key.substring(0, 20)}...
                      </span>
                      <span>{key.environment}</span>
                      <span>
                        Last used:{" "}
                        {key.lastUsedAt
                          ? new Date(key.lastUsedAt).toLocaleDateString()
                          : "Never"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(key.key, key.id)}
                      className="p-2 text-gray-400 hover:bg-[#0A0E1A] rounded-lg transition-colors"
                    >
                      {copied === key.id ? (
                        <Check className="w-5 h-5 text-[#10B981]" />
                      ) : (
                        <Copy className="w-5 h-5" />
                      )}
                    </button>
                    <button
                      onClick={() => deleteKey(key.id)}
                      className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
