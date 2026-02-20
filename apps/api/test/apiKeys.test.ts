import { describe, expect, it } from "vitest";
import { createHash, timingSafeEqual } from "node:crypto";

process.env.DATABASE_URL ??= "postgres://postgres:postgres@localhost:5432/test";
process.env.REDIS_URL ??= "redis://localhost:6379";

const { buildApiKeyPlainText } = await import("../src/services/apiKeys.js");

describe("buildApiKeyPlainText", () => {
  it("creates prefixed key material", () => {
    const value = buildApiKeyPlainText();
    expect(value.plainText.startsWith("ak_live_")).toBe(true);
    expect(value.prefix.length).toBe(12);
    expect(value.hash.length).toBe(64);
  });

  it("creates unique keys", () => {
    const a = buildApiKeyPlainText();
    const b = buildApiKeyPlainText();
    expect(a.plainText).not.toBe(b.plainText);
    expect(a.hash).not.toBe(b.hash);
  });

  it("prefix is the first 12 characters of plainText", () => {
    const value = buildApiKeyPlainText();
    expect(value.prefix).toBe(value.plainText.slice(0, 12));
  });

  it("hash is SHA-256 of the full plainText", () => {
    const value = buildApiKeyPlainText();
    const expectedHash = createHash("sha256").update(value.plainText).digest("hex");
    expect(value.hash).toBe(expectedHash);
  });

  it("hash is verifiable with timingSafeEqual", () => {
    const value = buildApiKeyPlainText();
    const recomputedHash = createHash("sha256").update(value.plainText).digest("hex");
    const a = Buffer.from(value.hash, "utf8");
    const b = Buffer.from(recomputedHash, "utf8");
    expect(a.length).toBe(b.length);
    expect(timingSafeEqual(a, b)).toBe(true);
  });

  it("different keys produce different hashes", () => {
    const keys = Array.from({ length: 10 }, () => buildApiKeyPlainText());
    const hashes = new Set(keys.map((k) => k.hash));
    expect(hashes.size).toBe(10);
  });

  it("key contains sufficient entropy", () => {
    const value = buildApiKeyPlainText();
    // ak_live_ = 8 chars, rest is base64url encoded 32 bytes = ~43 chars
    const secret = value.plainText.slice(8);
    expect(secret.length).toBeGreaterThanOrEqual(40);
  });
});
