import { SongRequestForm } from "@/components/SongRequestForm";
import { WorshipCatalog } from "@/components/WorshipCatalog";
import { AuthButton } from "@/components/AuthButton";
import { loadSongs } from "@/lib/load-songs";

export default async function Home() {
  const songs = await loadSongs();

  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#faf8f5]">
      <header className="sticky top-0 z-10 border-b border-stone-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-rose-400">
              4C Choir
            </p>
            <h1 className="text-xl font-semibold tracking-tight text-stone-900 sm:text-2xl">
              4C Worship
            </h1>
          </div>
          <AuthButton />
        </div>
      </header>

      <WorshipCatalog songs={songs} />

      <SongRequestForm />

      <footer className="mt-auto border-t border-stone-200/80 bg-white py-6 text-center text-xs text-stone-400">
        Sheet links open in Google Drive · Reference:{" "}
        <a
          className="text-rose-400 underline-offset-2 hover:underline"
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
