import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, hasScope } from "@/lib/gateway/auth";
import { checkRateLimit } from "@/lib/gateway/rate-limiter";
import {
  getCachedResponse,
  setCachedResponse,
  generateCacheKey,
} from "@/lib/gateway/cache";
import { handleCors } from "@/lib/gateway/cors";
import { getKongGateway } from "@/lib/gateway/kong";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  return handleGatewayRequest(request, "GET", params.slug);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  return handleGatewayRequest(request, "POST", params.slug);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  return handleGatewayRequest(request, "PUT", params.slug);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  return handleGatewayRequest(request, "DELETE", params.slug);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string[] } }
) {
  return handleGatewayRequest(request, "PATCH", params.slug);
}

export async function OPTIONS(request: NextRequest) {
  const corsHeaders = handleCors(request.headers.get("origin") || null);
  if (corsHeaders) {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  }
  return new NextResponse(null, { status: 403 });
}

function matchEndpointPath(
  registered: string,
  actual: string
): boolean {
  if (registered === actual) return true;
  const regParts = registered.split("/").filter(Boolean);
  const actParts = actual.split("/").filter(Boolean);
  if (regParts.length !== actParts.length) return false;
  return regParts.every(
    (p, i) => p.startsWith("{") || p.startsWith(":") || p === actParts[i]
  );
}

function resolveUpstream(
  api: { baseUrl: string | null },
  openApiSpec: any
): string | null {
  if (api.baseUrl) return api.baseUrl.replace(/\/$/, "");
  const serverUrl = openApiSpec?.servers?.[0]?.url;
  if (typeof serverUrl === "string" && serverUrl) {
    return serverUrl.replace(/\/$/, "");
  }
  return null;
}

async function handleGatewayRequest(
  request: NextRequest,
  method: string,
  slug: string[]
) {
  const startTime = Date.now();
  const origin = request.headers.get("origin");
  const corsHeaders = handleCors(origin) || {};

  const apiKey =
    request.headers.get("X-API-Key") ||
    request.headers.get("Authorization")?.replace(/^Bearer\s+/i, "");

  if (!apiKey) {
    return NextResponse.json(
      { error: "API key required" },
      { status: 401, headers: corsHeaders }
    );
  }

  const keyValidation = await validateApiKey(apiKey);
  if (!keyValidation.valid) {
    return NextResponse.json(
      { error: "Invalid API key" },
      { status: 401, headers: corsHeaders }
    );
  }

  if (!hasScope(keyValidation.scopes, method)) {
    return NextResponse.json(
      { error: "Insufficient scope for this method" },
      { status: 403, headers: corsHeaders }
    );
  }

  const rateLimit = await checkRateLimit(
    keyValidation.keyId || apiKey,
    (keyValidation.plan || "free") as "free" | "pro" | "enterprise"
  );

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded", resetAt: rateLimit.resetAt },
      {
        status: 429,
        headers: {
          ...corsHeaders,
          "X-RateLimit-Remaining": String(rateLimit.remaining),
          "X-RateLimit-Reset": String(rateLimit.resetAt),
        },
      }
    );
  }

  if (slug.length < 2) {
    return NextResponse.json(
      { error: "Invalid API path. Use /api/gateway/{slug}/{version}/..." },
      { status: 400, headers: corsHeaders }
    );
  }

  const [apiSlug, version, ...pathParts] = slug;
  const path = "/" + pathParts.join("/");
  const query = request.nextUrl.search;

  const api = await prisma.aPI.findUnique({
    where: { slug: apiSlug },
    include: {
      versions: { where: { version } },
    },
  });

  if (!api || api.versions.length === 0) {
    return NextResponse.json(
      { error: "API not found" },
      { status: 404, headers: corsHeaders }
    );
  }

  if (keyValidation.apiId && keyValidation.apiId !== api.id) {
    return NextResponse.json(
      { error: "API key is not authorized for this API" },
      { status: 403, headers: corsHeaders }
    );
  }

  const apiVersion = api.versions[0];
  const deprecationHeaders: Record<string, string> = {};
  if (apiVersion.isDeprecated) {
    deprecationHeaders["Deprecation"] = "true";
    if (apiVersion.deprecationDate) {
      deprecationHeaders["Sunset"] = apiVersion.deprecationDate.toUTCString();
    }
  }

  const endpoints = await prisma.endpoint.findMany({
    where: { versionId: apiVersion.id, method },
  });
  const endpoint =
    endpoints.find((e) => matchEndpointPath(e.path, path)) || null;

  if (!endpoint) {
    return NextResponse.json(
      { error: "Endpoint not found" },
      { status: 404, headers: corsHeaders }
    );
  }

  let requestBodyText: string | undefined;
  if (method !== "GET" && method !== "HEAD") {
    requestBodyText = await request.text();
  }

  if (method === "GET") {
    const cacheKey = generateCacheKey(
      api.id,
      version,
      method,
      path,
      Object.fromEntries(request.nextUrl.searchParams)
    );
    const cached = await getCachedResponse(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          ...corsHeaders,
          ...deprecationHeaders,
          "X-Cache": "HIT",
          "X-RateLimit-Remaining": String(rateLimit.remaining),
        },
      });
    }
  }

  let statusCode = 200;
  let responseData: any;
  let responseText: string | null = null;

  const upstream = resolveUpstream(api, apiVersion.openApiSpec);
  // Never forward the Endpointly API key to upstream — it was only used for gateway auth.
  const forwardHeaders: Record<string, string> = {
    "Content-Type": request.headers.get("content-type") || "application/json",
    Accept: request.headers.get("accept") || "application/json",
    "User-Agent": "Endpointly-Gateway/1.0",
  };
  if (keyValidation.userId) {
    forwardHeaders["X-Endpointly-User-Id"] = keyValidation.userId;
  }
  if (keyValidation.keyId) {
    forwardHeaders["X-Endpointly-Key-Id"] = keyValidation.keyId;
  }

  try {
    const kong = getKongGateway();
    const kongAvailable = await kong.isAvailable();

    if (kongAvailable) {
      const kongUrl = kong.getApiUrl(apiSlug, path) + query;
      const forwardResponse = await fetch(kongUrl, {
        method,
        headers: forwardHeaders,
        body: requestBodyText,
      });
      statusCode = forwardResponse.status;
      responseText = await forwardResponse.text();
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { raw: responseText };
      }
    } else if (upstream) {
      const targetUrl = `${upstream}${path}${query}`;
      const forwardResponse = await fetch(targetUrl, {
        method,
        headers: forwardHeaders,
        body: requestBodyText,
      });
      statusCode = forwardResponse.status;
      responseText = await forwardResponse.text();
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { raw: responseText };
      }
    } else {
      statusCode = 200;
      responseData = {
        message: "Request accepted (no upstream configured)",
        api: api.name,
        version,
        endpoint: path,
        method,
        hint: "Set baseUrl on the API or servers[0].url in the OpenAPI spec to proxy upstream.",
      };
    }
  } catch (error: any) {
    console.warn("Gateway proxy error:", error);
    statusCode = 502;
    responseData = {
      error: "Upstream request failed",
      detail: error?.message || "Unknown error",
    };
  }

  if (method === "GET" && statusCode >= 200 && statusCode < 300) {
    const cacheKey = generateCacheKey(
      api.id,
      version,
      method,
      path,
      Object.fromEntries(request.nextUrl.searchParams)
    );
    await setCachedResponse(cacheKey, responseData, 3600);
  }

  const latency = Date.now() - startTime;
  let requestBodyJson: any = null;
  if (requestBodyText) {
    try {
      requestBodyJson = JSON.parse(requestBodyText);
    } catch {
      requestBodyJson = { raw: requestBodyText.slice(0, 2000) };
    }
  }

  if (keyValidation.keyId) {
    await prisma.requestLog.create({
      data: {
        apiKeyId: keyValidation.keyId,
        endpointId: endpoint.id,
        method,
        path,
        statusCode,
        latency,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || null,
        requestBody: requestBodyJson,
        responseBody:
          typeof responseData === "object"
            ? responseData
            : { raw: String(responseData).slice(0, 2000) },
      },
    });
  }

  if (responseText !== null && typeof responseData?.raw === "string") {
    return new NextResponse(responseText, {
      status: statusCode,
      headers: {
        ...corsHeaders,
        ...deprecationHeaders,
        "Content-Type": "text/plain",
        "X-RateLimit-Remaining": String(rateLimit.remaining),
        "X-RateLimit-Reset": String(rateLimit.resetAt),
        "X-Cache": "MISS",
      },
    });
  }

  return NextResponse.json(responseData, {
    status: statusCode,
    headers: {
      ...corsHeaders,
      ...deprecationHeaders,
      "X-RateLimit-Remaining": String(rateLimit.remaining),
      "X-RateLimit-Reset": String(rateLimit.resetAt),
      "X-Cache": "MISS",
    },
  });
}
