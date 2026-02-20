export type UUID = string;

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  pageWidth?: number | null;
  pageHeight?: number | null;
}

export interface Citation {
  sourceId: UUID;
  sourceTitle: string;
  editionId: UUID;
  volume: number;
  page: number;
  lineStart: number;
  lineEnd: number;
}

export interface Anchor {
  pageId: UUID;
  bbox: BoundingBox;
  charStart: number;
  charEnd: number;
}

export interface SearchHit {
  passageId: UUID;
  snippet: string;
  score: number;
  citation: Citation;
  anchors: Anchor[];
}

export interface ReleaseManifest {
  releaseId: UUID;
  versionTag: string;
  generatedAt: string;
  checksumSha256: string;
  itemCount: number;
}

export interface BookSummary {
  id: UUID;
  slug: string;
  titleAr: string;
  titleEn: string | null;
  author: string | null;
}

export interface EditionSummary {
  id: UUID;
  sourceId: UUID;
  name: string;
  publisher: string | null;
  publicationYear: number | null;
  isCanonical: boolean;
}

export interface PassageDetail {
  passageId: UUID;
  textRaw: string;
  textNormalized: string;
  citation: Citation;
  anchors: Anchor[];
  tokens: PassageToken[];
}

export interface PassageToken {
  id: UUID;
  passageId: UUID;
  position: number;
  surfaceRaw: string;
  surfaceNormalized: string;
  lemma: string | null;
  root: string | null;
  pos: string | null;
  charStart: number;
  charEnd: number;
}

export interface ApiKeyResponse {
  keyId: UUID;
  keyPrefix: string;
  plainTextKey?: string;
  createdAt: string;
  expiresAt: string | null;
}

export interface SearchQueryOptions {
  q: string;
  limit?: number;
  offset?: number;
}
