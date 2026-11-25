// Visuals in the app: the /visuals index (every visual, live, by collection), and Snapshots, the board of the visuals
// the studio leads with, across the front page below the search. Each tile hosts the visual's selected version live on
// the visuals/board surface, with the version as its own origin, so no item embeds another. Visuals open like
// prototypes at /visuals/<id>, through the platform's section routes.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createRoute, Link, useNavigate, useSearch } from '@tanstack/react-router';
import { Image02Icon } from '@hugeicons/core-free-icons';
import { ArtifactHost, type ModuleApp } from '#studio/ui';
import { APP_NAME, allPrototypes, contribution, useManifest, withItems, type ArtifactContext, type Manifest } from '#studio/data';
import { cn } from '#studio/runtime';
import { FORMATS } from './lib/formats.ts';
import type { Snapshot } from './snapshots.ts';
import type { VisualEntry, VisualsContribution } from './visuals.ts';

const data = (manifest: Manifest) => contribution<VisualsContribution>(manifest, 'visuals');
const sizeOf = (visual: VisualEntry) => FORMATS[visual.selected!.format];
// The selected version's address in the app: /visuals/<id>/iterations/v01.
const versionHref = (visual: VisualEntry) => `/visuals/${visual.id}/${visual.selected!.path.replace(/\.tsx$/, '')}`;

// Each visual's selected version, as the origin its preview resolves from.
function useOrigins(manifest: Manifest, visuals: VisualEntry[]) {
  const [origins, setOrigins] = useState<Record<string, ArtifactContext>>({});
  useEffect(() => {
    let live = true;
    const items = allPrototypes(manifest).filter(p => p.contributorKey === 'visuals');
    for (const visual of visuals) {
      const proto = items.find(p => p.id === visual.id);
      if (!proto || !visual.selected) continue;
      void withItems(proto).then(loaded => {
        const item = loaded.artifacts.find(a => a.studioId === visual.selected!.studioId);
        if (live && item) setOrigins(current => ({ ...current, [visual.id]: { proto: loaded, item } }));
      });
    }
    return () => {
      live = false;
    };
  }, [manifest, visuals]);
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

// Whether an element is near the screen, so a long page mounts only the live previews someone can see.
function useNear<T extends HTMLElement>(ref: React.RefObject<T | null>) {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || near) return;
    const observer = new IntersectionObserver(([entry]) => entry?.isIntersecting && setNear(true), { rootMargin: '400px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, near]);
  return near;
}

// A visual drawn live: its selected version laid out at the format's width and scaled to the box.
function Live({ visual, origin, width, height, interactive }: { visual: VisualEntry; origin?: ArtifactContext; width: number; height: number; interactive?: boolean }) {
  if (!origin || !width) return <div className='h-full w-full bg-muted/50' />;
  return (
    <ArtifactHost
      request={{ reference: visual.selected!.path.split('/').at(-1)!, origin, surface: 'visuals/board' }}
      width={width}
      height={height}
      viewport={sizeOf(visual).width}
      chrome='bare'
      interaction={interactive ? 'interactive' : 'inert'}
      label={visual.title}
      className='h-full w-full'
    />
  );
}

// A link to a Studio address (written loosely, since module routes aren't in the router's types) or a website URL.
function Go({ href, className, children }: { href: string; className: string; children: ReactNode }) {
  if (href.startsWith('https://'))
    return (
      <a href={href} target='_blank' rel='noreferrer' className={className}>
        {children}
        <span aria-hidden>↗</span>
      </a>
    );
  const [to, query] = href.split('?');
  return (
    <Link to={to as never} search={(query ? Object.fromEntries(new URLSearchParams(query)) : undefined) as never} className={className}>
      {children}
      <span aria-hidden>→</span>
    </Link>
  );
}

// ——— Snapshots: the front page board ———

const SPAN = { wide: 'lg:col-span-8', third: 'lg:col-span-4', half: 'lg:col-span-6' } as const;
type Piece = { snapshot: Snapshot; visual: VisualEntry };

function Tile({ piece, origin, onOpen, tileRef }: { piece: Piece; origin?: ArtifactContext; onOpen: () => void; tileRef: (el: HTMLButtonElement | null) => void }) {
  const [box, { width }] = useSize<HTMLDivElement>();
  const { width: w, height: h } = sizeOf(piece.visual);
  const { snapshot } = piece;
  return (
    <button
      ref={tileRef}
      type='button'
      onClick={onOpen}
      aria-label={`${snapshot.title}. ${snapshot.line}`}
      className={cn(
        'group relative block w-full cursor-zoom-in overflow-hidden rounded-2xl bg-card text-left outline-none ring-1 ring-border transition-shadow duration-300 hover:ring-foreground/25 focus-visible:ring-2 focus-visible:ring-ring',
        SPAN[snapshot.tile],
      )}
    >
      <div ref={box} style={{ aspectRatio: `${w} / ${h}` }}>
        <Live visual={piece.visual} origin={origin} width={width} height={(width * h) / w} />
      </div>
      <span className='pointer-events-none absolute inset-x-3 bottom-3 flex translate-y-1 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100'>
        <span className='max-w-full truncate rounded-full bg-background/85 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm ring-1 ring-border backdrop-blur-[8px]'>
          {snapshot.title}
        </span>
      </span>
    </button>
  );
}

function Peek({ pieces, index, origins, onIndex, onClose }: { pieces: Piece[]; index: number; origins: Record<string, ArtifactContext>; onIndex: (i: number) => void; onClose: () => void }) {
  const { snapshot, visual } = pieces[index]!;
  const { width: w, height: h } = sizeOf(visual);
  const [stage, size] = useSize<HTMLDivElement>();
  const dialog = useRef<HTMLDivElement>(null);
  const step = useCallback((by: number) => onIndex((index + by + pieces.length) % pieces.length), [index, onIndex, pieces.length]);
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
  const scale = size.width && size.height ? Math.min(size.width / w, size.height / h) : 0;
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6'>
      <button type='button' aria-label='Close' tabIndex={-1} onClick={onClose} className='absolute inset-0 cursor-zoom-out bg-background/80 backdrop-blur-[12px]' />
      <div
        ref={dialog}
        role='dialog'
        aria-modal='true'
        aria-label={snapshot.title}
        tabIndex={-1}
        className='relative grid h-full max-h-[880px] w-full max-w-[1440px] grid-cols-1 grid-rows-[minmax(0,1fr)_auto] gap-5 overflow-hidden rounded-[24px] bg-card p-3 shadow-[0_25px_50px_-12px_rgb(0_0_0/0.25)] outline-none ring-1 ring-border sm:p-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:grid-rows-1 lg:gap-8'
      >
        <div ref={stage} className='flex min-h-0 items-center justify-center'>
          {scale > 0 && (
            <div key={visual.id} className='overflow-hidden rounded-2xl ring-1 ring-border' style={{ width: w * scale, height: h * scale }}>
              <Live visual={visual} origin={origins[visual.id]} width={w * scale} height={h * scale} interactive />
            </div>
          )}
        </div>
        <aside className='flex flex-col overflow-y-auto px-2 pb-2 lg:px-0 lg:py-3 lg:pr-3'>
          <div className='text-sm text-muted-foreground'>{snapshot.line}</div>
          <h2 className='mt-1 text-2xl leading-tight font-semibold tracking-tight text-balance text-foreground'>{snapshot.title}</h2>
          <p className='mt-3 text-[15px] leading-relaxed text-pretty text-muted-foreground'>{snapshot.summary}</p>
          <div className='mt-6 flex flex-col gap-2'>
            {snapshot.links.map((link, i) => (
              <Go
                key={link.href}
                href={link.href}
                className={cn(
                  'inline-flex h-10 items-center justify-between gap-3 rounded-full px-4 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  i === 0 ? 'bg-foreground text-background hover:bg-foreground/90' : 'text-foreground ring-1 ring-border hover:bg-muted',
                )}
              >
                {link.label}
              </Go>
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
              {index + 1} / {pieces.length}
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
  const index = data(manifest);
  const [pieces, visuals] = (() => {
    const list: Piece[] = [];
    for (const snapshot of index?.snapshots ?? []) {
      const visual = index!.visuals.find(v => v.id === snapshot.visual);
      if (visual?.selected) list.push({ snapshot, visual });
    }
    return [list, list.map(p => p.visual)];
  })();
  const stable = useStable(visuals);
  const origins = useOrigins(manifest, stable);
  const [open, setOpen] = useState<number | null>(null);
  const tiles = useRef<(HTMLButtonElement | null)[]>([]);
  const close = useCallback(() => {
    setOpen(current => {
      if (current !== null) requestAnimationFrame(() => tiles.current[current]?.focus());
      return null;
    });
  }, []);
  if (!pieces.length) return null;
  return (
    <section aria-label='Snapshots' className='mx-auto w-full max-w-[1600px] px-4 pb-16 sm:px-6'>
      <div className='grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-12'>
        {pieces.map((piece, i) => (
          <Tile
            key={piece.visual.id}
            piece={piece}
            origin={origins[piece.visual.id]}
            onOpen={() => setOpen(i)}
            tileRef={el => {
              tiles.current[i] = el;
            }}
          />
        ))}
      </div>
      {open !== null && <Peek pieces={pieces} index={open} origins={origins} onIndex={setOpen} onClose={close} />}
    </section>
  );
}

// The same list while its ids are the same, so effects keyed on it don't rerun on every render.
function useStable(visuals: VisualEntry[]) {
  const key = visuals.map(v => `${v.id}:${v.selected?.studioId}`).join(',');
  const ref = useRef({ key, visuals });
  if (ref.current.key !== key) ref.current = { key, visuals };
  return ref.current.visuals;
}

// ——— The index: every visual, by collection ———

function IndexTile({ visual, origin, families }: { visual: VisualEntry; origin?: ArtifactContext; families: VisualsContribution['families'] }) {
  const [box, { width }] = useSize<HTMLDivElement>();
  const near = useNear(box);
  const { width: w, height: h } = sizeOf(visual);
  return (
    <Link to={versionHref(visual) as never} className='group block break-inside-avoid outline-none'>
      <div
        ref={box}
        className='overflow-hidden rounded-xl bg-card ring-1 ring-border transition-shadow duration-300 group-hover:ring-foreground/25 group-focus-visible:ring-2 group-focus-visible:ring-ring'
        style={{ aspectRatio: `${w} / ${h}` }}
      >
        {near && <Live visual={visual} origin={origin} width={width} height={(width * h) / w} />}
      </div>
      <div className='mt-2.5 mb-8 flex items-baseline justify-between gap-3 px-0.5'>
        <span className='text-sm font-medium text-pretty text-foreground'>{visual.title}</span>
        <span className='shrink-0 text-xs text-muted-foreground'>{families.find(f => f.id === visual.family)?.label}</span>
      </div>
    </Link>
  );
}

function VisualsIndex() {
  const manifest = useManifest();
  const index = data(manifest);
  const search = useSearch({ strict: false }) as { collection?: string };
  const navigate = useNavigate();
  const shown = useStable((index?.visuals ?? []).filter(v => v.selected));
  const origins = useOrigins(manifest, shown);
  if (!index) return null;
  const groups = index.collections
    .map(c => {
      const rank = (v: VisualEntry) => (c.order?.includes(v.id) ? c.order.indexOf(v.id) : Infinity);
      return { collection: c, visuals: shown.filter(v => v.collections.includes(c.id)).sort((a, b) => rank(a) - rank(b)) };
    })
    .filter(g => g.visuals.length && (!search.collection || g.collection.id === search.collection));
  const loose = search.collection ? [] : shown.filter(v => !v.collections.length);
  const chip = (active: boolean) =>
    cn(
      'h-8 rounded-full px-3.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
      active ? 'bg-foreground text-background' : 'text-muted-foreground ring-1 ring-border hover:bg-muted hover:text-foreground',
    );
  const pick = (collection?: string) => void navigate({ to: '/visuals' as never, search: (collection ? { collection } : {}) as never });
  return (
    <main className='mx-auto w-full max-w-[1400px] px-4 pt-10 pb-20 sm:px-8'>
      <header className='mb-8'>
        <h1 className='text-2xl font-semibold tracking-tight text-foreground'>Visuals</h1>
        <p className='mt-1 text-sm text-muted-foreground'>
          {shown.length} visuals, each drawn live at its format. Open one to see its versions.
        </p>
      </header>
      <nav aria-label='Collections' className='mb-10 flex flex-wrap gap-2'>
        <button type='button' className={chip(!search.collection)} onClick={() => pick()}>
          All
        </button>
        {index.collections
          .filter(c => shown.some(v => v.collections.includes(c.id)))
          .map(c => (
            <button key={c.id} type='button' className={chip(search.collection === c.id)} onClick={() => pick(c.id)}>
              {c.label}
            </button>
          ))}
      </nav>
      {groups.map(({ collection, visuals }) => (
        <section key={collection.id} className='mb-14'>
          <div className='mb-4 flex items-baseline gap-3'>
            <h2 className='text-base font-semibold tracking-tight text-foreground'>{collection.label}</h2>
            <span className='text-sm text-muted-foreground'>{collection.line}</span>
          </div>
          <div className='columns-1 gap-6 sm:columns-2 xl:columns-3'>
            {visuals.map(v => (
              <IndexTile key={v.id} visual={v} origin={origins[v.id]} families={index.families} />
            ))}
          </div>
        </section>
      ))}
      {loose.length > 0 && (
        <section className='mb-14'>
          <h2 className='mb-4 text-base font-semibold tracking-tight text-foreground'>Other visuals</h2>
          <div className='columns-1 gap-6 sm:columns-2 xl:columns-3'>
            {loose.map(v => (
              <IndexTile key={v.id} visual={v} origin={origins[v.id]} families={index.families} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

export default {
  icon: Image02Icon,
  rail: 'top',
  order: 5,
  routes: root => [
    createRoute({
      getParentRoute: () => root,
      path: 'visuals',
      validateSearch: (search: Record<string, unknown>) =>
        typeof search.collection === 'string' ? { collection: search.collection } : {},
      head: () => ({ meta: [{ title: `Visuals — ${APP_NAME}` }] }),
      component: VisualsIndex,
    }),
  ],
  homeBoard: Board,
} satisfies ModuleApp;
