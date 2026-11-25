// What the Visuals pages share: the manifest's index, each visual's live origin, and the live preview itself.
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { ArtifactHost } from '#studio/ui';
import { allPrototypes, contribution, withItems, type ArtifactContext, type Manifest } from '#studio/data';
import { FORMATS } from './lib/formats.ts';
import type { VisualEntry, VisualVersion, VisualsContribution } from './visuals.ts';

export const data = (manifest: Manifest) => contribution<VisualsContribution>(manifest, 'visuals');
// The version that stands for a visual: its selected one, or while none is, its newest.
export const leadOf = (visual: VisualEntry): VisualVersion => visual.selected ?? visual.versions.at(-1)!;
export const sizeOf = (visual: VisualEntry, version: VisualVersion = leadOf(visual)) => FORMATS[version.format];
// A visual's page (/visuals/<id>, its versions), and one version's address in it (/visuals/<id>/iterations/v01).
export const visualHref = (visual: Pick<VisualEntry, 'id'>) => `/visuals/${visual.id}`;
export const versionHref = (visual: VisualEntry, version: VisualVersion = leadOf(visual)) =>
  `/visuals/${visual.id}/${version.path.replace(/\.tsx$/, '')}`;
// A version's name: v01 for iterations/v01.tsx.
export const versionName = (version: VisualVersion) => version.path.split('/').at(-1)!.replace(/\.tsx$/, '');

// Each visual's selected version, as the origin its preview resolves from.
export function useOrigins(manifest: Manifest, visuals: VisualEntry[]) {
  const [origins, setOrigins] = useState<Record<string, ArtifactContext>>({});
  useEffect(() => {
    let live = true;
    const items = allPrototypes(manifest).filter(p => p.contributorKey === 'visuals');
    for (const visual of visuals) {
      const proto = items.find(p => p.id === visual.id);
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
}: {
  visual: VisualEntry;
  version?: VisualVersion;
  origin?: ArtifactContext;
  width: number;
  height: number;
  interactive?: boolean;
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
