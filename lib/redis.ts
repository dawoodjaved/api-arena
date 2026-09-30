import Redis from "ioredis";

type MemoryEntry = { value: string; expiresAt?: number };

class MemoryStore {
  private store = new Map<string, MemoryEntry>();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string): Promise<"OK"> {
    this.store.set(key, { value });
    return "OK";
  }

  async setex(key: string, ttl: number, value: string): Promise<"OK"> {
    this.store.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
    return "OK";
  }

  async incr(key: string): Promise<number> {
    const current = parseInt((await this.get(key)) || "0", 10);
    const next = current + 1;
    const existing = this.store.get(key);
    this.store.set(key, {
      value: String(next),
      expiresAt: existing?.expiresAt,
    });
    return next;
  }

  async expire(key: string, ttl: number): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return 0;
    entry.expiresAt = Date.now() + ttl * 1000;
    this.store.set(key, entry);
    return 1;
  }

  async del(...keys: string[]): Promise<number> {
    let n = 0;
    for (const key of keys) if (this.store.delete(key)) n += 1;
    return n;
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(
      "^" + pattern.replace(/\*/g, ".*").replace(/\?/g, ".") + "$"
    );
    return [...this.store.keys()].filter((k) => regex.test(k));
  }

  async ping(): Promise<string> {
    return "PONG";
  }
}

let mode: "redis" | "memory" = "memory";
let redisClient: Redis | null = null;
const memory = new MemoryStore();
let connecting: Promise<boolean> | null = null;
let lastAttempt = 0;
const RETRY_MS = 15_000;

async function tryConnectRedis(): Promise<boolean> {
  const url = process.env.REDIS_URL || "redis://localhost:6379";
  lastAttempt = Date.now();
  try {
    if (redisClient) {
      try {
        redisClient.disconnect();
      } catch {
        /* ignore */
      }
      redisClient = null;
    }

    const client = new Redis(url, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
      connectTimeout: 2000,
      retryStrategy: () => null,
    });
    client.on("error", () => {});
    await client.connect();
    const pong = await client.ping();
    if (pong !== "PONG") {
      client.disconnect();
      mode = "memory";
      return false;
    }
    redisClient = client;
    mode = "redis";
    return true;
  } catch {
    if (redisClient) {
      try {
        redisClient.disconnect();
      } catch {
        /* ignore */
      }
      redisClient = null;
    }
    mode = "memory";
    return false;
  }
}

/** Await a Redis connection when possible (used by health checks). */
export async function ensureRedis(force = false): Promise<boolean> {
  if (mode === "redis" && redisClient) {
    try {
      const pong = await redisClient.ping();
      if (pong === "PONG") return true;
    } catch {
      mode = "memory";
      redisClient = null;
    }
  }

  const due = force || Date.now() - lastAttempt >= RETRY_MS;
  if (!due && mode === "memory" && !force) return false;

  if (!connecting) {
    connecting = tryConnectRedis().finally(() => {
      connecting = null;
    });
  }
  return connecting;
}

export function isRedisReady() {
  return mode === "redis";
}

export function getRedisMode() {
  return mode;
}

export function getRedis(): Redis | MemoryStore {
  if (mode === "redis" && redisClient) return redisClient;

  // Opportunistic reconnect without blocking the request path
  if (!connecting && Date.now() - lastAttempt >= RETRY_MS) {
    connecting = tryConnectRedis().finally(() => {
      connecting = null;
    });
  }

  return mode === "redis" && redisClient ? redisClient : memory;
}

const redisProxy = new Proxy({} as Redis, {
  get(_target, prop) {
    const client = getRedis() as any;
    const value = client[prop];
    return typeof value === "function" ? value.bind(client) : value;
  },
});

void tryConnectRedis().then((ok) => {
  if (!ok && process.env.NODE_ENV === "development") {
    console.warn(
      "[redis] Using in-memory fallback (start Redis for shared limits)"
    );
  }
});

export default redisProxy;
