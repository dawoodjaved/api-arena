/**
 * Lightweight smoke tests for MVP helpers (no DB required).
 * Run: npm test
 */
const assert = require("assert");
const { createHash } = require("crypto");

function hashApiKey(plaintext) {
  return createHash("sha256").update(plaintext).digest("hex");
}

function apiKeyPrefix(plaintext) {
  return plaintext.slice(0, 12);
}

function isValidOpenApi(spec) {
  if (!spec.openapi && !spec.swagger) return false;
  if (!spec.info || typeof spec.info !== "object") return false;
  if (!spec.paths || typeof spec.paths !== "object") return false;
  return true;
}

function matchEndpointPath(registered, actual) {
  if (registered === actual) return true;
  const regParts = registered.split("/").filter(Boolean);
  const actParts = actual.split("/").filter(Boolean);
  if (regParts.length !== actParts.length) return false;
  return regParts.every(
    (p, i) => p.startsWith("{") || p.startsWith(":") || p === actParts[i]
  );
}

function hasScope(scopes, method) {
  if (!scopes || scopes.length === 0) return true;
  if (scopes.includes("full") || scopes.includes("*")) return true;
  if (scopes.includes("read") && method === "GET") return true;
  if (
    scopes.includes("write") &&
    ["POST", "PUT", "PATCH", "DELETE"].includes(method)
  ) {
    return true;
  }
  return false;
}

// --- tests ---
const key = "adw_abcdefghijklmnopqrstuvwxyz012345";
const hashed = hashApiKey(key);
assert.strictEqual(hashed.length, 64);
assert.strictEqual(apiKeyPrefix(key), "adw_abcdefgh");
assert.notStrictEqual(hashed, key);

assert.ok(
  isValidOpenApi({
    openapi: "3.0.0",
    info: { title: "t", version: "1" },
    paths: { "/x": { get: {} } },
  })
);
assert.ok(!isValidOpenApi({ openapi: "3.0.0" }));

assert.ok(matchEndpointPath("/users/{id}", "/users/123"));
assert.ok(!matchEndpointPath("/users/{id}", "/users/123/extra"));
assert.ok(matchEndpointPath("/get", "/get"));

assert.ok(hasScope(["full"], "DELETE"));
assert.ok(hasScope(["read"], "GET"));
assert.ok(!hasScope(["read"], "POST"));
assert.ok(hasScope([], "POST"));

console.log("All smoke tests passed.");
