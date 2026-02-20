import { describe, expect, it } from "vitest";
import { normalizeArabicText, tokenizeArabicSurface } from "../src/normalize.js";

describe("normalizeArabicText", () => {
  it("strips diacritics and normalizes orthographic variants", () => {
    const input = "إِنَّ الكِتَابَ مُؤَلَّفٌ فِي لُغَةٍ عَرَبِيَّةٍ";
    const normalized = normalizeArabicText(input);
    expect(normalized).toBe("ان الكتاب مولف في لغه عربيه");
  });

  it("normalizes whitespace and tatweel", () => {
    const input = "لســـان   العرب";
    const normalized = normalizeArabicText(input);
    expect(normalized).toBe("لسان العرب");
  });

  it("returns empty string for empty input", () => {
    expect(normalizeArabicText("")).toBe("");
  });

  it("returns empty string for pure diacritics", () => {
    const pureDiacritics = "\u064B\u064C\u064D\u064E\u064F\u0650";
    expect(normalizeArabicText(pureDiacritics)).toBe("");
  });

  it("returns empty string for only tatweel", () => {
    expect(normalizeArabicText("\u0640\u0640\u0640")).toBe("");
  });

  it("normalizes all Alef variants to bare Alef", () => {
    expect(normalizeArabicText("إ")).toBe("ا");
    expect(normalizeArabicText("أ")).toBe("ا");
    expect(normalizeArabicText("آ")).toBe("ا");
    expect(normalizeArabicText("ٱ")).toBe("ا");
  });

  it("normalizes taa marbuta to haa", () => {
    expect(normalizeArabicText("مدرسة")).toBe("مدرسه");
  });

  it("normalizes yaa variants", () => {
    expect(normalizeArabicText("ى")).toBe("ي");
    expect(normalizeArabicText("ئ")).toBe("ي");
  });

  it("normalizes hamza on waw", () => {
    expect(normalizeArabicText("ؤ")).toBe("و");
  });

  it("preserves non-Arabic characters", () => {
    const mixed = "Arabic عربي and English";
    expect(normalizeArabicText(mixed)).toBe("Arabic عربي and English");
  });

  it("collapses multiple spaces to single space", () => {
    expect(normalizeArabicText("كلمة    أخرى")).toBe("كلمه اخري");
  });
});

describe("tokenizeArabicSurface", () => {
  it("tokenizes normalized text", () => {
    const tokens = tokenizeArabicSurface("كِتَابُهُمْ في لِسانِ العرب");
    expect(tokens).toEqual(["كتابهم", "في", "لسان", "العرب"]);
  });

  it("returns empty array for empty string", () => {
    expect(tokenizeArabicSurface("")).toEqual([]);
  });

  it("returns empty array for whitespace-only input", () => {
    expect(tokenizeArabicSurface("   ")).toEqual([]);
  });

  it("handles single token", () => {
    expect(tokenizeArabicSurface("كتاب")).toEqual(["كتاب"]);
  });

  it("strips diacritics during tokenization", () => {
    const tokens = tokenizeArabicSurface("بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ");
    expect(tokens).toEqual(["بسم", "الله", "الرحمن", "الرحيم"]);
  });
});
