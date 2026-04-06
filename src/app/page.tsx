import { SongRequestForm } from "@/components/SongRequestForm";
import { WorshipCatalog } from "@/components/WorshipCatalog";
import { AuthButton } from "@/components/AuthButton";
import { loadSongs, loadLastSyncedAt } from "@/lib/load-songs";

export default async function Home() {
  const [songs, lastSyncedAt] = await Promise.all([loadSongs(), loadLastSyncedAt()]);

  return (
    <div className="app-shell flex min-h-full flex-1 flex-col">
      <header className="glass-panel sticky top-0 z-10 border-b border-white/10">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <h1 className="metallic-text text-xl font-semibold tracking-tight sm:text-2xl">
              4C Worship
            </h1>
          </div>
          <AuthButton />
        </div>
      </header>

      <WorshipCatalog songs={songs} />

      <SongRequestForm />

      <footer className="mt-auto border-t border-white/10 bg-black/10 py-6 text-center text-xs text-violet-100/60 backdrop-blur-sm">
        Sheet links open in Google Drive
        {lastSyncedAt && (
          <>
            {" "}· Updated at:{" "}
            {new Date(lastSyncedAt).toLocaleString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              timeZoneName: "short",
            })}
          </>
        )}
      </footer>
    </div>
  );
}
