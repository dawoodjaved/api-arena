import { NextRequest, NextResponse } from "next/server";
import {
  exchangeCodeForToken,
  clientCredentialsGrant,
} from "@/lib/services/oauth2";
import { z } from "zod";

const tokenSchema = z.object({
  grant_type: z.enum(["authorization_code", "client_credentials", "refresh_token"]),
  code: z.string().optional(),
  redirect_uri: z.string().url().optional(),
  client_id: z.string(),
  client_secret: z.string(),
  scope: z.string().optional(),
  refresh_token: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.formData();
    const validated = tokenSchema.parse({
      grant_type: body.get("grant_type"),
      code: body.get("code"),
      redirect_uri: body.get("redirect_uri"),
      client_id: body.get("client_id"),
      client_secret: body.get("client_secret"),
      scope: body.get("scope"),
      refresh_token: body.get("refresh_token"),
    });

    let token;

    if (validated.grant_type === "authorization_code") {
      if (!validated.code || !validated.redirect_uri) {
        return NextResponse.json(
          {
            error: "invalid_request",
            error_description: "code and redirect_uri are required",
          },
          { status: 400 }
        );
      }

      token = await exchangeCodeForToken(
        validated.code,
        validated.client_id,
        validated.client_secret,
        validated.redirect_uri
      );
    } else if (validated.grant_type === "client_credentials") {
      const scopes = validated.scope ? validated.scope.split(" ") : undefined;
      token = await clientCredentialsGrant(
        validated.client_id,
        validated.client_secret,
        scopes
      );
    } else {
      return NextResponse.json(
        {
          error: "unsupported_grant_type",
          error_description: "Grant type not supported",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(token);
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

    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: "invalid_grant",
          error_description: error.message,
        },
        { status: 400 }
      );
    }

    console.error("Error in OAuth2 token:", error);
    return NextResponse.json(
      {
        error: "server_error",
        error_description: "An error occurred during token exchange",
      },
      { status: 500 }
    );
  }
}
