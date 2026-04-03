import { SongRequestForm } from "@/components/SongRequestForm";
import { WorshipCatalog } from "@/components/WorshipCatalog";
import { loadSongs } from "@/lib/load-songs";

export default async function Home() {
  const songs = await loadSongs();

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#f6f7f9]">
      <header className="sticky top-0 z-10 border-b border-zinc-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-violet-600">
              4C Choir
            </p>
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
              4C Worship
            </h1>
          </div>
        </div>
      </header>

      <WorshipCatalog songs={songs} />

      <SongRequestForm />

      <footer className="mt-auto border-t border-zinc-200/80 bg-white py-6 text-center text-xs text-zinc-500">
        Sheet links open in Google Drive · Reference:{" "}
        <a
          className="text-violet-600 underline-offset-2 hover:underline"
          href="https://docs.google.com/spreadsheets/d/1ky1W-drBEIkWFqLo4OToUNbuF1FybJzh9-rWP_Ky-go/edit"
          target="_blank"
          rel="noopener noreferrer"
        >
          4c worship spreadsheet
        </a>
      </footer>
    </div>
  );
}
