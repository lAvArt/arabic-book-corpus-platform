import { describe, expect, it } from "vitest";

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
});
