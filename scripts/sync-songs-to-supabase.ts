/**
 * Standalone sync script — mirrors the logic in /api/sync-songs.
 * Usage:  npm run sync:songs
 * Reads .env.local automatically via dotenv.
 */

import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

// ---------------------------------------------------------------------------
// CSV parsing
// ---------------------------------------------------------------------------

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

type SheetRow = {
  id: string;
  title: string;
  author: string;
  sheet_music_url: string;
  youtube_url: string;
};

function parseCsv(text: string): SheetRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const header = parseCsvLine(lines[0]).map((h) =>
    h.replace(/^\uFEFF/, "").trim(),
  );
  const idx = (patterns: RegExp[]) =>
    header.findIndex((h) => patterns.some((p) => p.test(h)));

  const tI = idx([/^title$/i]);
  const aI = idx([/^author$/i]);
  const sI = idx([/乐谱/]);
  const yI = idx([/^youtube$/i]);
  const idI = idx([/Favorited|Softr|Record ID/]);

  const rows: SheetRow[] = [];
  for (let r = 1; r < lines.length; r++) {
    const cols = parseCsvLine(lines[r]);
    const title = cols[tI >= 0 ? tI : 0]?.trim();
    if (!title) continue;
    rows.push({
      id: cols[idI >= 0 ? idI : 4]?.trim() || `row-${r}`,
      title,
      author: cols[aI >= 0 ? aI : 1]?.trim() ?? "",
      sheet_music_url: cols[sI >= 0 ? sI : 2]?.trim() || "",
      youtube_url: cols[yI >= 0 ? yI : 3]?.trim() || "",
    });
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Supabase helpers
// ---------------------------------------------------------------------------

function toSupabaseUrl(raw: string): string {
  const value = raw.trim();
  if (value.includes(".supabase.co")) return value.replace(/\/$/, "");
  const m = value.match(/\/project\/([a-z0-9]+)/i);
  if (!m) throw new Error("SUPABASE_PROJECT_URL is not a recognised Supabase URL.");
  return `https://${m[1]}.supabase.co`;
}

async function upsert(url: string, key: string, rows: SheetRow[]) {
  const res = await fetch(`${url}/rest/v1/songs`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`Upsert failed (${res.status}): ${await res.text()}`);
}

async function deleteStale(url: string, key: string, keepIds: string[]) {
  if (keepIds.length === 0) return;
  const list = keepIds.map((id) => `"${id}"`).join(",");
  const res = await fetch(`${url}/rest/v1/songs?id=not.in.(${list})`, {
    method: "DELETE",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Prefer: "return=minimal",
    },
  });
  if (!res.ok) throw new Error(`Delete failed (${res.status}): ${await res.text()}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const sheetUrl = process.env.SHEETS_CSV_URL?.trim();
  if (!sheetUrl) throw new Error("SHEETS_CSV_URL is not set");

  const rawSupabaseUrl = process.env.SUPABASE_PROJECT_URL?.trim();
  if (!rawSupabaseUrl) throw new Error("SUPABASE_PROJECT_URL is not set");

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");

  const supabaseUrl = toSupabaseUrl(rawSupabaseUrl);

  console.log("Fetching sheet…");
  const sheetRes = await fetch(sheetUrl);
  if (!sheetRes.ok) throw new Error(`Sheet fetch failed (${sheetRes.status})`);

  const rows = parseCsv(await sheetRes.text());
  if (rows.length === 0) throw new Error("CSV parsed to 0 rows — aborting");

  console.log(`Upserting ${rows.length} songs…`);
  await upsert(supabaseUrl, serviceRoleKey, rows);

  console.log("Removing stale songs…");
  await deleteStale(supabaseUrl, serviceRoleKey, rows.map((r) => r.id));

  console.log(`Done. ${rows.length} songs synced.`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
