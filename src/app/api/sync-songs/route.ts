import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAuthEnv } from "@/lib/supabase-auth";
import {
  assertLikelySheetCsv,
  assertRowIdsSane,
  dedupeSyncRowsById,
  deleteStaleSongsUrl,
  formatSheetFetchError,
} from "@/lib/sync-songs-supabase";

// ---------------------------------------------------------------------------
// CSV parsing (Google Sheets "publish to web → CSV" format)
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
// Per-row validation — detect obviously mid-edit / partial data
// ---------------------------------------------------------------------------

const HTTP_RE = /^https?:\/\/.+/;

/**
 * Returns false if a row shows obvious signs of being mid-edit:
 *   - id starts with "row-" → we couldn't find a real record ID (blank ID cell)
 *   - a non-empty URL field doesn't look like a URL (partial typing)
 *
 * Author is free-text so it is never rejected. Empty-title rows are
 * already dropped by parseCsv before this runs.
 */
function isRowValid(row: SheetRow): boolean {
  if (row.id.startsWith("row-")) return false;
  if (row.sheet_music_url && !HTTP_RE.test(row.sheet_music_url)) return false;
  if (row.youtube_url && !HTTP_RE.test(row.youtube_url)) return false;
  return true;
}

// ---------------------------------------------------------------------------
// Supabase upsert helpers
// ---------------------------------------------------------------------------

async function upsertSongs(
  supabaseUrl: string,
  serviceRoleKey: string,
  rows: SheetRow[],
) {
  const res = await fetch(`${supabaseUrl}/rest/v1/songs`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(rows),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Supabase upsert failed (${res.status}): ${body}`);
  }
}

async function deleteStaleSongs(
  supabaseUrl: string,
  serviceRoleKey: string,
  keepIds: string[],
) {
  if (keepIds.length === 0) return;

  const res = await fetch(deleteStaleSongsUrl(supabaseUrl, keepIds), {
    method: "DELETE",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Prefer: "return=minimal",
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Supabase delete failed (${res.status}): ${body}`);
  }
}

async function upsertLastSyncedAt(supabaseUrl: string, serviceRoleKey: string) {
  const base = supabaseUrl.replace(/\/$/, "");
  await fetch(`${base}/rest/v1/metadata`, {
    method: "POST",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify([
      { key: "last_synced_at", value: new Date().toISOString() },
    ]),
  });
}

// ---------------------------------------------------------------------------
// Route handler — called by Vercel Cron (and optionally manually)
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // Vercel automatically sends CRON_SECRET as a Bearer token.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  const sheetUrl: string | undefined = process.env.SHEETS_CSV_URL?.trim();
  if (!sheetUrl) {
    return NextResponse.json(
      { ok: false, error: "SHEETS_CSV_URL is not configured" },
      { status: 503 },
    );
  }
  const sheetUrlSafe: string = sheetUrl;

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceRoleKey) {
    return NextResponse.json(
      { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY is not configured" },
      { status: 503 },
    );
  }

  let supabaseUrl: string;
  try {
    ({ url: supabaseUrl } = getSupabaseAuthEnv());
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 503 },
    );
  }

  // ------------------------------------------------------------------
  // Double-fetch consistency guard
  // Fetch the sheet twice, 3 seconds apart. If the content differs
  // between the two fetches it means the sheet was saved mid-check,
  // so we abort rather than risk capturing a half-edited state.
  //
  // Note: Google's "publish to web" CSV can lag ~30-60 s behind live
  // edits, so this catches saves that land within the publish window
  // rather than every keystroke. It is a zero-credential best-effort
  // guard. For stronger protection consider Drive API modifiedTime.
  // ------------------------------------------------------------------
  async function fetchSheet() {
    const res = await fetch(sheetUrlSafe, { cache: "no-store" });
    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: formatSheetFetchError(res.status) },
        { status: 502 },
      );
    }
    return { body: await res.text(), contentType: res.headers.get("content-type") };
  }

  const first = await fetchSheet();
  if (first instanceof NextResponse) return first;

  await new Promise<void>((resolve) => setTimeout(resolve, 3000));

  const second = await fetchSheet();
  if (second instanceof NextResponse) return second;

  if (first.body !== second.body) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Sheet content changed between consistency checks — someone may be editing. Sync aborted; will retry on the next cycle.",
      },
      { status: 409 },
    );
  }

  const sheetBody = first.body;
  assertLikelySheetCsv(sheetBody, first.contentType);
  let rows = parseCsv(sheetBody);
  assertRowIdsSane(rows);
  if (rows.length === 0) {
    return NextResponse.json(
      { ok: false, error: "CSV parsed to 0 rows — aborting to avoid data loss" },
      { status: 422 },
    );
  }

  const rowsParsed = rows.length;
  rows = dedupeSyncRowsById(rows);

  // ------------------------------------------------------------------
  // Per-row validation — preserve DB values for suspect rows rather
  // than overwriting with mid-edit garbage.
  //
  // Suspect rows are excluded from the upsert so the database keeps
  // whatever value it already has for those IDs. Their IDs are still
  // included in keepIds so they are NOT deleted while being edited.
  // Row order in the sheet doesn't matter — matching is always by ID.
  // ------------------------------------------------------------------
  const validRows = rows.filter(isRowValid);
  const suspectRows = rows.filter((r) => !isRowValid(r));

  if (validRows.length > 0) {
    await upsertSongs(supabaseUrl, serviceRoleKey, validRows);
  }
  // Pass ALL IDs (valid + suspect) so suspect rows are never deleted.
  await deleteStaleSongs(supabaseUrl, serviceRoleKey, rows.map((r) => r.id));
  await upsertLastSyncedAt(supabaseUrl, serviceRoleKey);
  revalidateTag("songs", "max");

  return NextResponse.json({
    ok: true,
    synced: validRows.length,
    ...(rows.length < rowsParsed && {
      duplicateIdsSkipped: rowsParsed - rows.length,
    }),
    ...(suspectRows.length > 0 && {
      suspectRowsPreserved: suspectRows.length,
      suspectRowIds: suspectRows.map((r) => r.id),
    }),
  });
}

// Allow triggering manually via GET (e.g. browser or curl) when CRON_SECRET is not set.
export async function GET(request: NextRequest) {
  return POST(request);
}
