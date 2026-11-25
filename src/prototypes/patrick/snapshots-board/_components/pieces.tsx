import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from '@module/prototypes';
import { LiveEditorialVisual } from '@/systems/website/components/generative-art';
import { Logo } from '@/systems/website/components/logo';
import { PixelWaveText, enablePixelHover, pixelWave, resetPixelWave, resolvePixelWave } from '@/systems/website/components/pixel-wave-text';
import { SublimeCard } from '@/systems/website/components/sublime';
import { StudioCard } from '@/systems/website/components/design-studio';
import { ExpansionCard } from '@/systems/website/components/expansion';
import { QueryCard } from '@/systems/website/components/query-builder';
import { useReduced } from '@/systems/website/components/theme-hooks';
import { cn } from '#studio/runtime';

// The live pieces of the Snapshots board. Each one is the real thing from @itspatmorgan/kit, drawn at full size and
// moving on its own, so the board shows the work rather than pictures of it.

const SYSTEM = '/systems/v4576ka1mbpbqdp1/components';
const PATTERN_ENGINE = '/prototypes/vjwrvf5t8z1cbwy3/artifacts/tc3b4fm8y98jv6nx';

// One tile: the piece edge to edge, and its name in a quiet label that comes up on hover (and stays on touch screens).
export function Tile({ to, title, line, className, children, dark }: { to: string; title: string; line: string; className?: string; children: ReactNode; dark?: boolean }) {
  return (
    <Link
      to={to}
      data-logo-cycle-trigger
      className={cn(
        'group relative block overflow-hidden rounded-2xl bg-card outline-none ring-1 ring-border/70 transition-[box-shadow,transform] duration-300 ease-out hover:ring-foreground/25 focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      {children}
      <div
        className={cn(
          'pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:opacity-100',
          dark ? 'bg-gradient-to-t from-black/60 to-transparent text-[#f5f1ea]' : 'bg-gradient-to-t from-background/90 via-background/60 to-transparent text-foreground',
        )}
      >
        <div>
          <div className="text-sm font-semibold">{title}</div>
          <div className={cn('mt-0.5 text-xs', dark ? 'text-[#f5f1ea]/75' : 'text-muted-foreground')}>{line}</div>
        </div>
      </div>
    </Link>
  );
}

type Visual = Parameters<typeof LiveEditorialVisual>[0]['visual'];
const ARTICLES: { title: string; visual: Visual }[] = [
  { title: 'Curate Your Context', visual: { background: 'warm-dark-gray', generator: { type: 'strange-attractor', seed: 118, opacity: 85, color: 'copper' }, lightMode: { color: 'bronze', opacity: 100 }, texture: 20, grain: 24 } },
  { title: 'When Creation Becomes Compulsion', visual: { background: 'warm-dark-gray', generator: { type: 'flow-field', seed: 203, density: 150, steps: 100, scale: 320, curl: 30, strokeWidth: 1, opacity: 75, color: 'copper' }, texture: 20, grain: 24 } },
  { title: 'Default It or Design It', visual: { background: 'warm-dark-gray', generator: { type: 'isoline', seed: 301, levels: 12, scale: 350, strokeWidth: 0.7, opacity: 75, color: 'copper' }, lightMode: { color: 'bronze', opacity: 100, strokeWidth: 1.05 }, texture: 0, grain: 24 } },
  { title: '3 Models for Framing Software Complexity', visual: { background: 'warm-dark-gray', generator: { type: 'voronoi', seed: 300, count: 60, jitter: 60, strokeWidth: 0.6, opacity: 75, color: 'copper' }, lightMode: { color: 'bronze', opacity: 100, strokeWidth: 0.9 }, texture: 0, grain: 24 } },
  { title: 'Be a Skill Surfer', visual: { background: 'warm-dark-gray', generator: { type: 'dot-grid', seed: 139, spacing: 22, scale: 300, dotSize: 70, opacity: 70, color: 'copper' }, texture: 0, grain: 24 } },
];

// The address that opens Pattern Engine on this article's art, the same link the article's visual carries on the site.
function engineHref({ background, generator, texture, grain }: Visual) {
  const params = new URLSearchParams();
  const add = (key: string, value: unknown) => value !== undefined && params.set(key, String(value));
  add('bg', background);
  add('generator', generator.type);
  for (const [key, value] of Object.entries(generator)) if (key !== 'type') add(key, value);
  add('texture', texture);
  add('grain', grain);
  return `${PATTERN_ENGINE}?${params}`;
}

// Pattern Engine: the real art of one article after another, each drawing itself in. Opens the engine on the one showing.
export function PatternEnginePiece({ className }: { className?: string }) {
  const reduced = useReduced();
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const timer = setInterval(() => setIndex(i => (i + 1) % ARTICLES.length), 7000);
    return () => clearInterval(timer);
  }, [reduced]);
  const article = ARTICLES[index]!;
  return (
    <Tile to={engineHref(article.visual)} title="Pattern Engine" line={`The generator behind every Unknown Arts article. Now: ${article.title}.`} className={className}>
      <LiveEditorialVisual key={index} visual={article.visual} />
      <div className="absolute top-4 right-4 flex gap-1.5" aria-hidden>
        {ARTICLES.map((a, i) => (
          <span key={a.title} className={cn('h-1 rounded-full transition-all duration-500', i === index ? 'w-5 bg-[#c98a5a]' : 'w-1 bg-[#c98a5a]/40')} />
        ))}
      </div>
    </Tile>
  );
}

// Pixel Wave: the split-flap reveal, replaying every few seconds; between plays the words pixelate under the pointer.
export function PixelWavePiece({ className, text = 'Designer who builds.' }: { className?: string; text?: string }) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReduced();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced) {
      resolvePixelWave(el);
      return () => {};
    }
    let cancel = () => {};
    let stopHover = () => {};
    let timer: ReturnType<typeof setTimeout>;
    const play = (delay: number) => {
      stopHover();
      resetPixelWave(el);
      cancel = pixelWave(el, delay);
      timer = setTimeout(() => {
        stopHover = enablePixelHover(el);
        timer = setTimeout(() => play(0), 6000);
      }, delay + 5000);
    };
    play(300);
    return () => { cancel(); stopHover(); clearTimeout(timer); };
  }, [reduced]);
  return (
    <Tile to={`${SYSTEM}/pixel-wave-text`} title="Pixel Wave" line="Type that settles from Geist Pixel into Geist Sans." className={cn('texture-bg', className)}>
      <div className="flex h-full min-h-64 items-center px-7 py-10 sm:px-9">
        <PixelWaveText ref={ref} as="p" text={text} className="text-4xl leading-[1.02] font-medium tracking-tight text-foreground sm:text-5xl xl:text-6xl" />
      </div>
    </Tile>
  );
}

// Pixel Mark: the four-pixel braille P, large, with its pixels cycling when the pointer is over the tile.
export function PixelMarkPiece({ className }: { className?: string }) {
  return (
    <Tile to={`${SYSTEM}/logo`} title="Pixel Mark" line="A four-pixel logo that spells P in braille." className={cn('bg-card', className)}>
      <div className="flex h-full items-center justify-center gap-6">
        <Logo trigger="container" className="size-28 sm:size-32" />
        <Logo trigger="container" className="size-14 opacity-80" />
        <Logo trigger="container" className="size-7 opacity-60" />
      </div>
    </Tile>
  );
}

// A case study's Work card visual: the live product moment the site's Work page shows for it.
const CASES = {
  sublime: { title: 'Giving a security agent the right amount of control', line: 'Sublime Security', Visual: SublimeCard },
  'design-studio': { title: 'Building a design environment for people and agents', line: 'Design Studio', Visual: () => <StudioCard size="card" /> },
  expansion: { title: 'Expanding a security platform for a new use case', line: 'Signal Sciences', Visual: ExpansionCard },
  'query-builder': { title: 'Making a complex query language approachable', line: 'JupiterOne', Visual: QueryCard },
} as const;

export function CasePiece({ id, className }: { id: keyof typeof CASES; className?: string }) {
  const { title, line, Visual } = CASES[id];
  return (
    <Tile to={`${SYSTEM}/${id}`} title={title} line={line} className={cn('texture-bg aspect-video', className)}>
      <div className="absolute inset-0">
        <Visual />
      </div>
    </Tile>
  );
}
