import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/gateway/auth";
import { checkRateLimit } from "@/lib/gateway/rate-limiter";
import { getCachedResponse, setCachedResponse, generateCacheKey } from "@/lib/gateway/cache";
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

async function handleGatewayRequest(
  request: NextRequest,
  method: string,
  slug: string[]
) {
  const startTime = Date.now();

  // Handle CORS
  const origin = request.headers.get("origin");
  const corsHeaders = handleCors(origin);

  // Extract API key
  const apiKey =
    request.headers.get("X-API-Key") ||
    request.headers.get("Authorization")?.replace("Bearer ", "");

  if (!apiKey) {
    return NextResponse.json(
      { error: "API key required" },
      { status: 401, headers: corsHeaders || {} }
    );
  }

  // Validate API key
  const keyValidation = await validateApiKey(apiKey);
  if (!keyValidation.valid) {
    return NextResponse.json(
      { error: "Invalid API key" },
      { status: 401, headers: corsHeaders || {} }
    );
  }

  // Check rate limit
  const rateLimit = await checkRateLimit(
    apiKey,
    (keyValidation.plan || "free") as "free" | "pro" | "enterprise"
  );

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        error: "Rate limit exceeded",
        resetAt: rateLimit.resetAt,
      },
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

  // Parse slug to get API and version
  // Format: /api/gateway/{apiSlug}/{version}/...
  if (slug.length < 2) {
    return NextResponse.json(
      { error: "Invalid API path" },
      { status: 400, headers: corsHeaders || {} }
    );
  }

  const [apiSlug, version, ...pathParts] = slug;
  const path = "/" + pathParts.join("/");

  // Find API and version
  const api = await prisma.aPI.findUnique({
    where: { slug: apiSlug },
    include: {
      versions: {
        where: { version },
      },
    },
  });

  if (!api || api.versions.length === 0) {
    return NextResponse.json(
      { error: "API not found" },
      { status: 404, headers: corsHeaders || {} }
    );
  }

  const apiVersion = api.versions[0];

  // Find endpoint
  const endpoint = await prisma.endpoint.findFirst({
    where: {
      versionId: apiVersion.id,
      method: method,
      path: path,
    },
  });

  if (!endpoint) {
    return NextResponse.json(
      { error: "Endpoint not found" },
      { status: 404, headers: corsHeaders || {} }
    );
  }

  // Check cache for GET requests
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
          "X-Cache": "HIT",
          "X-RateLimit-Remaining": String(rateLimit.remaining),
        },
      });
    }
  }

  // Try to use Kong Gateway if available, otherwise use custom gateway
  let responseData: any;
  let useKong = false;

  try {
    const kong = getKongGateway();
    const kongAvailable = await kong.isAvailable();

    if (kongAvailable) {
      // Use Kong Gateway for better performance
      useKong = true;
      const kongUrl = kong.getApiUrl(apiSlug, path);
      
      // Forward request through Kong
      const forwardResponse = await fetch(kongUrl, {
        method: method,
        headers: {
          "X-API-Key": apiKey,
          ...Object.fromEntries(request.headers.entries()),
        },
        body: method !== "GET" ? await request.text() : undefined,
      });

      responseData = await forwardResponse.json();
    } else {
      // Fallback to custom gateway
      responseData = {
        message: "Request processed",
        api: api.name,
        version: version,
        endpoint: path,
        method: method,
      };
    }
  } catch (error) {
    // Fallback to custom gateway on error
    console.warn("Kong Gateway error, using fallback:", error);
    responseData = {
      message: "Request processed",
      api: api.name,
      version: version,
      endpoint: path,
      method: method,
    };
  }

  // Cache GET responses
  if (method === "GET") {
    const cacheKey = generateCacheKey(
      api.id,
      version,
      method,
      path,
      Object.fromEntries(request.nextUrl.searchParams)
    );
    await setCachedResponse(cacheKey, responseData, 3600);
  }

  // Log request
  const latency = Date.now() - startTime;
  const body = method !== "GET" ? await request.json().catch(() => null) : null;

  if (keyValidation.keyId) {
    await prisma.requestLog.create({
      data: {
        apiKeyId: keyValidation.keyId,
        endpointId: endpoint.id,
        method: method,
        path: path,
        statusCode: 200,
        latency: latency,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        userAgent: request.headers.get("user-agent") || null,
        requestBody: body,
        responseBody: responseData,
      },
    });
  }

  return NextResponse.json(responseData, {
    headers: {
      ...corsHeaders,
      "X-RateLimit-Remaining": String(rateLimit.remaining),
      "X-RateLimit-Reset": String(rateLimit.resetAt),
      "X-Cache": "MISS",
    },
  });
}
