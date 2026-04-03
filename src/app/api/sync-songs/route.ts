import { revalidateTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAuthEnv } from "@/lib/supabase-auth";

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

  // Build ?id=not.in.(id1,id2,...) filter
  const list = keepIds.map((id) => `"${id}"`).join(",");
  const res = await fetch(
    `${supabaseUrl}/rest/v1/songs?id=not.in.(${list})`,
    {
      method: "DELETE",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        Prefer: "return=minimal",
      },
    },
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Supabase delete failed (${res.status}): ${body}`);
  }
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

  const sheetUrl = process.env.SHEETS_CSV_URL?.trim();
  if (!sheetUrl) {
    return NextResponse.json(
      { ok: false, error: "SHEETS_CSV_URL is not configured" },
      { status: 503 },
    );
  }

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

  // Fetch the sheet
  const sheetRes = await fetch(sheetUrl, { cache: "no-store" });
  if (!sheetRes.ok) {
    return NextResponse.json(
      { ok: false, error: `Sheet fetch failed (${sheetRes.status})` },
      { status: 502 },
    );
  }

  const rows = parseCsv(await sheetRes.text());
  if (rows.length === 0) {
    return NextResponse.json(
      { ok: false, error: "CSV parsed to 0 rows — aborting to avoid data loss" },
      { status: 422 },
    );
  }

  await upsertSongs(supabaseUrl, serviceRoleKey, rows);
  await deleteStaleSongs(supabaseUrl, serviceRoleKey, rows.map((r) => r.id));
  revalidateTag("songs");

  return NextResponse.json({ ok: true, synced: rows.length });
}

// Allow triggering manually via GET (e.g. browser or curl) when CRON_SECRET is not set.
export async function GET(request: NextRequest) {
  return POST(request);
}
