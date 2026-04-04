/**
 * Helpers for sheet → Supabase sync (used by /api/sync-songs and scripts/sync-songs-to-supabase).
 */

export type SyncSheetRow = {
  id: string;
  title: string;
  author: string;
  sheet_music_url: string;
  youtube_url: string;
};

/** Human-readable message when `fetch(SHEETS_CSV_URL)` is not OK. */
export function formatSheetFetchError(status: number): string {
  const base = `Sheet fetch failed (${status})`;
  if (status === 401 || status === 403) {
    return (
      `${base} — Google needs anonymous access to the CSV. ` +
      "In Sheets: File → Share → Publish to web → choose the tab → CSV → Publish, then set SHEETS_CSV_URL to that published link (…/pub?output=csv). " +
      "A private /export?format=csv URL usually returns 401 from scripts because you are not logged in."
    );
  }
  return base;
}

/** PostgREST string literal: wrap in " and double internal quotes. */
export function postgrestStringLiteral(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

/** Full REST URL for DELETE ... WHERE id NOT IN (...), with a safe query string. */
export function deleteStaleSongsUrl(supabaseUrl: string, keepIds: string[]): string {
  const base = supabaseUrl.replace(/\/$/, "");
  const list = keepIds.map(postgrestStringLiteral).join(",");
  const filter = `not.in.(${list})`;
  return `${base}/rest/v1/songs?id=${encodeURIComponent(filter)}`;
}

export function assertLikelySheetCsv(
  body: string,
  contentType: string | null,
): void {
  const ct = contentType?.split(";")[0]?.trim().toLowerCase() ?? "";
  if (ct.includes("text/html") || ct.includes("application/xhtml")) {
    throw new Error(
      "Sheet URL returned HTML (Content-Type). Use Google Sheets File → Share → Publish to web, choose CSV, and set SHEETS_CSV_URL to that published link.",
    );
  }
  const t = body.trimStart();
  if (t.startsWith("<") || /<\s*html[\s>]/i.test(body.slice(0, 4000))) {
    throw new Error(
      "Sheet body looks like HTML, not CSV. Publish the sheet as CSV and point SHEETS_CSV_URL at the published CSV URL.",
    );
  }
}

/**
 * One POST upsert must not contain duplicate primary keys (Postgres 21000).
 * Last row per `id` wins for field values; output order follows first occurrence in the sheet.
 */
export function dedupeSyncRowsById(rows: SyncSheetRow[]): SyncSheetRow[] {
  const lastById = new Map<string, SyncSheetRow>();
  for (const row of rows) {
    lastById.set(row.id, row);
  }
  const seen = new Set<string>();
  const out: SyncSheetRow[] = [];
  for (const row of rows) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    out.push(lastById.get(row.id)!);
  }
  return out;
}

export function assertRowIdsSane(rows: SyncSheetRow[]): void {
  for (let i = 0; i < rows.length; i++) {
    const id = rows[i].id;
    if (id.length > 256) {
      throw new Error(
        `Row ${i + 2} (data row): id is ${id.length} chars — likely wrong CSV or HTML in the id column. Fix SHEETS_CSV_URL or the sheet.`,
      );
    }
    if (/[\r\n\x00-\x08\x0b\x0c\x0e-\x1f]/.test(id)) {
      throw new Error(`Row ${i + 2}: id contains control characters — invalid CSV or wrong URL.`);
    }
    if (/function\s*\(|<script|javascript:/i.test(id)) {
      throw new Error(
        `Row ${i + 2}: id looks like script/HTML — you are probably fetching a web page instead of published CSV.`,
      );
    }
  }
}
