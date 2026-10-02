import { createHash, randomBytes } from "crypto";

export function generateApiKeyPlaintext(): string {
  return `adw_${randomBytes(24).toString("hex")}`;
}

export function hashApiKey(plaintext: string): string {
  return createHash("sha256").update(plaintext).digest("hex");
}

export function apiKeyPrefix(plaintext: string): string {
  return plaintext.slice(0, 12);
}
