"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Check, X } from "lucide-react";

export default function AdminAPIsPage() {
  const { data: session } = useSession();
  const [apis, setApis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAPIs();
  }, []);

  const fetchAPIs = async () => {
    try {
      const res = await fetch("/api/admin/apis");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setApis(data);
        } else {
          setApis([]);
        }
      } else {
        setApis([]);
      }
    } catch (error) {
      console.error("Error fetching APIs:", error);
      setApis([]);
    } finally {
      setLoading(false);
    }
  };

  const approveAPI = async (apiId: string) => {
    try {
      const res = await fetch(`/api/admin/apis/${apiId}/approve`, {
        method: "POST",
      });

      if (res.ok) {
        setApis(apis.map((api) => (api.id === apiId ? { ...api, isApproved: true } : api)));
      }
    } catch (error) {
      console.error("Error approving API:", error);
    }
  };

  const rejectAPI = async (apiId: string) => {
    try {
      const res = await fetch(`/api/admin/apis/${apiId}/reject`, {
        method: "POST",
      });

      if (res.ok) {
        setApis(apis.filter((api) => api.id !== apiId));
      }
    } catch (error) {
      console.error("Error rejecting API:", error);
    }
  };

  if (!session || (session.user as any)?.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
        </div>
      </div>
    );
  }

  const pendingAPIs = apis.filter((api) => !api.isApproved);

  return (
    <div className="min-h-screen bg-[#0A0E1A]">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <h1 className="text-6xl font-bold mb-8 leading-tight">API Management</h1>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#4F7FFF]"></div>
            <p className="mt-4 text-gray-400">Loading...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-white mb-4">
              Pending Approval ({pendingAPIs.length})
            </h2>
            {pendingAPIs.length === 0 ? (
              <div className="bg-[#151B2B] border border-[rgba(255,255,255,0.05)] rounded-2xl p-12 text-center backdrop-blur-xl">
                <p className="text-gray-400">No APIs pending approval</p>
              </div>
            ) : (
              pendingAPIs.map((api) => (
                <div
                  key={api.id}
                  className="bg-[#151B2B] border border-[rgba(255,255,255,0.05)] rounded-2xl p-6 backdrop-blur-xl hover:border-[rgba(79,127,255,0.2)] transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2">{api.name}</h3>
                      <p className="text-gray-400 mb-4">{api.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>Category: {api.category}</span>
                        <span>By: {api.user?.name || api.user?.email}</span>
                        <span>Created: {new Date(api.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => approveAPI(api.id)}
                        className="p-3 bg-[#10B981] hover:bg-[#059669] text-white rounded-lg transition-all hover:-translate-y-0.5"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => rejectAPI(api.id)}
                        className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all hover:-translate-y-0.5"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
