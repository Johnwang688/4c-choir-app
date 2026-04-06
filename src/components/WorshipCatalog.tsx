"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import type { Song } from "@/types/song";

const DEFAULT_VISIBLE_SONGS = 8;
const FAVORITE_HEART_ANIMATION_MS = 1100;
const HEART_BURST_VARIANTS = [
  { driftX: 24, driftY: -36, scale: 1, rotate: -10 },
  { driftX: 31, driftY: -44, scale: 1.1, rotate: 8 },
  { driftX: 27, driftY: -40, scale: 1.16, rotate: -4 },
] as const;

type FavoriteHeartBurst = {
  id: number;
  songId: string;
  driftX: number;
  driftY: number;
  scale: number;
  rotate: number;
};

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
  const [expanded, setExpanded] = useState(false);
  const [heartBursts, setHeartBursts] = useState<FavoriteHeartBurst[]>([]);
  const heartBurstTimeouts = useRef<number[]>([]);
  const heartBurstId = useRef(0);

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

  useEffect(() => {
    return () => {
      for (const timeoutId of heartBurstTimeouts.current) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  function launchFavoriteHeart(songId: string) {
    const variant =
      HEART_BURST_VARIANTS[heartBurstId.current % HEART_BURST_VARIANTS.length];
    const burst: FavoriteHeartBurst = {
      id: heartBurstId.current,
      songId,
      driftX: variant.driftX,
      driftY: variant.driftY,
      scale: variant.scale,
      rotate: variant.rotate,
    };
    heartBurstId.current += 1;

    setHeartBursts((prev) => [...prev, burst]);

    const timeoutId = window.setTimeout(() => {
      setHeartBursts((prev) => prev.filter((heart) => heart.id !== burst.id));
      heartBurstTimeouts.current = heartBurstTimeouts.current.filter(
        (value) => value !== timeoutId,
      );
    }, FAVORITE_HEART_ANIMATION_MS);

    heartBurstTimeouts.current.push(timeoutId);
  }

  function toggleFavorite(songId: string) {
    if (!session.authenticated || !session.email) return;
    const email = session.email;
    const shouldFavorite = !favorites.has(songId);

    if (shouldFavorite) {
      launchFavoriteHeart(songId);
    }

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

  const visibleSongs = expanded
    ? filtered
    : filtered.slice(0, DEFAULT_VISIBLE_SONGS);

  const shouldShowToggle = filtered.length > DEFAULT_VISIBLE_SONGS;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-6 sm:px-6 sm:pt-8">
      {session.authenticated && (
        <div className="mb-5">
          <button
            type="button"
            onClick={() => {
              setShowFavorites((v) => !v);
              setQ("");
              setExpanded(false);
            }}
            className={
              showFavorites
                ? "glass-chip inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white shadow-lg"
                : "glass-chip inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-violet-100/78 hover:border-fuchsia-200/30 hover:text-white"
            }
          >
            <IconHeart
              className={
                showFavorites ? "size-4 text-fuchsia-200" : "size-4 text-violet-200/65"
              }
              filled={showFavorites}
            />
            My Favorites
            {favorites.size > 0 && (
              <span
                className={
                  showFavorites
                    ? "rounded-full bg-white/18 px-1.5 py-0.5 text-xs font-semibold text-white"
                    : "rounded-full bg-white/12 px-1.5 py-0.5 text-xs font-semibold text-violet-100/82"
                }
              >
                {favorites.size}
              </span>
            )}
          </button>
        </div>
      )}

      <div className="relative mb-8">
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 text-violet-100/55" />
        <input
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setExpanded(false);
          }}
          placeholder="Search by title or author..."
          className="crystal-input w-full rounded-2xl py-3 pl-11 pr-4 text-[15px] shadow-xl outline-none"
          spellCheck={false}
          aria-label="Search songs"
        />
      </div>

      <p className="mb-4 text-sm text-violet-100/62">
        {showFavorites
          ? `${filtered.length} favorite${filtered.length === 1 ? "" : "s"}`
          : filtered.length === songs.length
            ? `${songs.length} songs`
            : `${filtered.length} of ${songs.length} songs`}
      </p>

      <ul className="flex flex-col gap-3">
        {visibleSongs.map((song) => (
          <li key={song.id}>
            <article className="glass-panel rounded-[1.7rem] p-5 transition-transform duration-300 hover:-translate-y-0.5">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0 flex-1">
                  <h2 className="metallic-text text-lg font-semibold leading-snug">
                    {song.title}
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-violet-100/66">
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
                          ? "glass-chip relative inline-flex items-center justify-center overflow-visible rounded-xl p-2 text-fuchsia-200"
                          : "glass-chip relative inline-flex items-center justify-center overflow-visible rounded-xl p-2 text-violet-100/56 hover:text-fuchsia-200"
                      }
                    >
                      {heartBursts
                        .filter((heart) => heart.songId === song.id)
                        .map((heart) => (
                          <span
                            key={heart.id}
                            className="favorite-heart-burst"
                            style={
                              {
                                "--favorite-heart-drift-x": `${heart.driftX}px`,
                                "--favorite-heart-drift-y": `${heart.driftY}px`,
                                "--favorite-heart-scale": heart.scale,
                                "--favorite-heart-rotate": `${heart.rotate}deg`,
                              } as CSSProperties
                            }
                            aria-hidden
                          >
                            <IconHeart className="size-4" filled />
                          </span>
                        ))}
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
                    className="glass-chip inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-violet-50 hover:text-white"
                  >
                    <IconSheet className="size-4 text-fuchsia-200" />
                    乐谱
                  </a>
                  <a
                    href={song.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="amethyst-button inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium"
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

      {shouldShowToggle && (
        <div className="mt-5 flex justify-center">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="glass-chip inline-flex items-center rounded-full px-5 py-2.5 text-sm font-medium text-violet-100/82 hover:border-fuchsia-200/30 hover:text-white"
          >
            {expanded ? "See less" : "See more"}
          </button>
        </div>
      )}

      {filtered.length === 0 && showFavorites ? (
        <p className="mt-10 text-center text-sm text-violet-100/60">
          No favorites yet. Tap the heart on any song to save it here.
        </p>
      ) : filtered.length === 0 ? (
        <p className="mt-10 text-center text-sm text-violet-100/60">
          No songs match &ldquo;{q}&rdquo;. Try another search.
        </p>
      ) : null}
    </div>
  );
}
