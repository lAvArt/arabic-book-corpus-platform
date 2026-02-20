const DIACRITICS_PATTERN = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED]/g;
const TATWEEL_PATTERN = /\u0640/g;
const WHITESPACE_PATTERN = /\s+/g;

const CHAR_MAP: Record<string, string> = {
  "إ": "ا",
  "أ": "ا",
  "آ": "ا",
  "ٱ": "ا",
  "ى": "ي",
  "ؤ": "و",
  "ئ": "ي",
  "ة": "ه"
};

export function normalizeArabicText(input: string): string {
  const noDiacritics = input.replace(DIACRITICS_PATTERN, "");
  const noTatweel = noDiacritics.replace(TATWEEL_PATTERN, "");
  const mapped = [...noTatweel]
    .map((char) => CHAR_MAP[char] ?? char)
    .join("");

  return mapped.replace(WHITESPACE_PATTERN, " ").trim();
}

export function tokenizeArabicSurface(input: string): string[] {
  return normalizeArabicText(input)
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);
}
