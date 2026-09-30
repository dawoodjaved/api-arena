import redis from "../redis";

export async function getCachedResponse(key: string): Promise<any | null> {
  try {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);
  } catch (error) {
    console.warn("[cache] get failed", error);
  }
  return null;
}

export async function setCachedResponse(
  key: string,
  data: any,
  ttl: number = 3600
): Promise<void> {
  try {
    await redis.setex(key, ttl, JSON.stringify(data));
  } catch (error) {
    console.warn("[cache] set failed", error);
  }
}

export async function invalidateCache(pattern: string): Promise<void> {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.warn("[cache] invalidate failed", error);
  }
}

export function generateCacheKey(
  apiId: string,
  version: string,
  method: string,
  path: string,
  params?: Record<string, any>
): string {
  const paramStr = params
    ? Object.entries(params)
        .sort()
        .map(([k, v]) => `${k}=${v}`)
        .join("&")
    : "";
  return `cache:${apiId}:${version}:${method}:${path}${
    paramStr ? `?${paramStr}` : ""
  }`;
}
