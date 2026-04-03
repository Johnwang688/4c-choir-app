/**
 * Fetches SHEETS_CSV_URL and writes src/data/songs.json.
 * Run from repo root: npm run sync:songs
 * Watch every 60s: npm run sync:songs:watch
 */
import "dotenv/config";
import { writeFileSync } from "fs";
import { join } from "path";
import { parseSheetCsv } from "../src/lib/sheet-csv";
import type { Song } from "../src/types/song";

const OUT = join(process.cwd(), "src", "data", "songs.json");
const DEFAULT_INTERVAL_MS = 60_000;

function getUrl(): string | undefined {
  return process.env.SHEETS_CSV_URL?.trim();
}

async function syncOnce(): Promise<{ ok: true; count: number } | { ok: false; reason: string }> {
  const url = getUrl();
  if (!url) {
    return { ok: false, reason: "SHEETS_CSV_URL is not set (check .env)" };
  }

  let res: Response;
  try {
    res = await fetch(url);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, reason: `fetch failed: ${msg}` };
  }

  if (!res.ok) {
    return { ok: false, reason: `HTTP ${res.status} ${res.statusText}` };
  }

  const text = await res.text();
  const songs: Song[] = parseSheetCsv(text);
  if (songs.length === 0) {
    return { ok: false, reason: "parsed 0 songs (CSV empty or wrong shape); not writing file" };
  }

  const body = `${JSON.stringify(songs, null, 2)}\n`;
  writeFileSync(OUT, body, "utf8");
  return { ok: true, count: songs.length };
}

const watch = process.argv.includes("--watch");
const intervalArg = process.argv.find((a) => a.startsWith("--interval="));
const intervalMs = intervalArg
  ? Math.max(5_000, Number.parseInt(intervalArg.slice("--interval=".length), 10) || DEFAULT_INTERVAL_MS)
  : DEFAULT_INTERVAL_MS;

async function main() {
  const run = async () => {
    const result = await syncOnce();
    const ts = new Date().toISOString();
    if (result.ok) {
      console.log(`[${ts}] wrote ${OUT} (${result.count} songs)`);
    } else {
      console.error(`[${ts}] sync skipped: ${result.reason}`);
    }
    return result.ok;
  };

  const ok = await run();

  if (!watch) {
    process.exit(ok ? 0 : 1);
    return;
  }

  console.log(`Watching: refetch every ${intervalMs / 1000}s (Ctrl+C to stop)`);
  setInterval(() => {
    void run();
  }, intervalMs);
}

void main();
