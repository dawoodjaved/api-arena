import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { openApiSpec, apiName, apiDescription, category } = body;

    if (!openApiSpec || !apiName) {
      return NextResponse.json(
        { error: "OpenAPI spec and API name are required" },
        { status: 400 }
      );
    }

    // Validate OpenAPI spec structure
    if (!openApiSpec.openapi && !openApiSpec.swagger) {
      return NextResponse.json(
        { error: "Invalid OpenAPI specification" },
        { status: 400 }
      );
    }

    const version = openApiSpec.info?.version || "1.0.0";
    const slug = slugify(apiName);

    // Check if API already exists
    let api = await prisma.aPI.findUnique({
      where: { slug },
    });

    if (!api) {
      // Create new API
      api = await prisma.aPI.create({
        data: {
          name: apiName,
          slug,
          description: apiDescription || openApiSpec.info?.description || "",
          category: category || "Other",
          userId: session.user.id,
          isPublic: true,
          isApproved: false,
        },
      });
    }

    // Check if version already exists
    const existingVersion = await prisma.aPIVersion.findFirst({
      where: {
        apiId: api.id,
        version,
      },
    });

    if (existingVersion) {
      return NextResponse.json(
        { error: `Version ${version} already exists for this API` },
        { status: 400 }
      );
    }

    // Extract endpoints from OpenAPI spec
    const paths = openApiSpec.paths || {};
    const endpoints: Array<{
      method: string;
      path: string;
      description?: string;
    }> = [];

    for (const [path, methods] of Object.entries(paths)) {
      if (typeof methods === "object" && methods !== null) {
        for (const [method, operation] of Object.entries(methods)) {
          if (
            ["get", "post", "put", "delete", "patch"].includes(
              method.toLowerCase()
            )
          ) {
            endpoints.push({
              method: method.toUpperCase(),
              path,
              description:
                (operation as any)?.summary ||
                (operation as any)?.description ||
                undefined,
            });
          }
        }
      }
    }

    // Create API version
    const apiVersion = await prisma.aPIVersion.create({
      data: {
        apiId: api.id,
        version,
        openApiSpec: openApiSpec as any,
        changelog: `Initial version ${version} imported from OpenAPI spec`,
      },
    });

    // Create endpoints
    await prisma.endpoint.createMany({
      data: endpoints.map((endpoint) => ({
        versionId: apiVersion.id,
        method: endpoint.method,
        path: endpoint.path,
        description: endpoint.description,
      })),
    });

    return NextResponse.json(
      {
        api,
        version: apiVersion,
        endpointsCreated: endpoints.length,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error importing OpenAPI spec:", error);
    return NextResponse.json(
      { error: "Failed to import OpenAPI spec" },
      { status: 500 }
    );
  }
}
