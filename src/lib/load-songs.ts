import type { Song } from "@/types/song";
import seed from "@/data/songs.json";
import { parseSheetCsv } from "@/lib/sheet-csv";

export async function loadSongs(): Promise<Song[]> {
  const url = process.env.SHEETS_CSV_URL?.trim();
  if (!url) {
    return seed as Song[];
  }

  try {
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) {
      return seed as Song[];
    }
    const parsed = parseSheetCsv(await res.text());
    return parsed.length > 0 ? parsed : (seed as Song[]);
  } catch {
    return seed as Song[];
  }
}
