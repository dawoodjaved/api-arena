"use client";

import { useState } from "react";
import { Play, Copy, Download, Code, CheckCircle2 } from "lucide-react";
import {
  ArrowRightIcon,
  CodeBracketIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

interface APIPlaygroundProps {
  apiKey?: string;
  apiSlug?: string;
  version?: string;
  endpoints?: Array<{
    method: string;
    path: string;
    description?: string;
  }>;
}

export function APIPlayground({
  apiKey,
  apiSlug,
  version = "1.0.0",
  endpoints = [],
}: APIPlaygroundProps) {
  const [selectedMethod, setSelectedMethod] = useState("GET");
  const [selectedPath, setSelectedPath] = useState(endpoints[0]?.path || "/");
  const [requestBody, setRequestBody] = useState("");
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [requestHistory, setRequestHistory] = useState<any[]>([]);

  const handleSendRequest = async () => {
    if (!apiKey || !apiSlug) {
      alert("API key and API slug are required");
      return;
    }

    setLoading(true);
    try {
      const url = `/api/gateway/${apiSlug}/${version}${selectedPath}`;
      const options: RequestInit = {
        method: selectedMethod,
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
        },
      };

      if (selectedMethod !== "GET" && requestBody) {
        options.body = requestBody;
      }

      const res = await fetch(url, options);
      const data = await res.json();

      const requestInfo = {
        method: selectedMethod,
        path: selectedPath,
        status: res.status,
        timestamp: new Date().toISOString(),
        response: data,
      };

      setResponse(requestInfo);
      setRequestHistory([requestInfo, ...requestHistory.slice(0, 9)]);
    } catch (error) {
      setResponse({
        error: error instanceof Error ? error.message : "Request failed",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
    }
  };

  const generateCurl = () => {
    if (!apiKey || !apiSlug) return "";
    
    const url = `https://api.apiarena.com/api/gateway/${apiSlug}/${version}${selectedPath}`;
    let curl = `curl -X ${selectedMethod} "${url}" \\\n  -H "X-API-Key: ${apiKey}"`;
    
    if (selectedMethod !== "GET" && requestBody) {
      curl += ` \\\n  -H "Content-Type: application/json" \\\n  -d '${requestBody}'`;
    }
    
    return curl;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#151B2B] border border-[rgba(255,255,255,0.05)] rounded-2xl p-6 backdrop-blur-xl">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-white mb-2 flex items-center gap-2">
          <CodeBracketIcon className="w-6 h-6 text-[#4F7FFF]" />
          API Playground
        </h2>
        <p className="text-gray-400">Test your API endpoints interactively</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Builder */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Method
            </label>
            <div className="flex gap-2">
              {["GET", "POST", "PUT", "DELETE", "PATCH"].map((method) => (
                <button
                  key={method}
                  onClick={() => setSelectedMethod(method)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    selectedMethod === method
                      ? "bg-[#4F7FFF] text-white"
                      : "bg-[#0A0E1A] text-gray-400 border border-[rgba(255,255,255,0.05)] hover:border-[rgba(79,127,255,0.2)]"
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Endpoint
            </label>
            {endpoints.length > 0 ? (
              <select
                value={selectedPath}
                onChange={(e) => setSelectedPath(e.target.value)}
                className="w-full px-4 py-2 border border-[rgba(255,255,255,0.05)] rounded-lg bg-[#0A0E1A] text-white focus:ring-2 focus:ring-[#4F7FFF] focus:border-transparent outline-none"
              >
                {endpoints.map((endpoint, idx) => (
                  <option key={idx} value={endpoint.path}>
                    {endpoint.method} {endpoint.path}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={selectedPath}
                onChange={(e) => setSelectedPath(e.target.value)}
                placeholder="/endpoint/path"
                className="w-full px-4 py-2 border border-[rgba(255,255,255,0.05)] rounded-lg bg-[#0A0E1A] text-white placeholder-gray-500 focus:ring-2 focus:ring-[#4F7FFF] focus:border-transparent outline-none"
              />
            )}
          </div>

          {selectedMethod !== "GET" && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Request Body (JSON)
              </label>
              <textarea
                value={requestBody}
                onChange={(e) => setRequestBody(e.target.value)}
                placeholder='{"key": "value"}'
                rows={8}
                className="w-full px-4 py-2 border border-[rgba(255,255,255,0.05)] rounded-lg bg-[#0A0E1A] text-white font-mono text-sm placeholder-gray-500 focus:ring-2 focus:ring-[#4F7FFF] focus:border-transparent outline-none"
              />
            </div>
          )}

          <button
            onClick={handleSendRequest}
            disabled={loading || !apiKey}
            className="w-full px-6 py-3 bg-[#4F7FFF] hover:bg-[#6B92FF] text-white rounded-lg font-medium transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(79,127,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Sending...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Send Request
              </>
            )}
          </button>

          {/* cURL Command */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-300">
                cURL Command
              </label>
              <button
                onClick={() => copyToClipboard(generateCurl())}
                className="text-[#4F7FFF] hover:text-[#6B92FF] text-sm flex items-center gap-1"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <pre className="w-full px-4 py-3 border border-[rgba(255,255,255,0.05)] rounded-lg bg-[#0A0E1A] text-gray-300 font-mono text-xs overflow-x-auto">
              {generateCurl() || "Select method and endpoint to generate cURL"}
            </pre>
          </div>
        </div>

        {/* Response Viewer */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <DocumentTextIcon className="w-5 h-5" />
              Response
            </label>
            <div className="w-full h-96 px-4 py-3 border border-[rgba(255,255,255,0.05)] rounded-lg bg-[#0A0E1A] text-gray-300 font-mono text-xs overflow-auto">
              {response ? (
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(response, null, 2)}
                </pre>
              ) : (
                <div className="text-gray-500 text-center py-12">
                  Send a request to see the response here
                </div>
              )}
            </div>
          </div>

          {/* Request History */}
          {requestHistory.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Request History
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {requestHistory.map((req, idx) => (
                  <button
                    key={idx}
                    onClick={() => setResponse(req)}
                    className="w-full text-left px-3 py-2 border border-[rgba(255,255,255,0.05)] rounded-lg bg-[#0A0E1A] hover:border-[rgba(79,127,255,0.2)] transition-all"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#4F7FFF] font-medium">
                        {req.method}
                      </span>
                      <span className="text-gray-400">{req.path}</span>
                      <span
                        className={`${
                          req.status >= 200 && req.status < 300
                            ? "text-[#10B981]"
                            : "text-red-400"
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
