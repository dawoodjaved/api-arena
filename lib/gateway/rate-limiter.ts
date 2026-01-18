import redis from "../redis";

export type Plan = "free" | "pro" | "enterprise";

const limits: Record<Plan, number> = {
  free: 100,
  pro: 10000,
  enterprise: Infinity,
};

export async function checkRateLimit(
  apiKey: string,
  plan: Plan
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const limit = limits[plan];
  
  if (limit === Infinity) {
    return {
      allowed: true,
      remaining: Infinity,
      resetAt: Date.now() + 3600000,
    };
  }

  const hour = Math.floor(Date.now() / (60 * 60 * 1000));
  const key = `ratelimit:${apiKey}:${hour}`;

  const current = await redis.incr(key);
  await redis.expire(key, 3600);

  const remaining = Math.max(0, limit - current);
  const resetAt = (hour + 1) * 60 * 60 * 1000;

  return {
    allowed: current <= limit,
    remaining,
    resetAt,
  };
}

export async function getRateLimitStatus(
  apiKey: string,
  plan: Plan
): Promise<{ remaining: number; resetAt: number }> {
  const limit = limits[plan];
  const hour = Math.floor(Date.now() / (60 * 60 * 1000));
  const key = `ratelimit:${apiKey}:${hour}`;

  const current = parseInt((await redis.get(key)) || "0", 10);
  const remaining = Math.max(0, limit - current);
  const resetAt = (hour + 1) * 60 * 60 * 1000;

  return { remaining, resetAt };
}
