"use client";

import { useEffect, useMemo, useState } from "react";
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

function IconHeart({
  className,
  filled,
}: {
  className?: string;
  filled?: boolean;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export function WorshipCatalog({ songs }: { songs: Song[] }) {
  const [q, setQ] = useState("");
  const [session, setSession] = useState<{
    authenticated: boolean;
    email: string | null;
  }>({ authenticated: false, email: null });
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showFavorites, setShowFavorites] = useState(false);

  useEffect(() => {
    async function loadSession() {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        const data = (await res.json()) as {
          authenticated?: boolean;
          user?: { email?: string | null };
        };
        const authenticated = Boolean(data.authenticated);
        const email = data.user?.email ?? null;
        setSession({ authenticated, email });

        if (authenticated && email) {
          const stored = localStorage.getItem(`fourc-favorites-${email}`);
          if (stored) {
            try {
              setFavorites(new Set(JSON.parse(stored) as string[]));
            } catch {
              // ignore malformed data
            }
          }
        }
      } catch {
        // ignore network errors
      }
    }
    void loadSession();
  }, []);

  function toggleFavorite(songId: string) {
    if (!session.authenticated || !session.email) return;
    const email = session.email;
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(songId)) {
        next.delete(songId);
      } else {
        next.add(songId);
      }
      localStorage.setItem(
        `fourc-favorites-${email}`,
        JSON.stringify([...next]),
      );
      return next;
    });
  }

  const filtered = useMemo(() => {
    const list = showFavorites ? songs.filter((s) => favorites.has(s.id)) : songs;
    const n = normalize(q);
    if (!n) return list;
    return list.filter((s) => {
      const hay = normalize(`${s.title} ${s.author}`);
      return hay.includes(n);
    });
  }, [q, songs, showFavorites, favorites]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
      {session.authenticated && (
        <div className="mb-5">
          <button
            type="button"
            onClick={() => {
              setShowFavorites((v) => !v);
              setQ("");
            }}
            className={
              showFavorites
                ? "inline-flex items-center gap-2 rounded-full border border-rose-300 bg-rose-100 px-4 py-2 text-sm font-medium text-rose-700 transition-colors"
                : "inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-600 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
            }
          >
            <IconHeart
              className={
                showFavorites ? "size-4 text-rose-500" : "size-4 text-stone-400"
              }
              filled={showFavorites}
            />
            My Favorites
            {favorites.size > 0 && (
              <span
                className={
                  showFavorites
                    ? "rounded-full bg-rose-500 px-1.5 py-0.5 text-xs font-semibold text-white"
                    : "rounded-full bg-stone-200 px-1.5 py-0.5 text-xs font-semibold text-stone-600"
                }
              >
                {favorites.size}
              </span>
            )}
          </button>
        </div>
      )}

      <div className="relative mb-8">
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-stone-400" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by title or author…"
          className="w-full rounded-2xl border border-stone-200 bg-white py-3 pl-11 pr-4 text-[15px] text-stone-900 shadow-sm outline-none ring-rose-400/20 placeholder:text-stone-400 focus:border-rose-300 focus:ring-4"
          spellCheck={false}
          aria-label="Search songs"
        />
      </div>

      <p className="mb-4 text-sm text-stone-400">
        {showFavorites
          ? `${filtered.length} favorite${filtered.length === 1 ? "" : "s"}`
          : filtered.length === songs.length
            ? `${songs.length} songs`
            : `${filtered.length} of ${songs.length} songs`}
      </p>

      <ul className="flex flex-col gap-3">
        {filtered.map((song) => (
          <li key={song.id}>
            <article className="rounded-2xl border border-stone-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold leading-snug text-stone-900">
                    {song.title}
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-stone-500">
                    {song.author}
                  </p>
                </div>
                <div className="mt-4 flex shrink-0 flex-wrap items-center gap-2 sm:mt-0 sm:justify-end">
                  {session.authenticated && (
                    <button
                      type="button"
                      onClick={() => toggleFavorite(song.id)}
                      aria-label={
                        favorites.has(song.id)
                          ? "Remove from favorites"
                          : "Add to favorites"
                      }
                      className={
                        favorites.has(song.id)
                          ? "inline-flex items-center justify-center rounded-lg border border-rose-200 bg-rose-50 p-2 text-rose-500 transition-colors hover:bg-rose-100"
                          : "inline-flex items-center justify-center rounded-lg border border-stone-200 bg-stone-50 p-2 text-stone-400 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-500"
                      }
                    >
                      <IconHeart
                        className="size-4"
                        filled={favorites.has(song.id)}
                      />
                    </button>
                  )}
                  <a
                    href={song.sheetMusicUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-700 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-900"
                  >
                    <IconSheet className="size-4 text-rose-400" />
                    乐谱
                  </a>
                  <a
                    href={song.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-transparent bg-rose-400 px-3 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-rose-500"
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

      {filtered.length === 0 && showFavorites ? (
        <p className="mt-10 text-center text-sm text-stone-400">
          No favorites yet. Tap the heart on any song to save it here.
        </p>
      ) : filtered.length === 0 ? (
        <p className="mt-10 text-center text-sm text-stone-400">
          No songs match &ldquo;{q}&rdquo;. Try another search.
        </p>
      ) : null}
    </div>
  );
}
