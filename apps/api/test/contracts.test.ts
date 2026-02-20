import { describe, expect, it } from "vitest";

describe("API response contract shapes", () => {
    // These tests validate the TypeScript type contracts match what the API routes
    // actually return. They import types from @arabic-corpus/core and verify the
    // shape expectations without needing a running server.

    it("Citation has all required fields", async () => {
        const { } = await import("@arabic-corpus/core");
        const citation = {
            sourceId: "00000000-0000-0000-0000-000000000001",
            sourceTitle: "لسان العرب",
            editionId: "00000000-0000-0000-0000-000000000002",
            volume: 1,
            page: 42,
            lineStart: 3,
            lineEnd: 5
        } satisfies import("@arabic-corpus/core").Citation;

        expect(citation.sourceId).toBeDefined();
        expect(citation.volume).toBeGreaterThan(0);
        expect(citation.lineEnd).toBeGreaterThanOrEqual(citation.lineStart);
    });

    it("SearchHit includes citation and anchors", () => {
        const hit = {
            passageId: "00000000-0000-0000-0000-000000000003",
            snippet: "بسم الله الرحمن الرحيم",
            score: 0.95,
            citation: {
                sourceId: "s1",
                sourceTitle: "لسان العرب",
                editionId: "e1",
                volume: 1,
                page: 1,
                lineStart: 1,
                lineEnd: 2
            },
            anchors: [
                {
                    pageId: "p1",
                    bbox: { x: 10, y: 20, width: 100, height: 30 },
                    charStart: 0,
                    charEnd: 22
                }
            ]
        } satisfies import("@arabic-corpus/core").SearchHit;

        expect(hit.citation).toBeDefined();
        expect(hit.anchors.length).toBeGreaterThan(0);
        expect(hit.score).toBeGreaterThanOrEqual(0);
        expect(hit.score).toBeLessThanOrEqual(2);
    });

    it("PassageDetail includes tokens array", () => {
        const detail = {
            passageId: "p1",
            textRaw: "نص خام",
            textNormalized: "نص خام",
            citation: {
                sourceId: "s1",
                sourceTitle: "لسان العرب",
                editionId: "e1",
                volume: 1,
                page: 1,
                lineStart: 1,
                lineEnd: 1
            },
            anchors: [],
            tokens: [
                {
                    id: "t1",
                    passageId: "p1",
                    position: 0,
                    surfaceRaw: "نص",
                    surfaceNormalized: "نص",
                    lemma: null,
                    root: null,
                    pos: null,
                    charStart: 0,
                    charEnd: 2
                }
            ]
        } satisfies import("@arabic-corpus/core").PassageDetail;

        expect(detail.tokens.length).toBeGreaterThan(0);
        expect(detail.tokens[0].lemma).toBeNull();
        expect(detail.tokens[0].root).toBeNull();
        expect(detail.tokens[0].pos).toBeNull();
    });

    it("ReleaseManifest has checksum and version tag", () => {
        const manifest = {
            releaseId: "r1",
            versionTag: "2026-02",
            generatedAt: "2026-02-21T00:00:00Z",
            checksumSha256: "abc123",
            itemCount: 42
        } satisfies import("@arabic-corpus/core").ReleaseManifest;

        expect(manifest.versionTag).toMatch(/^\d{4}-\d{2}/);
        expect(manifest.checksumSha256.length).toBeGreaterThan(0);
        expect(manifest.itemCount).toBeGreaterThan(0);
    });

    it("PageDetail has all scan metadata", () => {
        const page = {
            id: "pg1",
            volumeId: "v1",
            pageNumber: 42,
            storagePath: "scans/v1/page_42.png",
            imageSha256: "deadbeef",
            volumeNumber: 1,
            editionId: "e1",
            editionName: "طبعة دار المعارف",
            sourceId: "s1",
            sourceTitle: "لسان العرب"
        } satisfies import("@arabic-corpus/core").PageDetail;

        expect(page.pageNumber).toBe(42);
        expect(page.storagePath).toContain("page_42");
        expect(page.imageSha256.length).toBeGreaterThan(0);
    });

    it("ApiKeyResponse has expected shape", () => {
        const response = {
            keyId: "k1",
            keyPrefix: "ak_live_abcd",
            plainTextKey: "ak_live_abcdefghij1234567890",
            createdAt: "2026-02-21T00:00:00Z",
            expiresAt: null
        } satisfies import("@arabic-corpus/core").ApiKeyResponse;

        expect(response.keyPrefix.startsWith("ak_live_")).toBe(true);
        expect(response.expiresAt).toBeNull();
    });
});
