import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from '@module/prototypes';
import { cn } from '#studio/runtime';
import { SNAPSHOTS, engineHref, type Snapshot } from './pieces';

// The board and its peek. A tile is the snapshot at board size; clicking it opens the peek: the same live visual at full
// size, what the work is, and where it goes deeper. Arrow keys step through the board from inside the peek, Escape closes.

// Where each tile sits on the 12-column board, by snapshot id. The order of SNAPSHOTS is the reading order.
const SPANS: Record<string, string> = {
  'pattern-engine': 'lg:col-span-8',
  'pixel-wave': 'lg:col-span-4',
  sublime: 'lg:col-span-4',
  'design-studio': 'lg:col-span-4',
  'pixel-mark': 'lg:col-span-4',
  expansion: 'lg:col-span-6',
  'query-builder': 'lg:col-span-6',
};

export function Board({ className }: { className?: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const tiles = useRef<(HTMLButtonElement | null)[]>([]);
  const close = useCallback(() => {
    setOpen(current => {
      if (current !== null) requestAnimationFrame(() => tiles.current[current]?.focus());
      return null;
    });
  }, []);
  return (
    <>
      <div className={cn('grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-12', className)}>
        {SNAPSHOTS.map((snapshot, i) => (
          <Tile
            key={snapshot.id}
            ref={el => {
              tiles.current[i] = el;
            }}
            snapshot={snapshot}
            className={cn(SPANS[snapshot.id], snapshot.aspect, snapshot.id === 'pixel-wave' && 'lg:aspect-auto')}
            onOpen={() => setOpen(i)}
          />
        ))}
      </div>
      {open !== null && <Peek index={open} onIndex={setOpen} onClose={close} />}
    </>
  );
}

function Tile({ snapshot, className, onOpen, ref }: { snapshot: Snapshot; className?: string; onOpen: () => void; ref?: (el: HTMLButtonElement | null) => void }) {
  const { Visual, title, line } = snapshot;
  return (
    <button
      ref={ref}
      type="button"
      onClick={onOpen}
      aria-label={`${title}. ${line}`}
      className={cn(
        'group relative block w-full cursor-zoom-in overflow-hidden rounded-2xl bg-card text-left outline-none ring-1 ring-border/70 transition-shadow duration-300 hover:ring-foreground/25 focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      <Visual />
      <span className="pointer-events-none absolute inset-x-3 bottom-3 flex translate-y-1 items-center gap-2 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 motion-reduce:translate-y-0 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100">
        <span className="max-w-full truncate rounded-full bg-background/85 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm ring-1 ring-border/60 backdrop-blur">
          {title}
        </span>
      </span>
    </button>
  );
}

function Peek({ index, onIndex, onClose }: { index: number; onIndex: (i: number) => void; onClose: () => void }) {
  const snapshot = SNAPSHOTS[index]!;
  const { Visual, title, line, summary, aspect } = snapshot;
  const [article, setArticle] = useState<{ title: string; slug: string; visual: Parameters<typeof engineHref>[0] } | null>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const step = useCallback((by: number) => onIndex((index + by + SNAPSHOTS.length) % SNAPSHOTS.length), [index, onIndex]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') step(1);
      if (event.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose, step]);
  useEffect(() => dialog.current?.focus(), []);
  // Pattern Engine's links follow the article on screen, so "open" lands on that article's art.
  const links =
    snapshot.id === 'pattern-engine' && article
      ? [
          { label: 'Open this art in Pattern Engine', to: engineHref(article.visual) },
          { label: `Read “${article.title}”`, to: `https://itspatmorgan.com/writing/${article.slug}`, external: true },
        ]
      : snapshot.links;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6" role="presentation">
      <button type="button" aria-label="Close" tabIndex={-1} onClick={onClose} className="absolute inset-0 cursor-zoom-out bg-background/80 backdrop-blur-[12px]" />
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="relative grid max-h-full w-full max-w-[1400px] grid-cols-1 gap-5 overflow-y-auto rounded-[24px] bg-card p-3 shadow-[0_24px_80px_-20px_rgb(0_0_0/0.35)] outline-none ring-1 ring-border sm:p-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8"
      >
        <div className={cn('relative w-full overflow-hidden rounded-2xl ring-1 ring-border/60', aspect, 'max-h-[72vh]')} key={snapshot.id}>
          <Visual peek onArticle={snapshot.id === 'pattern-engine' ? setArticle : undefined} />
        </div>
        <aside className="flex flex-col px-2 pb-2 lg:px-0 lg:py-3 lg:pr-3">
          <div className="text-sm text-muted-foreground">{line}</div>
          <h2 className="mt-1 text-2xl font-semibold leading-tight tracking-tight text-balance text-foreground">{title}</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-pretty text-muted-foreground">{summary}</p>
          <div className="mt-6 flex flex-col gap-2">
            {links.map((link, i) => {
              const style = cn(
                'inline-flex h-10 items-center justify-between gap-3 rounded-full px-4 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                i === 0 ? 'bg-foreground text-background hover:bg-foreground/90' : 'ring-1 ring-border text-foreground hover:bg-muted',
              );
              const arrow = <span aria-hidden>{link.external ? '↗' : '→'}</span>;
              return link.external ? (
                <a key={link.label} href={link.to} target="_blank" rel="noreferrer" className={style}>
                  {link.label}
                  {arrow}
                </a>
              ) : (
                <Link key={link.label} to={link.to} className={style}>
                  {link.label}
                  {arrow}
                </Link>
              );
            })}
          </div>
          <div className="mt-auto flex items-center justify-between gap-2 pt-8 text-sm text-muted-foreground">
            <div className="flex gap-1">
              <button type="button" onClick={() => step(-1)} aria-label="Previous snapshot" className="flex size-9 items-center justify-center rounded-full ring-1 ring-border hover:bg-muted hover:text-foreground">←</button>
              <button type="button" onClick={() => step(1)} aria-label="Next snapshot" className="flex size-9 items-center justify-center rounded-full ring-1 ring-border hover:bg-muted hover:text-foreground">→</button>
            </div>
            <span className="tabular-nums">
              {index + 1} / {SNAPSHOTS.length}
            </span>
            <button type="button" onClick={onClose} className="rounded-full px-3 py-2 hover:bg-muted hover:text-foreground">Close</button>
          </div>
        </aside>
      </div>
    </div>
  );
}
