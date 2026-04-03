import type { Song } from "@/types/song";
import { getSupabaseAuthEnv } from "@/lib/supabase-auth";

type SongRow = {
  id: string;
  title: string;
  author: string;
  sheet_music_url: string;
  youtube_url: string;
};

export async function loadSongs(): Promise<Song[]> {
  const { url, anonKey } = getSupabaseAuthEnv();

  const res = await fetch(
    `${url}/rest/v1/songs?select=id,title,author,sheet_music_url,youtube_url&order=title.asc`,
    {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      next: { revalidate: 60, tags: ["songs"] },
    },
  );

  if (!res.ok) {
    throw new Error(`Failed to load songs from Supabase (${res.status})`);
  }

  const rows = (await res.json()) as SongRow[];

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    author: row.author,
    sheetMusicUrl: row.sheet_music_url,
    youtubeUrl: row.youtube_url,
  }));
}
