import type {
  Anchor,
  BookSummary,
  Citation,
  EditionSummary,
  PageDetail,
  PassageDetail,
  ReleaseManifest,
  SearchHit
} from "@arabic-corpus/core";
import { normalizeArabicText } from "@arabic-corpus/core";
import { query } from "../db.js";

export async function listBooks(): Promise<BookSummary[]> {
  return query<BookSummary>(
    `
      select id, slug, title_ar as "titleAr", title_en as "titleEn", author
      from source
      where is_active = true
      order by title_ar asc
    `
  );
}

export async function listBookEditions(bookId: string): Promise<EditionSummary[]> {
  return query<EditionSummary>(
    `
      select
        id,
        source_id as "sourceId",
        edition_name as "name",
        publisher,
        publication_year as "publicationYear",
        is_canonical as "isCanonical"
      from edition
      where source_id = $1
      order by is_canonical desc, publication_year nulls last
    `,
    [bookId]
  );
}

function mapCitationRow(row: Record<string, unknown>): Citation {
  return {
    sourceId: String(row.source_id),
    sourceTitle: String(row.source_title),
    editionId: String(row.edition_id),
    volume: Number(row.volume_no),
    page: Number(row.page_no),
    lineStart: Number(row.line_start),
    lineEnd: Number(row.line_end)
  };
}

async function getAnchorsForPassages(passageIds: string[]): Promise<Map<string, Anchor[]>> {
  if (passageIds.length === 0) return new Map();

  const rows = await query<{
    passage_id: string;
    page_id: string;
    bbox: Anchor["bbox"];
    char_start: number;
    char_end: number;
  }>(
    `
      select
        pa.passage_id,
        pa.page_id,
        pa.bbox,
        pa.char_start,
        pa.char_end
      from passage_anchor pa
      where pa.passage_id = any($1::uuid[])
      order by pa.created_at asc
    `,
    [passageIds]
  );

  const byPassage = new Map<string, Anchor[]>();
  for (const row of rows) {
    const list = byPassage.get(row.passage_id) ?? [];
    list.push({
      pageId: row.page_id,
      bbox: row.bbox,
      charStart: row.char_start,
      charEnd: row.char_end
    });
    byPassage.set(row.passage_id, list);
  }
  return byPassage;
}

export async function searchBook(params: {
  bookId: string;
  queryText: string;
  limit: number;
  offset: number;
}): Promise<SearchHit[]> {
  const normalizedQuery = normalizeArabicText(params.queryText);

  const rows = await query<{
    passage_id: string;
    text_raw: string;
    score: number;
    source_id: string;
    source_title: string;
    edition_id: string;
    volume_no: number;
    page_no: number;
    line_start: number;
    line_end: number;
  }>(
    `
      with exact_token as (
        select
          p.id as passage_id,
          p.text_raw,
          (1.0 + similarity(t.surface_normalized, $2)) as score,
          s.id as source_id,
          s.title_ar as source_title,
          e.id as edition_id,
          p.volume_no,
          p.page_no,
          p.line_start,
          p.line_end
        from token t
        join passage p on p.id = t.passage_id
        join edition e on e.id = p.edition_id
        join source s on s.id = e.source_id
        where s.id = $1 and t.surface_normalized = $2
      ),
      fts_hits as (
        select
          p.id as passage_id,
          p.text_raw,
          ts_rank_cd(
            p.search_vector,
            plainto_tsquery('simple', $2)
          ) as score,
          s.id as source_id,
          s.title_ar as source_title,
          e.id as edition_id,
          p.volume_no,
          p.page_no,
          p.line_start,
          p.line_end
        from passage p
        join edition e on e.id = p.edition_id
        join source s on s.id = e.source_id
        where s.id = $1
          and p.search_vector @@ plainto_tsquery('simple', $2)
      ),
      trigram_hits as (
        select
          p.id as passage_id,
          p.text_raw,
          similarity(p.text_normalized, $2) as score,
          s.id as source_id,
          s.title_ar as source_title,
          e.id as edition_id,
          p.volume_no,
          p.page_no,
          p.line_start,
          p.line_end
        from passage p
        join edition e on e.id = p.edition_id
        join source s on s.id = e.source_id
        where s.id = $1
          and similarity(p.text_normalized, $2) > 0.2
      ),
      merged as (
        select * from exact_token
        union all
        select * from fts_hits
        union all
        select * from trigram_hits
      )
      select
        passage_id,
        max(text_raw) as text_raw,
        max(score) as score,
        max(source_id) as source_id,
        max(source_title) as source_title,
        max(edition_id) as edition_id,
        max(volume_no) as volume_no,
        max(page_no) as page_no,
        max(line_start) as line_start,
        max(line_end) as line_end
      from merged
      group by passage_id
      order by max(score) desc, max(page_no) asc
      limit $3
      offset $4
    `,
    [params.bookId, normalizedQuery, params.limit, params.offset]
  );

  const anchorsByPassage = await getAnchorsForPassages(rows.map((row) => row.passage_id));

  return rows.map((row) => ({
    passageId: row.passage_id,
    snippet: row.text_raw,
    score: row.score,
    citation: mapCitationRow(row),
    anchors: anchorsByPassage.get(row.passage_id) ?? []
  }));
}

export async function getPassageById(passageId: string): Promise<PassageDetail | null> {
  const passageRows = await query<{
    passage_id: string;
    text_raw: string;
    text_normalized: string;
    source_id: string;
    source_title: string;
    edition_id: string;
    volume_no: number;
    page_no: number;
    line_start: number;
    line_end: number;
  }>(
    `
      select
        p.id as passage_id,
        p.text_raw,
        p.text_normalized,
        s.id as source_id,
        s.title_ar as source_title,
        e.id as edition_id,
        p.volume_no,
        p.page_no,
        p.line_start,
        p.line_end
      from passage p
      join edition e on e.id = p.edition_id
      join source s on s.id = e.source_id
      where p.id = $1
      limit 1
    `,
    [passageId]
  );

  const row = passageRows[0];
  if (!row) return null;

  const anchorsByPassage = await getAnchorsForPassages([passageId]);
  const tokenRows = await query<{
    id: string;
    passage_id: string;
    position: number;
    surface_raw: string;
    surface_normalized: string;
    lemma: string | null;
    root: string | null;
    pos: string | null;
    char_start: number;
    char_end: number;
  }>(
    `
      select
        id,
        passage_id,
        position,
        surface_raw,
        surface_normalized,
        lemma,
        root,
        pos,
        char_start,
        char_end
      from token
      where passage_id = $1
      order by position asc
    `,
    [passageId]
  );

  return {
    passageId,
    textRaw: row.text_raw,
    textNormalized: row.text_normalized,
    citation: mapCitationRow(row),
    anchors: anchorsByPassage.get(passageId) ?? [],
    tokens: tokenRows.map((token) => ({
      id: token.id,
      passageId: token.passage_id,
      position: token.position,
      surfaceRaw: token.surface_raw,
      surfaceNormalized: token.surface_normalized,
      lemma: token.lemma,
      root: token.root,
      pos: token.pos,
      charStart: token.char_start,
      charEnd: token.char_end
    }))
  };
}

export async function getPageById(pageId: string): Promise<PageDetail | null> {
  const rows = await query<PageDetail>(
    `
      select
        pi.id,
        pi.volume_id as "volumeId",
        pi.page_number as "pageNumber",
        pi.storage_path as "storagePath",
        pi.image_sha256 as "imageSha256",
        v.volume_number as "volumeNumber",
        e.id as "editionId",
        e.edition_name as "editionName",
        s.id as "sourceId",
        s.title_ar as "sourceTitle"
      from page_image pi
      join volume v on v.id = pi.volume_id
      join edition e on e.id = v.edition_id
      join source s on s.id = e.source_id
      where pi.id = $1
      limit 1
    `,
    [pageId]
  );
  return rows[0] ?? null;
}

export async function listReleases(): Promise<ReleaseManifest[]> {
  return query<ReleaseManifest>(
    `
      select
        dr.id as "releaseId",
        dr.version_tag as "versionTag",
        dr.generated_at as "generatedAt",
        dr.checksum_sha256 as "checksumSha256",
        dr.item_count as "itemCount"
      from dataset_release dr
      order by dr.generated_at desc
    `
  );
}
