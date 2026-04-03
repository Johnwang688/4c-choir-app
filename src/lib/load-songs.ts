import type { Song } from "@/types/song";
import seed from "@/data/songs.json";

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

function parseSheetCsv(text: string): Song[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const header = parseCsvLine(lines[0]).map((h) => h.replace(/^\uFEFF/, "").trim());
  const titleIdx = header.findIndex((h) => /^title$/i.test(h));
  const authorIdx = header.findIndex((h) => /^author$/i.test(h));
  const sheetIdx = header.findIndex((h) => h.includes("乐谱"));
  const ytIdx = header.findIndex((h) => /^youtube$/i.test(h));
  const idIdx = header.findIndex(
    (h) => h.includes("Favorited") || h.includes("Softr") || h.includes("Record ID"),
  );

  const tI = titleIdx >= 0 ? titleIdx : 0;
  const aI = authorIdx >= 0 ? authorIdx : 1;
  const sI = sheetIdx >= 0 ? sheetIdx : 2;
  const yI = ytIdx >= 0 ? ytIdx : 3;
  const idI = idIdx >= 0 ? idIdx : 4;

  const songs: Song[] = [];
  for (let r = 1; r < lines.length; r++) {
    const cols = parseCsvLine(lines[r]);
    const title = cols[tI]?.trim();
    if (!title) continue;
    const id = cols[idI]?.trim() || `row-${r}`;
    songs.push({
      id,
      title,
      author: cols[aI]?.trim() ?? "",
      sheetMusicUrl: cols[sI]?.trim() || "#",
      youtubeUrl: cols[yI]?.trim() || "#",
    });
  }
  return songs;
}

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
