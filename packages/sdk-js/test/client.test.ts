import { describe, expect, it, vi } from "vitest";
import { CorpusClient } from "../src/index.js";

function createMockFetch(responseBody: unknown, status = 200): typeof fetch {
    return vi.fn(async () => ({
        ok: status >= 200 && status < 300,
        status,
        text: async () => JSON.stringify(responseBody),
        json: async () => responseBody,
        headers: new Headers()
    })) as unknown as typeof fetch;
}

describe("CorpusClient", () => {
    it("sets x-api-key header when apiKey is provided", async () => {
        const mockFetch = createMockFetch([]);
        const client = new CorpusClient({
            baseUrl: "https://api.example.com",
            apiKey: "ak_live_test123",
            fetchImpl: mockFetch
        });

        await client.listBooks();

        expect(mockFetch).toHaveBeenCalledOnce();
        const [url, init] = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(url).toBe("https://api.example.com/api/v1/books");
        const headers = init?.headers as Headers;
        expect(headers.get("x-api-key")).toBe("ak_live_test123");
        expect(headers.get("accept")).toBe("application/json");
    });

    it("does not set x-api-key header when apiKey is omitted", async () => {
        const mockFetch = createMockFetch([]);
        const client = new CorpusClient({
            baseUrl: "https://api.example.com",
            fetchImpl: mockFetch
        });

        await client.listBooks();

        const [, init] = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0];
        const headers = init?.headers as Headers;
        expect(headers.has("x-api-key")).toBe(false);
    });

    it("strips trailing slash from baseUrl", async () => {
        const mockFetch = createMockFetch([]);
        const client = new CorpusClient({
            baseUrl: "https://api.example.com/",
            fetchImpl: mockFetch
        });

        await client.listBooks();

        const [url] = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(url).toBe("https://api.example.com/api/v1/books");
    });

    it("constructs correct URL for listEditions", async () => {
        const mockFetch = createMockFetch([]);
        const client = new CorpusClient({ baseUrl: "https://api.example.com", fetchImpl: mockFetch });

        await client.listEditions("book-123");

        const [url] = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(url).toBe("https://api.example.com/api/v1/books/book-123/editions");
    });

    it("constructs correct URL for searchBook with query params", async () => {
        const mockFetch = createMockFetch([]);
        const client = new CorpusClient({ baseUrl: "https://api.example.com", fetchImpl: mockFetch });

        await client.searchBook("book-123", "كتاب", 10);

        const [url] = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(url).toContain("/api/v1/books/book-123/search?");
        expect(url).toContain("q=%D9%83%D8%AA%D8%A7%D8%A8");
        expect(url).toContain("limit=10");
    });

    it("constructs correct URL for getPassage", async () => {
        const mockFetch = createMockFetch({ passageId: "p1" });
        const client = new CorpusClient({ baseUrl: "https://api.example.com", fetchImpl: mockFetch });

        await client.getPassage("passage-456");

        const [url] = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(url).toBe("https://api.example.com/api/v1/passages/passage-456");
    });

    it("constructs correct URL for getReleases", async () => {
        const mockFetch = createMockFetch([]);
        const client = new CorpusClient({ baseUrl: "https://api.example.com", fetchImpl: mockFetch });

        await client.getReleases();

        const [url] = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(url).toBe("https://api.example.com/api/v1/releases");
    });

    it("sends POST with JSON body for createApiKey", async () => {
        const mockFetch = createMockFetch({ keyId: "k1", keyPrefix: "ak_live_" });
        const client = new CorpusClient({ baseUrl: "https://api.example.com", fetchImpl: mockFetch });

        await client.createApiKey("My Key");

        const [, init] = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(init?.method).toBe("POST");
        expect(init?.body).toBe(JSON.stringify({ name: "My Key" }));
    });

    it("throws on non-ok response", async () => {
        const mockFetch = createMockFetch({ error: "Unauthorized" }, 401);
        const client = new CorpusClient({ baseUrl: "https://api.example.com", fetchImpl: mockFetch });

        await expect(client.listBooks()).rejects.toThrow("Request failed (401)");
    });

    it("uses default limit of 20 for searchBook", async () => {
        const mockFetch = createMockFetch([]);
        const client = new CorpusClient({ baseUrl: "https://api.example.com", fetchImpl: mockFetch });

        await client.searchBook("book-123", "test");

        const [url] = (mockFetch as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(url).toContain("limit=20");
    });
});
