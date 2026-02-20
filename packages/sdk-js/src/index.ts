import type {
  ApiKeyResponse,
  BookSummary,
  EditionSummary,
  PassageDetail,
  ReleaseManifest,
  SearchHit
} from "@arabic-corpus/core";

export interface CorpusClientConfig {
  baseUrl: string;
  apiKey?: string;
  fetchImpl?: typeof fetch;
}

export class CorpusClient {
  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly fetchImpl: typeof fetch;

  constructor(config: CorpusClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.apiKey = config.apiKey;
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const headers = new Headers(init?.headers);
    if (this.apiKey) headers.set("x-api-key", this.apiKey);
    headers.set("accept", "application/json");

    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      ...init,
      headers
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Request failed (${response.status}): ${body}`);
    }

    return (await response.json()) as T;
  }

  listBooks(): Promise<BookSummary[]> {
    return this.request<BookSummary[]>("/api/v1/books");
  }

  listEditions(bookId: string): Promise<EditionSummary[]> {
    return this.request<EditionSummary[]>(`/api/v1/books/${bookId}/editions`);
  }

  searchBook(bookId: string, q: string, limit = 20): Promise<SearchHit[]> {
    const query = new URLSearchParams({ q, limit: String(limit) });
    return this.request<SearchHit[]>(`/api/v1/books/${bookId}/search?${query.toString()}`);
  }

  getPassage(passageId: string): Promise<PassageDetail> {
    return this.request<PassageDetail>(`/api/v1/passages/${passageId}`);
  }

  getReleases(): Promise<ReleaseManifest[]> {
    return this.request<ReleaseManifest[]>("/api/v1/releases");
  }

  createApiKey(name: string): Promise<ApiKeyResponse> {
    return this.request<ApiKeyResponse>("/api/v1/auth/keys", {
      method: "POST",
      body: JSON.stringify({ name }),
      headers: { "content-type": "application/json" }
    });
  }
}
