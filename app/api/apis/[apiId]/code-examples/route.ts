import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/get-session";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateCodeExamples } from "@/lib/services/code-examples";

export async function GET(
  request: NextRequest,
  { params }: { params: { apiId: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const version = searchParams.get("version");
    const endpointPath = searchParams.get("path");
    const method = searchParams.get("method");

    // Get API and version
    const api = await prisma.aPI.findUnique({
      where: { id: params.apiId },
      include: {
        versions: {
          where: version ? { version } : undefined,
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            endpoints: endpointPath && method
              ? {
                  where: {
                    path: endpointPath,
                    method: method.toUpperCase(),
                  },
                }
              : undefined,
          },
        },
      },
    });

    if (!api) {
      return NextResponse.json({ error: "API not found" }, { status: 404 });
    }

    if (api.versions.length === 0) {
      return NextResponse.json(
        { error: "No version found for this API" },
        { status: 404 }
      );
    }

    const apiVersion = api.versions[0];
    const openApiSpec = apiVersion.openApiSpec as any;

    // Get endpoint if specified
    const endpoint =
      endpointPath && method && apiVersion.endpoints.length > 0
        ? {
            method: apiVersion.endpoints[0].method,
            path: apiVersion.endpoints[0].path,
          }
        : undefined;

    // Generate code examples
    const examples = generateCodeExamples(openApiSpec, api.name, endpoint);

    return NextResponse.json({
      examples,
      apiName: api.name,
      version: apiVersion.version,
    });
  } catch (error) {
    console.error("Error generating code examples:", error);
    return NextResponse.json(
      { error: "Failed to generate code examples" },
      { status: 500 }
    );
  }
}
