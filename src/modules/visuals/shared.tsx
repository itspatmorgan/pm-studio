// What the Visuals pages share: the manifest's index, each visual's live origin, and the live preview itself.
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { ArtifactHost } from '#studio/ui';
import { allPrototypes, contribution, withItems, type ArtifactContext, type Manifest } from '#studio/data';
import { FORMATS } from './lib/formats.ts';
import type { VisualEntry, VisualProject, VisualVersion, VisualsContribution } from './visuals.ts';

export const data = (manifest: Manifest) => contribution<VisualsContribution>(manifest, 'visuals');
// The version that stands for a visual: its selected one, or while none is, its newest.
export const leadOf = (visual: VisualEntry): VisualVersion => visual.selected ?? visual.versions.at(-1)!;
export const sizeOf = (visual: VisualEntry, version: VisualVersion = leadOf(visual)) => FORMATS[version.format];
// A project's page (/visuals/<project>), and one version's address in it (/visuals/<project>/<piece>/v01). A piece's
// address is its lead version's.
export const projectHref = (project: string) => `/visuals/${project}`;
export const versionHref = (visual: VisualEntry, version: VisualVersion = leadOf(visual)) =>
  `/visuals/${visual.project}/${version.path.replace(/\.tsx$/, '')}`;
export const visualHref = (visual: VisualEntry) => versionHref(visual);
// A version's name: v01 for card/v01.tsx.
export const versionName = (version: VisualVersion) => version.path.split('/').at(-1)!.replace(/\.tsx$/, '');
// A project's pieces, in its order.
export const piecesOf = (index: VisualsContribution, project: VisualProject) =>
  project.pieces.flatMap(id => index.visuals.filter(v => v.id === id));

// Each visual's selected version, as the origin its preview resolves from.
export function useOrigins(manifest: Manifest, visuals: VisualEntry[]) {
  const [origins, setOrigins] = useState<Record<string, ArtifactContext>>({});
  useEffect(() => {
    let live = true;
    const items = allPrototypes(manifest).filter(p => p.contributorKey === 'visuals');
    for (const visual of visuals) {
      const proto = items.find(p => p.id === visual.project);
      if (!proto || !visual.versions.length) continue;
      void withItems(proto).then(loaded => {
        const item = loaded.artifacts.find(a => a.studioId === leadOf(visual).studioId);
        if (live && item) setOrigins(current => ({ ...current, [visual.id]: { proto: loaded, item } }));
      });
    }
    return () => {
      live = false;
    };
  }, [manifest, visuals]);
  return origins;
}

export function useSize<T extends HTMLElement>() {
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

// Whether an element is near the screen, so a long page mounts only the live previews someone can see. With `release`,
// it lets go again once the element is well off screen, so a long index keeps only a screenful or two alive at once.
export function useNear<T extends HTMLElement>(ref: React.RefObject<T | null>, { release = false } = {}) {
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || (near && !release)) return;
    const observer = new IntersectionObserver(([entry]) => entry && setNear(near => (release ? entry.isIntersecting : near || entry.isIntersecting)), {
      rootMargin: release ? '200px' : '400px',
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, near, release]);
  return near;
}

// A visual drawn live: one version (its lead by default) laid out at its format's width and scaled to the box.
export function Live({
  visual,
  version = leadOf(visual),
  origin,
  width,
  height,
  interactive,
  still = false,
}: {
  visual: VisualEntry;
  version?: VisualVersion;
  origin?: ArtifactContext;
  width: number;
  height: number;
  interactive?: boolean;
  // Holds the view's motion a moment after it draws, so it costs nothing while nobody is looking at it (the view
  // module's still embeds). Turning it off plays it again from where it stopped.
  still?: boolean;
}) {
  if (!origin || !width) return <div className='h-full w-full bg-muted/50' />;
  return (
    <ArtifactHost
      request={{ reference: version.path.split('/').at(-1)!, origin, surface: 'visuals/board' }}
      width={width}
      height={height}
      viewport={sizeOf(visual, version).width}
      chrome='bare'
      interaction={interactive ? 'interactive' : 'inert'}
      still={still}
      label={`${visual.title}, ${versionName(version)}`}
      className='h-full w-full'
    />
  );
}

// A link to a Studio address (written loosely, since module routes aren't in the router's types) or a website URL.
export function Go({ href, className, children }: { href: string; className: string; children: ReactNode }) {
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

// The same list while its ids are the same, so effects keyed on it don't rerun on every render.
export function useStable(visuals: VisualEntry[]) {
  const key = visuals.map(v => `${v.id}:${leadOf(v).studioId}`).join(',');
  const ref = useRef({ key, visuals });
  if (ref.current.key !== key) ref.current = { key, visuals };
  return ref.current.visuals;
}

// Justified rows, as on a photo site: items keep their aspect ratios, and each row is scaled so its items fill the width
// exactly at one shared height, close to `target`. The last row keeps the target height rather than stretching.
export function justify<T>(items: T[], aspectOf: (item: T) => number, width: number, gap: number, target: number) {
  const rows: { items: T[]; height: number }[] = [];
  let row: T[] = [];
  let sum = 0;
  for (const item of items) {
    row.push(item);
    sum += aspectOf(item);
    const height = (width - gap * (row.length - 1)) / sum;
    if (height <= target) {
      rows.push({ items: row, height });
      row = [];
      sum = 0;
    }
  }
  if (row.length) rows.push({ items: row, height: Math.min(target, (width - gap * (row.length - 1)) / sum) });
  return rows;
}

// A picture library's tile: a piece drawn at its own shape, with a name and a line under it and nothing around it. It is
// drawn only while near the screen and held still unless pointed at or focused, so a page of many costs about as much
// as a page of pictures.
export type TileItem = { key: string; visual: VisualEntry; href: string; title: string; line?: string };

function Tile({ item, origin, width, height }: { item: TileItem; origin?: ArtifactContext; width: number; height: number }) {
  const [box] = useSize<HTMLDivElement>();
  const near = useNear(box, { release: true });
  const [playing, setPlaying] = useState(false);
  return (
    <Link
      to={item.href as never}
      onPointerEnter={() => setPlaying(true)}
      onPointerLeave={() => setPlaying(false)}
      onFocus={() => setPlaying(true)}
      onBlur={() => setPlaying(false)}
      className='group block shrink-0 outline-none'
      style={{ width }}
    >
      <div
        ref={box}
        className='overflow-hidden rounded-[10px] bg-muted/50 ring-1 ring-foreground/[0.07] transition-[box-shadow] duration-200 group-hover:ring-foreground/20 group-focus-visible:ring-2 group-focus-visible:ring-ring'
        style={{ height }}
      >
        {near && <Live visual={item.visual} origin={origin} width={width} height={height} still={!playing} />}
      </div>
      <div className='mt-2 min-w-0 px-0.5'>
        <div className='truncate text-[13px] leading-5 font-medium text-foreground'>{item.title}</div>
        {item.line && <div className='truncate text-xs leading-5 text-muted-foreground'>{item.line}</div>}
      </div>
    </Link>
  );
}

// Tiles in justified rows that fill `width`, each at its lead version's shape.
export function Tiles({
  items,
  origins,
  width,
  gap = 16,
  row = 230,
}: {
  items: TileItem[];
  origins: Record<string, ArtifactContext>;
  width: number;
  gap?: number;
  row?: number;
}) {
  if (!width) return null;
  const aspect = (item: TileItem) => sizeOf(item.visual).width / sizeOf(item.visual).height;
  return (
    <div className='flex flex-col gap-6'>
      {justify(items, aspect, width, gap, row).map(r => (
        <div key={r.items[0]!.key} className='flex' style={{ gap }}>
          {r.items.map(item => (
            <Tile
              key={item.key}
              item={item}
              origin={origins[item.visual.id]}
              width={r.height * aspect(item)}
              height={r.height}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// A version's status as a glyph that reads without color: open ○, shortlisted ◐, picked ● with a check, rejected ⊘.
// The same marks in the versions panel and the navigation.
export function StatusGlyph({ status, size = 12, className }: { status: VisualVersion['status']; size?: number; className?: string }) {
  const r = 5.25;
  return (
    <svg width={size} height={size} viewBox='0 0 12 12' aria-hidden className={className}>
      {status === 'selected' ? (
        <>
          <circle cx='6' cy='6' r='6' className='fill-info-foreground' />
          <path d='M3.6 6.2 5.2 7.8 8.4 4.4' fill='none' strokeWidth='1.4' strokeLinecap='round' strokeLinejoin='round' className='stroke-background' />
        </>
      ) : (
        <>
          <circle
            cx='6'
            cy='6'
            r={r}
            fill='none'
            strokeWidth='1.5'
            className={status === 'shortlisted' ? 'stroke-foreground/80' : 'stroke-muted-foreground/60'}
          />
          {status === 'shortlisted' && <path d={`M6 ${6 - r} A${r} ${r} 0 0 1 6 ${6 + r} Z`} className='fill-foreground/80' />}
          {status === 'rejected' && <path d='M2.6 9.4 9.4 2.6' strokeWidth='1.5' className='stroke-muted-foreground/60' />}
        </>
      )}
    </svg>
  );
}
