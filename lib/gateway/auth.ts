import { prisma } from "../prisma";

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
  const key = await prisma.aPIKey.findUnique({
    where: { key: apiKey },
    include: {
      api: true,
      user: {
        include: {
          subscriptions: {
            where: {
              status: "active",
            },
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

  // Update last used
  await prisma.aPIKey.update({
    where: { id: key.id },
    data: { lastUsedAt: new Date() },
  });

  // Get user's subscription plan for this API
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
