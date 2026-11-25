/** @studio-id qhnw6qw36yr332vm */
import { CasePiece, PatternEnginePiece, PixelMarkPiece, PixelWavePiece } from './_components/pieces';

// Studio's front page with Snapshots as its home base: the greeting and search panel stay as they are, narrow and
// centred, and the space below them becomes a board of the studio's best work, every piece live. Using the studio
// still starts at the search; the board is what you see around it.
export default function StudioHome() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <main className="mx-auto w-full max-w-xl px-4 pt-[10vh] pb-10">
        <h1 className="mb-6 text-center text-2xl font-semibold tracking-tight">Welcome back, Patrick</h1>
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex h-11 items-center gap-2.5 border-b border-border px-4 text-sm text-muted-foreground">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <span className="flex-1">Search the studio</span>
            <kbd className="rounded border border-border px-1.5 py-0.5 font-sans text-[11px] leading-none">⌘K</kbd>
          </div>
          <div className="px-4 py-3 text-sm">
            <div className="mb-1.5 text-xs font-medium text-muted-foreground">Your prototypes</div>
            {['Pattern Engine', 'itspatmorgan.com', 'Snapshots board'].map(name => (
              <div key={name} className="py-1.5">{name}</div>
            ))}
          </div>
        </div>
      </main>
      <section aria-label="Snapshots" className="mx-auto w-full max-w-[1600px] px-4 pb-16 sm:px-6">
        <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-12">
          <PatternEnginePiece className="aspect-[1200/630] lg:col-span-8" />
          <PixelWavePiece className="lg:col-span-4" />
          <CasePiece id="sublime" className="lg:col-span-4" />
          <CasePiece id="design-studio" className="lg:col-span-4" />
          <PixelMarkPiece className="aspect-video lg:col-span-4" />
          <CasePiece id="expansion" className="lg:col-span-6" />
          <CasePiece id="query-builder" className="lg:col-span-6" />
        </div>
      </section>
    </div>
  );
}
