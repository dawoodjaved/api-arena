import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/get-session";
import { authOptions } from "@/lib/auth";
import { generateAuthorizationCode } from "@/lib/services/oauth2";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const authorizeSchema = z.object({
  client_id: z.string(),
  redirect_uri: z.string().url(),
  response_type: z.enum(["code"]),
  scope: z.string().optional(),
  state: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      // Redirect to login
      const loginUrl = new URL("/auth/signin", request.url);
      loginUrl.searchParams.set("callbackUrl", request.url);
      return NextResponse.redirect(loginUrl);
    }

    const searchParams = request.nextUrl.searchParams;
    const validated = authorizeSchema.parse({
      client_id: searchParams.get("client_id"),
      redirect_uri: searchParams.get("redirect_uri"),
      response_type: searchParams.get("response_type") || "code",
      scope: searchParams.get("scope"),
      state: searchParams.get("state"),
    });

    // Verify client
    const client = await prisma.aPIKey.findUnique({
      where: { key: validated.client_id },
      include: { api: true },
    });

    if (!client || !client.isActive) {
      return NextResponse.json(
        { error: "invalid_client", error_description: "Invalid client ID" },
        { status: 400 }
      );
    }

    // Verify redirect URI
    if (!client.api) {
      return NextResponse.json(
        { error: "invalid_request", error_description: "Client not associated with API" },
        { status: 400 }
      );
    }

    // Generate authorization code
    const scopes = validated.scope
      ? validated.scope.split(" ")
      : client.scopes;
    const code = generateAuthorizationCode(
      validated.client_id,
      session.user.id,
      validated.redirect_uri,
      scopes
    );

    // Build redirect URL
    const redirectUrl = new URL(validated.redirect_uri);
    redirectUrl.searchParams.set("code", code);
    if (validated.state) {
      redirectUrl.searchParams.set("state", validated.state);
    }

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "invalid_request",
          error_description: "Invalid request parameters",
          details: error.issues,
        },
        { status: 400 }
      );
    }
    console.error("Error in OAuth2 authorize:", error);
    return NextResponse.json(
      {
        error: "server_error",
        error_description: "An error occurred during authorization",
      },
      { status: 500 }
    );
  }
}
