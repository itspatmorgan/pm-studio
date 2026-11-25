// Snapshots in the app: a board of the studio's most compelling visuals across the front page, below the search. Each
// tile is the visual's own view, live (the visuals/board host); clicking it opens the peek: the same view large and
// interactive, what the work is, and where it goes deeper. Nothing is made here; it shows snapshots.ts, read through the
// manifest (build.ts), and the website mirrors the same list.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { PlayCircleIcon } from '@hugeicons/core-free-icons';
import { ArtifactHost, type ModuleApp } from '#studio/ui';
import { allPrototypes, contribution, withItems, type ArtifactContext, type Manifest } from '#studio/data';
import { cn } from '#studio/runtime';
import type { Snapshot, SnapshotsContribution } from './snapshots.ts';

// The board formats' canvases (src/modules/visuals/lib/formats.ts): a tile takes its visual's shape, and the view is laid
// out at the format's width, so it draws exactly as composed and is scaled to the tile.
const FORMAT = {
  'board-wide': { width: 1200, height: 630 },
  'board-companion': { width: 600, height: 630 },
  'board-card': { width: 800, height: 450 },
} as const;
const SPAN = { wide: 'lg:col-span-8', third: 'lg:col-span-4', half: 'lg:col-span-6' } as const;
const VIEW = /^\/prototypes\/([a-z0-9]+)\/artifacts\/([a-z0-9]+)$/;

// Each snapshot's view, as the origin its preview resolves from: a visual is its own host, so no prototype embeds another.
function useOrigins(manifest: Manifest, entries: Snapshot[]) {
  const [origins, setOrigins] = useState<Record<string, ArtifactContext>>({});
  useEffect(() => {
    let live = true;
    const prototypes = allPrototypes(manifest);
    for (const entry of entries) {
      const [, prototypeId, viewId] = VIEW.exec(entry.view) ?? [];
      const proto = prototypes.find(p => p.studioId === prototypeId);
      if (!proto) continue;
      void withItems(proto).then(loaded => {
        const item = loaded.artifacts.find(a => a.studioId === viewId);
        if (live && item) setOrigins(current => ({ ...current, [entry.id]: { proto: loaded, item } }));
      });
    }
    return () => {
      live = false;
    };
  }, [manifest, entries]);
  return origins;
}

function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, size] as const;
}

function Live({ entry, origin, width, height, interactive }: { entry: Snapshot; origin?: ArtifactContext; width: number; height: number; interactive?: boolean }) {
  if (!origin || !width) return <div className='h-full w-full bg-muted/40' />;
  return (
    <ArtifactHost
      request={{ reference: entry.view, origin, surface: 'visuals/board' }}
      width={width}
      height={height}
      viewport={FORMAT[entry.format].width}
      chrome='bare'
      interaction={interactive ? 'interactive' : 'inert'}
      label={entry.title}
      className='h-full w-full'
    />
  );
}

function Tile({ entry, origin, onOpen, tileRef }: { entry: Snapshot; origin?: ArtifactContext; onOpen: () => void; tileRef: (el: HTMLButtonElement | null) => void }) {
  const [box, { width }] = useSize<HTMLDivElement>();
  const { width: w, height: h } = FORMAT[entry.format];
  return (
    <button
      ref={tileRef}
      type='button'
      onClick={onOpen}
      aria-label={`${entry.title}. ${entry.line}`}
      className={cn(
        'group relative block w-full cursor-zoom-in overflow-hidden rounded-2xl bg-card text-left outline-none ring-1 ring-border transition-shadow duration-300 hover:ring-foreground/25 focus-visible:ring-2 focus-visible:ring-ring',
        SPAN[entry.tile],
      )}
    >
      <div ref={box} style={{ aspectRatio: `${w} / ${h}` }}>
        <Live entry={entry} origin={origin} width={width} height={(width * h) / w} />
      </div>
      <span className='pointer-events-none absolute inset-x-3 bottom-3 flex translate-y-1 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100'>
        <span className='max-w-full truncate rounded-full bg-background/85 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm ring-1 ring-border backdrop-blur-[8px]'>
          {entry.title}
        </span>
      </span>
    </button>
  );
}

function SnapshotLink({ href, primary, children }: { href: string; primary: boolean; children: ReactNode }) {
  const style = cn(
    'inline-flex h-10 items-center justify-between gap-3 rounded-full px-4 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
    primary ? 'bg-foreground text-background hover:bg-foreground/90' : 'text-foreground ring-1 ring-border hover:bg-muted',
  );
  return href.startsWith('https://') ? (
    <a href={href} target='_blank' rel='noreferrer' className={style}>
      {children}
      <span aria-hidden>↗</span>
    </a>
  ) : (
    <Link to={href as never} className={style}>
      {children}
      <span aria-hidden>→</span>
    </Link>
  );
}

function Peek({ entries, index, origins, onIndex, onClose }: { entries: Snapshot[]; index: number; origins: Record<string, ArtifactContext>; onIndex: (i: number) => void; onClose: () => void }) {
  const entry = entries[index]!;
  const { width: w, height: h } = FORMAT[entry.format];
  const [stage, size] = useSize<HTMLDivElement>();
  const dialog = useRef<HTMLDivElement>(null);
  const step = useCallback((by: number) => onIndex((index + by + entries.length) % entries.length), [index, onIndex, entries.length]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      else if (event.key === 'ArrowRight') step(1);
      else if (event.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose, step]);
  useEffect(() => dialog.current?.focus(), []);
  // The visual as large as the stage allows at its own shape.
  const scale = size.width && size.height ? Math.min(size.width / w, size.height / h) : 0;
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6'>
      <button type='button' aria-label='Close' tabIndex={-1} onClick={onClose} className='absolute inset-0 cursor-zoom-out bg-background/80 backdrop-blur-[12px]' />
      <div
        ref={dialog}
        role='dialog'
        aria-modal='true'
        aria-label={entry.title}
        tabIndex={-1}
        className='relative grid h-full max-h-[880px] w-full max-w-[1440px] grid-cols-1 grid-rows-[minmax(0,1fr)_auto] gap-5 overflow-hidden rounded-[24px] bg-card p-3 shadow-[0_25px_50px_-12px_rgb(0_0_0/0.25)] outline-none ring-1 ring-border sm:p-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:grid-rows-1 lg:gap-8'
      >
        <div ref={stage} className='flex min-h-0 items-center justify-center'>
          {scale > 0 && (
            <div key={entry.id} className='overflow-hidden rounded-2xl ring-1 ring-border' style={{ width: w * scale, height: h * scale }}>
              <Live entry={entry} origin={origins[entry.id]} width={w * scale} height={h * scale} interactive />
            </div>
          )}
        </div>
        <aside className='flex flex-col overflow-y-auto px-2 pb-2 lg:px-0 lg:py-3 lg:pr-3'>
          <div className='text-sm text-muted-foreground'>{entry.line}</div>
          <h2 className='mt-1 text-2xl leading-tight font-semibold tracking-tight text-balance text-foreground'>{entry.title}</h2>
          <p className='mt-3 text-[15px] leading-relaxed text-pretty text-muted-foreground'>{entry.summary}</p>
          <div className='mt-6 flex flex-col gap-2'>
            {entry.links.map((link, i) => (
              <SnapshotLink key={link.href} href={link.href} primary={i === 0}>
                {link.label}
              </SnapshotLink>
            ))}
          </div>
          <div className='mt-auto flex items-center justify-between gap-2 pt-8 text-sm text-muted-foreground'>
            <div className='flex gap-1'>
              <button type='button' onClick={() => step(-1)} aria-label='Previous snapshot' className='flex size-9 items-center justify-center rounded-full ring-1 ring-border hover:bg-muted hover:text-foreground'>
                ←
              </button>
              <button type='button' onClick={() => step(1)} aria-label='Next snapshot' className='flex size-9 items-center justify-center rounded-full ring-1 ring-border hover:bg-muted hover:text-foreground'>
                →
              </button>
            </div>
            <span className='tabular-nums'>
              {index + 1} / {entries.length}
            </span>
            <button type='button' onClick={onClose} className='rounded-full px-3 py-2 hover:bg-muted hover:text-foreground'>
              Close
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Board({ manifest }: { manifest: Manifest }) {
  const entries = contribution<SnapshotsContribution>(manifest, 'snapshots')?.entries ?? [];
  const origins = useOrigins(manifest, entries);
  const [open, setOpen] = useState<number | null>(null);
  const tiles = useRef<(HTMLButtonElement | null)[]>([]);
  const close = useCallback(() => {
    setOpen(current => {
      if (current !== null) requestAnimationFrame(() => tiles.current[current]?.focus());
      return null;
    });
  }, []);
  if (!entries.length) return null;
  return (
    <section aria-label='Snapshots' className='mx-auto w-full max-w-[1600px] px-4 pb-16 sm:px-6'>
      <div className='grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-12'>
        {entries.map((entry, i) => (
          <Tile
            key={entry.id}
            entry={entry}
            origin={origins[entry.id]}
            onOpen={() => setOpen(i)}
            tileRef={el => {
              tiles.current[i] = el;
            }}
          />
        ))}
      </div>
      {open !== null && <Peek entries={entries} index={open} origins={origins} onIndex={setOpen} onClose={close} />}
    </section>
  );
}

export default {
  icon: PlayCircleIcon,
  rail: 'none',
  order: 35,
  homeBoard: Board,
} satisfies ModuleApp;
