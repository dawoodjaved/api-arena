import { prisma } from "../prisma";
import redis from "../redis";

export interface WebhookEvent {
  id: string;
  apiId: string;
  eventType: string;
  payload: any;
  url: string;
  secret?: string;
}

interface WebhookDelivery {
  id: string;
  eventId: string;
  url: string;
  status: "pending" | "delivered" | "failed";
  attempts: number;
  lastAttemptAt?: Date;
  nextRetryAt?: Date;
  responseCode?: number;
  responseBody?: string;
  error?: string;
}

const MAX_RETRIES = 5;
const RETRY_DELAYS = [1000, 5000, 15000, 60000, 300000]; // 1s, 5s, 15s, 1m, 5m

/**
 * Queue webhook for delivery
 */
export async function queueWebhook(event: WebhookEvent): Promise<void> {
  // Store event in database (you might want to create a WebhookEvent model)
  // For now, we'll use Redis queue
  const queueKey = `webhook:queue:${event.apiId}`;
  await redis.lpush(queueKey, JSON.stringify(event));

  // Trigger immediate delivery attempt
  await attemptWebhookDelivery(event);
}

/**
 * Attempt to deliver webhook
 */
async function attemptWebhookDelivery(event: WebhookEvent): Promise<void> {
  try {
    const deliveryKey = `webhook:delivery:${event.id}`;
    const deliveryData = await redis.get(deliveryKey);
    let delivery: WebhookDelivery;

    if (deliveryData) {
      delivery = JSON.parse(deliveryData);
    } else {
      delivery = {
        id: `delivery_${Date.now()}`,
        eventId: event.id,
        url: event.url,
        status: "pending",
        attempts: 0,
      };
    }

    // Check if max retries reached
    if (delivery.attempts >= MAX_RETRIES) {
      delivery.status = "failed";
      await redis.set(deliveryKey, JSON.stringify(delivery));
      await moveToDeadLetterQueue(event, delivery);
      return;
    }

    // Attempt delivery
    delivery.attempts++;
    delivery.lastAttemptAt = new Date();

    const response = await fetch(event.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Event": event.eventType,
        "X-Webhook-Id": event.id,
        ...(event.secret && {
          "X-Webhook-Signature": generateSignature(
            JSON.stringify(event.payload),
            event.secret
          ),
        }),
      },
      body: JSON.stringify(event.payload),
      signal: AbortSignal.timeout(30000), // 30s timeout
    });

    delivery.responseCode = response.status;
    delivery.responseBody = await response.text().catch(() => "");

    if (response.ok) {
      delivery.status = "delivered";
      await redis.set(deliveryKey, JSON.stringify(delivery));
    } else {
      // Schedule retry
      const delay = RETRY_DELAYS[Math.min(delivery.attempts - 1, RETRY_DELAYS.length - 1)];
      delivery.nextRetryAt = new Date(Date.now() + delay);
      delivery.status = "pending";
      await redis.set(deliveryKey, JSON.stringify(delivery));
      await scheduleRetry(event, delay);
    }
  } catch (error: any) {
    const deliveryKey = `webhook:delivery:${event.id}`;
    const deliveryData = await redis.get(deliveryKey);
    const delivery: WebhookDelivery = deliveryData
      ? JSON.parse(deliveryData)
      : {
          id: `delivery_${Date.now()}`,
          eventId: event.id,
          url: event.url,
          status: "pending",
          attempts: 0,
        };

    delivery.attempts++;
    delivery.lastAttemptAt = new Date();
    delivery.error = error.message;

    if (delivery.attempts >= MAX_RETRIES) {
      delivery.status = "failed";
      await moveToDeadLetterQueue(event, delivery);
    } else {
      const delay = RETRY_DELAYS[Math.min(delivery.attempts - 1, RETRY_DELAYS.length - 1)];
      delivery.nextRetryAt = new Date(Date.now() + delay);
      await scheduleRetry(event, delay);
    }

    await redis.set(deliveryKey, JSON.stringify(delivery));
  }
}

/**
 * Schedule retry for webhook
 */
async function scheduleRetry(event: WebhookEvent, delayMs: number): Promise<void> {
  const retryKey = `webhook:retry:${event.id}`;
  await redis.setex(retryKey, Math.ceil(delayMs / 1000), JSON.stringify(event));
}

/**
 * Move failed webhook to dead letter queue
 */
async function moveToDeadLetterQueue(
  event: WebhookEvent,
  delivery: WebhookDelivery
): Promise<void> {
  const dlqKey = `webhook:dlq:${event.apiId}`;
  await redis.lpush(
    dlqKey,
    JSON.stringify({
      event,
      delivery,
      failedAt: new Date().toISOString(),
    })
  );
}

/**
 * Generate HMAC signature for webhook
 */
function generateSignature(payload: string, secret: string): string {
  const crypto = require("crypto") as typeof import("crypto");
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Process webhook queue (should be called by a worker/cron)
 */
export async function processWebhookQueue(apiId?: string): Promise<void> {
  const pattern = apiId ? `webhook:queue:${apiId}` : "webhook:queue:*";
  const keys = await redis.keys(pattern);

  for (const key of keys) {
    const eventData = await redis.rpop(key);
    if (eventData) {
      const event: WebhookEvent = JSON.parse(eventData);
      await attemptWebhookDelivery(event);
    }
  }

  // Process retries
  const retryPattern = apiId ? `webhook:retry:${apiId}*` : "webhook:retry:*";
  const retryKeys = await redis.keys(retryPattern);

  for (const retryKey of retryKeys) {
    const eventData = await redis.get(retryKey);
    if (eventData) {
      const event: WebhookEvent = JSON.parse(eventData);
      await attemptWebhookDelivery(event);
      await redis.del(retryKey);
    }
  }
}
