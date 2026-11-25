// What the Visuals pages share: the manifest's index, each visual's live origin, and the live preview itself.
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from '@tanstack/react-router';
import { ArtifactHost } from '#studio/ui';
import { allPrototypes, contribution, withItems, type ArtifactContext, type Manifest } from '#studio/data';
import { FORMATS } from './lib/formats.ts';
import type { VisualEntry, VisualsContribution } from './visuals.ts';

export const data = (manifest: Manifest) => contribution<VisualsContribution>(manifest, 'visuals');
export const sizeOf = (visual: VisualEntry) => FORMATS[visual.selected!.format];
// The selected version's address in the app: /visuals/<id>/iterations/v01.
export const versionHref = (visual: VisualEntry) => `/visuals/${visual.id}/${visual.selected!.path.replace(/\.tsx$/, '')}`;

// Each visual's selected version, as the origin its preview resolves from.
export function useOrigins(manifest: Manifest, visuals: VisualEntry[]) {
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

// Whether an element is near the screen, so a long page mounts only the live previews someone can see.
export function useNear<T extends HTMLElement>(ref: React.RefObject<T | null>) {
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
export function Live({ visual, origin, width, height, interactive }: { visual: VisualEntry; origin?: ArtifactContext; width: number; height: number; interactive?: boolean }) {
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
  const key = visuals.map(v => `${v.id}:${v.selected?.studioId}`).join(',');
  const ref = useRef({ key, visuals });
  if (ref.current.key !== key) ref.current = { key, visuals };
  return ref.current.visuals;
}
