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
});

describe("tokenizeArabicSurface", () => {
  it("tokenizes normalized text", () => {
    const tokens = tokenizeArabicSurface("كِتَابُهُمْ في لِسانِ العرب");
    expect(tokens).toEqual(["كتابهم", "في", "لسان", "العرب"]);
  });
});
