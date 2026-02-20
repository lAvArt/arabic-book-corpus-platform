import { describe, expect, it } from "vitest";
import { parseRedisConnection } from "../src/redis.js";

describe("parseRedisConnection", () => {
    it("parses a basic redis URL", () => {
        const conn = parseRedisConnection("redis://localhost:6379");
        expect(conn.host).toBe("localhost");
        expect(conn.port).toBe(6379);
        expect(conn.username).toBeUndefined();
        expect(conn.password).toBeUndefined();
    });

    it("defaults port to 6379 when omitted", () => {
        const conn = parseRedisConnection("redis://myhost");
        expect(conn.host).toBe("myhost");
        expect(conn.port).toBe(6379);
    });

    it("parses auth credentials", () => {
        const conn = parseRedisConnection("redis://admin:secret123@redis.example.com:6380");
        expect(conn.host).toBe("redis.example.com");
        expect(conn.port).toBe(6380);
        expect(conn.username).toBe("admin");
        expect(conn.password).toBe("secret123");
    });

    it("handles password-only auth (no username)", () => {
        const conn = parseRedisConnection("redis://:mypassword@localhost:6379");
        expect(conn.host).toBe("localhost");
        expect(conn.port).toBe(6379);
        expect(conn.username).toBeUndefined();
        expect(conn.password).toBe("mypassword");
    });

    it("handles rediss:// (TLS) scheme", () => {
        const conn = parseRedisConnection("rediss://secure.redis.io:6380");
        expect(conn.host).toBe("secure.redis.io");
        expect(conn.port).toBe(6380);
    });
});
