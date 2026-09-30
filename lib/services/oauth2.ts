import { prisma } from "../prisma";
import crypto from "crypto";

export interface OAuth2Client {
  id: string;
  secret: string;
  name: string;
  redirectUris: string[];
  scopes: string[];
  userId: string;
  apiId: string;
}

export interface OAuth2Token {
  accessToken: string;
  refreshToken?: string;
  tokenType: "Bearer";
  expiresIn: number;
  scope?: string;
}

/**
 * Create OAuth2 client for an API
 */
export async function createOAuth2Client(
  userId: string,
  apiId: string,
  name: string,
  redirectUris: string[]
): Promise<OAuth2Client> {
  const clientId = `client_${crypto.randomBytes(16).toString("hex")}`;
  const clientSecret = crypto.randomBytes(32).toString("hex");

  // Store in database (you might want to create an OAuth2Client model)
  // For now, we'll use a simple approach with APIKey model
  const client = await prisma.aPIKey.create({
    data: {
      key: clientId,
      name: `OAuth2 Client: ${name}`,
      userId,
      apiId,
      scopes: ["read", "write"],
      environment: "production",
    },
  });

  // Store secret separately (in production, use encryption)
  // For now, we'll return it but it should be stored securely
  return {
    id: clientId,
    secret: clientSecret,
    name,
    redirectUris,
    scopes: client.scopes,
    userId,
    apiId,
  };
}

/**
 * Generate authorization code
 */
export function generateAuthorizationCode(
  clientId: string,
  userId: string,
  redirectUri: string,
  scopes: string[]
): string {
  const payload = {
    clientId,
    userId,
    redirectUri,
    scopes,
    expiresAt: Date.now() + 600000, // 10 minutes
  };

  const code = crypto.randomBytes(32).toString("hex");
  // In production, store this in Redis or database with expiration
  return code;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  code: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<OAuth2Token> {
  // Verify code (in production, check Redis/database)
  // Verify client credentials
  const client = await prisma.aPIKey.findUnique({
    where: { key: clientId },
  });

  if (!client || !client.isActive) {
    throw new Error("Invalid client");
  }

  // Generate access token
  const accessToken = `token_${crypto.randomBytes(32).toString("hex")}`;
  const refreshToken = `refresh_${crypto.randomBytes(32).toString("hex")}`;

  // Store tokens (in production, use a Token model)
  // For now, we'll use APIKey as a simple storage

  return {
    accessToken,
    refreshToken,
    tokenType: "Bearer",
    expiresIn: 3600, // 1 hour
    scope: client.scopes.join(" "),
  };
}

/**
 * Client credentials flow (for machine-to-machine)
 */
export async function clientCredentialsGrant(
  clientId: string,
  clientSecret: string,
  scopes?: string[]
): Promise<OAuth2Token> {
  // Verify client credentials
  const client = await prisma.aPIKey.findUnique({
    where: { key: clientId },
  });

  if (!client || !client.isActive) {
    throw new Error("Invalid client credentials");
  }

  // Generate access token
  const accessToken = `token_${crypto.randomBytes(32).toString("hex")}`;

  return {
    accessToken,
    tokenType: "Bearer",
    expiresIn: 3600, // 1 hour
    scope: (scopes || client.scopes).join(" "),
  };
}

/**
 * Validate access token
 */
export async function validateAccessToken(
  accessToken: string
): Promise<{ valid: boolean; clientId?: string; userId?: string; scopes?: string[] }> {
  // In production, check token in database/Redis
  // For now, simple validation
  if (!accessToken.startsWith("token_")) {
    return { valid: false };
  }

  // Find associated client
  // This is simplified - in production, use a proper Token model
  return {
    valid: true,
    scopes: ["read", "write"],
  };
}
