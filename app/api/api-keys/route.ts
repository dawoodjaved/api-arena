import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateApiKey } from "@/lib/utils";
import { z } from "zod";

const createKeySchema = z.object({
  name: z.string().min(1),
  apiId: z.string().optional(),
  scopes: z.array(z.string()).optional(),
  environment: z.enum(["development", "staging", "production"]).default("production"),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json([]);
    }

    const keys = await prisma.aPIKey.findMany({
      where: { userId: session.user.id },
      include: {
        api: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(keys);
  } catch (error) {
    console.error("Error fetching API keys:", error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = createKeySchema.parse(body);

    // If apiId is provided, verify it exists and user has access
    if (validated.apiId) {
      const api = await prisma.aPI.findUnique({
        where: { id: validated.apiId },
      });

      if (!api) {
        return NextResponse.json(
          { error: "API not found" },
          { status: 404 }
        );
      }

      // Check if user has subscription or is the owner
      if (api.userId !== session.user.id) {
        const subscription = await prisma.subscription.findFirst({
          where: {
            userId: session.user.id,
            apiId: validated.apiId,
            status: "active",
          },
        });

        if (!subscription) {
          return NextResponse.json(
            { error: "You need to subscribe to this API first" },
            { status: 403 }
          );
        }
      }
    }

    const key = generateApiKey();

    const apiKey = await prisma.aPIKey.create({
      data: {
        key,
        name: validated.name,
        userId: session.user.id,
        apiId: validated.apiId || "",
        scopes: validated.scopes || [],
        environment: validated.environment,
      },
      include: {
        api: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json(apiKey, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Error creating API key:", error);
    return NextResponse.json(
      { error: "Failed to create API key" },
      { status: 500 }
    );
  }
}
