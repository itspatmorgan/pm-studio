import { useEffect, useRef, useState, type ComponentType } from 'react';
import { LiveEditorialVisual } from '@/systems/website/components/generative-art';
import { Logo } from '@/systems/website/components/logo';
import { PixelWaveText, enablePixelHover, pixelWave, resetPixelWave, resolvePixelWave } from '@/systems/website/components/pixel-wave-text';
import { SublimeCard } from '@/systems/website/components/sublime';
import { StudioCard } from '@/systems/website/components/design-studio';
import { ExpansionCard } from '@/systems/website/components/expansion';
import { QueryCard } from '@/systems/website/components/query-builder';
import { useReduced } from '@/systems/website/components/theme-hooks';
import { cn } from '#studio/runtime';

// The live visuals of the Snapshots board, each the real thing from @itspatmorgan/kit. A snapshot is one of these drawn at
// its format, with a summary and links to the larger work it belongs to (see Snapshot below). The same visual fills a
// tile on the board and the stage of its peek.

const SYSTEM = '/systems/v4576ka1mbpbqdp1/components';
const PATTERN_ENGINE = '/prototypes/vjwrvf5t8z1cbwy3/artifacts/tc3b4fm8y98jv6nx';
const SITE = 'https://itspatmorgan.com';

type Visual = Parameters<typeof LiveEditorialVisual>[0]['visual'];
const ARTICLES: { title: string; slug: string; visual: Visual }[] = [
  { title: 'Curate Your Context', slug: 'curate-your-context', visual: { background: 'warm-dark-gray', generator: { type: 'strange-attractor', seed: 118, opacity: 85, color: 'copper' }, lightMode: { color: 'bronze', opacity: 100 }, texture: 20, grain: 24 } },
  { title: 'When Creation Becomes Compulsion', slug: 'when-creation-becomes-compulsion', visual: { background: 'warm-dark-gray', generator: { type: 'flow-field', seed: 203, density: 150, steps: 100, scale: 320, curl: 30, strokeWidth: 1, opacity: 75, color: 'copper' }, texture: 20, grain: 24 } },
  { title: 'Default It or Design It', slug: 'default-it-or-design-it', visual: { background: 'warm-dark-gray', generator: { type: 'isoline', seed: 301, levels: 12, scale: 350, strokeWidth: 0.7, opacity: 75, color: 'copper' }, lightMode: { color: 'bronze', opacity: 100, strokeWidth: 1.05 }, texture: 0, grain: 24 } },
  { title: '3 Models for Framing Software Complexity', slug: '3-models-for-framing-software-complexity', visual: { background: 'warm-dark-gray', generator: { type: 'voronoi', seed: 300, count: 60, jitter: 60, strokeWidth: 0.6, opacity: 75, color: 'copper' }, lightMode: { color: 'bronze', opacity: 100, strokeWidth: 0.9 }, texture: 0, grain: 24 } },
  { title: 'Be a Skill Surfer', slug: 'be-a-skill-surfer', visual: { background: 'warm-dark-gray', generator: { type: 'dot-grid', seed: 139, spacing: 22, scale: 300, dotSize: 70, opacity: 70, color: 'copper' }, texture: 0, grain: 24 } },
];

// The address that opens Pattern Engine on an article's art, the same link the article's visual carries on the site.
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

// Pattern Engine: one article's real art after another, each drawing itself in. In the peek, the dots pick an article.
function PatternEngineVisual({ peek, onArticle }: VisualProps) {
  const reduced = useReduced();
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const timer = setInterval(() => setIndex(i => (i + 1) % ARTICLES.length), peek ? 9000 : 7000);
    return () => clearInterval(timer);
  }, [reduced, peek, index]);
  const article = ARTICLES[index]!;
  useEffect(() => onArticle?.(article), [article, onArticle]);
  return (
    <div className="absolute inset-0">
      <LiveEditorialVisual key={index} visual={article.visual} />
      <div className="absolute top-4 right-4 flex gap-1.5">
        {ARTICLES.map((a, i) =>
          peek ? (
            <button key={a.title} type="button" aria-label={a.title} onClick={() => setIndex(i)} className="flex h-4 items-center">
              <span className={cn('block h-1 rounded-full transition-all duration-500', i === index ? 'w-5 bg-[#c98a5a]' : 'w-1.5 bg-[#c98a5a]/40 hover:bg-[#c98a5a]/80')} />
            </button>
          ) : (
            <span key={a.title} aria-hidden className={cn('h-1 rounded-full transition-all duration-500', i === index ? 'w-5 bg-[#c98a5a]' : 'w-1 bg-[#c98a5a]/40')} />
          ),
        )}
      </div>
    </div>
  );
}

// Pixel Wave: the split-flap reveal on a loop; between plays the words pixelate under the pointer.
function PixelWaveVisual({ peek }: VisualProps) {
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
    return () => {
      cancel();
      stopHover();
      clearTimeout(timer);
    };
  }, [reduced]);
  return (
    <div className="texture-bg absolute inset-0 flex items-center px-7 sm:px-9">
      <PixelWaveText
        ref={ref}
        as="p"
        text="Designer who builds."
        className={cn('font-medium leading-[1.02] tracking-tight text-foreground', peek ? 'text-5xl sm:text-[4.5rem]' : 'text-4xl sm:text-5xl xl:text-6xl')}
      />
    </div>
  );
}

// Pixel Mark: the four-pixel braille P at three sizes; its pixels cycle under the pointer.
function PixelMarkVisual({ peek }: VisualProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center gap-6 bg-card" data-logo-cycle-trigger>
      <Logo trigger="container" className={peek ? 'size-40 sm:size-[14rem]' : 'size-28 sm:size-32'} />
      <Logo trigger="container" className={cn(peek ? 'size-20' : 'size-14', 'opacity-80')} />
      <Logo trigger="container" className={cn(peek ? 'size-10' : 'size-7', 'opacity-60')} />
    </div>
  );
}

const caseVisual = (Card: ComponentType) =>
  function CaseVisual() {
    return (
      <div className="texture-bg absolute inset-0">
        <Card />
      </div>
    );
  };

type VisualProps = { peek?: boolean; onArticle?: (article: (typeof ARTICLES)[number]) => void };

// A snapshot: the visual, what the peek says about it, and where it leads. Titles and summaries are the site's own words.
export type Snapshot = {
  id: string;
  title: string;
  /** A few words above the title in the peek: the company for a case study, or what kind of piece it is. */
  line: string;
  summary: string;
  /** The tile's shape on the board; the peek uses `aspect` at a larger size. */
  aspect: string;
  Visual: ComponentType<VisualProps>;
  /** Where the work goes deeper: a Studio prototype or page, and the website's page for it. */
  links: { label: string; to: string; external?: boolean }[];
};

export const SNAPSHOTS: Snapshot[] = [
  {
    id: 'pattern-engine',
    title: 'Pattern Engine',
    line: 'Tool for Unknown Arts',
    summary: 'A generative art tool that draws the feature art for every Unknown Arts article I publish. Each article keeps its settings, so its art can be opened, tuned and redrawn.',
    aspect: 'aspect-[1200/630]',
    Visual: PatternEngineVisual,
    links: [{ label: 'Open Pattern Engine', to: PATTERN_ENGINE }],
  },
  {
    id: 'pixel-wave',
    title: 'Pixel Wave',
    line: 'Type study',
    summary: 'A split-flap text reveal for crafted interfaces. Letters flip through Geist Pixel and settle into Geist Sans, then pixelate again under the pointer.',
    aspect: 'aspect-[4/5]',
    Visual: PixelWaveVisual,
    links: [{ label: 'Open its component page', to: `${SYSTEM}/pixel-wave-text` }],
  },
  {
    id: 'sublime',
    title: 'Giving a security agent the right amount of control',
    line: 'Sublime Security',
    summary: 'At Sublime Security, I lead design for ADÉ, an AI agent that writes detection rules, and gives security teams control over its autonomy.',
    aspect: 'aspect-video',
    Visual: caseVisual(SublimeCard),
    links: [
      { label: 'Open its visuals', to: `${SYSTEM}/sublime` },
      { label: 'Read the case study', to: `${SITE}/work/sublime-agents`, external: true },
    ],
  },
  {
    id: 'design-studio',
    title: 'Building a design environment for people and agents',
    line: 'Design Studio',
    summary: "I designed and built Design Studio on my own: the environment where Sublime's product team and their agents prototype together, and an open-source version for any team.",
    aspect: 'aspect-video',
    Visual: caseVisual(() => <StudioCard size="card" />),
    links: [
      { label: 'Open its visuals', to: `${SYSTEM}/design-studio` },
      { label: 'Read the case study', to: `${SITE}/work/design-studio`, external: true },
    ],
  },
  {
    id: 'pixel-mark',
    title: 'Pixel Mark',
    line: 'Identity',
    summary: 'My mark: four pixels that spell P in braille. Its pixels cycle on hover, and it doubles as my site\'s sidebar toggle.',
    aspect: 'aspect-video',
    Visual: PixelMarkVisual,
    links: [{ label: 'Open its component page', to: `${SYSTEM}/logo` }],
  },
  {
    id: 'expansion',
    title: 'Expanding a security platform for a new use case',
    line: 'Signal Sciences',
    summary: 'At Signal Sciences, I shaped how a new bot defense SKU came to market by extending the platform instead of building a separate product.',
    aspect: 'aspect-video',
    Visual: caseVisual(ExpansionCard),
    links: [
      { label: 'Open its visuals', to: `${SYSTEM}/expansion` },
      { label: 'Read the case study', to: `${SITE}/work/expansion`, external: true },
    ],
  },
  {
    id: 'query-builder',
    title: 'Making a complex query language approachable',
    line: 'JupiterOne',
    summary: 'At JupiterOne, I designed a visual query builder that taught J1QL, a proprietary graph query language, as customers used it.',
    aspect: 'aspect-video',
    Visual: caseVisual(QueryCard),
    links: [
      { label: 'Open its visuals', to: `${SYSTEM}/query-builder` },
      { label: 'Read the case study', to: `${SITE}/work/query-language`, external: true },
    ],
  },
];

export { engineHref, SITE };
