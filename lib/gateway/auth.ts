import { prisma } from "../prisma";
import { hashApiKey } from "../api-keys";

export async function validateApiKey(
  apiKey: string
): Promise<{
  valid: boolean;
  keyId?: string;
  userId?: string;
  apiId?: string;
  plan?: string;
  scopes?: string[];
}> {
  const hashed = hashApiKey(apiKey);

  // Support both hashed keys (new) and legacy plaintext keys
  let key = await prisma.aPIKey.findFirst({
    where: {
      OR: [{ key: hashed }, { key: apiKey }],
    },
    include: {
      api: true,
      user: {
        include: {
          subscriptions: {
            where: { status: "active" },
          },
        },
      },
    },
  });

  if (!key || !key.isActive) {
    return { valid: false };
  }

  if (key.expiresAt && key.expiresAt < new Date()) {
    return { valid: false };
  }

  await prisma.aPIKey.update({
    where: { id: key.id },
    data: { lastUsedAt: new Date() },
  });

  const subscription = key.user.subscriptions.find(
    (sub) => sub.apiId === key.apiId
  );
  const plan = subscription?.plan || "free";

  return {
    valid: true,
    keyId: key.id,
    userId: key.userId,
    apiId: key.apiId,
    plan: plan as string,
    scopes: key.scopes,
  };
}

export function hasScope(
  scopes: string[] | undefined,
  method: string
): boolean {
  if (!scopes || scopes.length === 0) return true;
  if (scopes.includes("full") || scopes.includes("*")) return true;
  if (scopes.includes("read") && method === "GET") return true;
  if (scopes.includes("write") && ["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    return true;
  }
  return false;
}
