import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/get-session";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateSDK, SDKLanguage } from "@/lib/services/sdk-generator";
import { z } from "zod";

const generateSDKSchema = z.object({
  language: z.enum([
    "javascript",
    "typescript",
    "python",
    "ruby",
    "go",
    "php",
    "java",
    "csharp",
    "swift",
    "kotlin",
    "rust",
  ]),
  version: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { apiId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = generateSDKSchema.parse(body);

    // Get API and version
    const api = await prisma.aPI.findUnique({
      where: { id: params.apiId },
      include: {
        versions: {
          where: validated.version
            ? { version: validated.version }
            : undefined,
          orderBy: { createdAt: "desc" },
          take: 1,
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

    // Generate SDK
    const sdk = await generateSDK(
      openApiSpec,
      validated.language,
      api.name
    );

    return NextResponse.json({
      code: sdk.code,
      language: sdk.language,
      filename: sdk.filename,
      apiName: api.name,
      version: apiVersion.version,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error generating SDK:", error);
    return NextResponse.json(
      { error: "Failed to generate SDK" },
      { status: 500 }
    );
  }
}
