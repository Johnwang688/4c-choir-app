"use client";

import { useMemo, useState } from "react";
import type { Song } from "@/types/song";

function normalize(s: string) {
  return s.toLowerCase().trim();
}

function IconSheet({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function IconPlay({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M8 5v14l11-7L8 5z" />
    </svg>
  );
}

function IconSearch({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export function WorshipCatalog({ songs }: { songs: Song[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const n = normalize(q);
    if (!n) return songs;
    return songs.filter((s) => {
      const hay = normalize(`${s.title} ${s.author}`);
      return hay.includes(n);
    });
  }, [q, songs]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
      <div className="relative mb-8">
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-zinc-400" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by title or author…"
          className="w-full rounded-xl border border-zinc-200 bg-white py-3 pl-11 pr-4 text-[15px] text-zinc-900 shadow-sm outline-none ring-violet-500/20 placeholder:text-zinc-400 focus:border-violet-300 focus:ring-4"
          spellCheck={false}
          aria-label="Search songs"
        />
      </div>

      <p className="mb-4 text-sm text-zinc-500">
        {filtered.length === songs.length
          ? `${songs.length} songs`
          : `${filtered.length} of ${songs.length} songs`}
      </p>

      <ul className="flex flex-col gap-3">
        {filtered.map((song) => (
          <li key={song.id}>
            <article className="rounded-2xl border border-zinc-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold leading-snug text-zinc-900">
                    {song.title}
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                    {song.author}
                  </p>
                </div>
                <div className="mt-4 flex shrink-0 flex-wrap gap-2 sm:mt-0 sm:justify-end">
                  <a
                    href={song.sheetMusicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-800 transition-colors hover:border-violet-200 hover:bg-violet-50 hover:text-violet-900"
                  >
                    <IconSheet className="size-4 text-violet-600" />
                    乐谱
                  </a>
                  <a
                    href={song.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-transparent bg-violet-600 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-violet-700"
                  >
                    <IconPlay className="size-4 text-white/90" />
                    YouTube
                  </a>
                </div>
              </div>
            </article>
          </li>
        ))}
      </ul>

      {filtered.length === 0 ? (
        <p className="mt-10 text-center text-sm text-zinc-500">
          No songs match “{q}”. Try another search.
        </p>
      ) : null}
    </div>
  );
}
