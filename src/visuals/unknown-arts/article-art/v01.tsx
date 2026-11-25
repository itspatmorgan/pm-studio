/** @studio-id z29gs4rdpkeb3kc2 */
import { useEffect, useState } from 'react';
import { Frame, defineVisual } from '@module/visuals';
import { LiveEditorialVisual } from '@/systems/website/components/generative-art';
import { useReduced } from '@/systems/website/components/theme-hooks';

// Pattern Engine's snapshot: the real feature art of five Unknown Arts articles, one after another, each drawing itself in.
// The settings are the articles' own (their `visual` frontmatter on itspatmorgan.com).
export const visual = defineVisual({ format: 'board-wide', loop: { seconds: 35 }, still: 6 });

type Visual = Parameters<typeof LiveEditorialVisual>[0]['visual'];
export const ARTICLES: { title: string; slug: string; visual: Visual }[] = [
  {
    title: 'Curate Your Context',
    slug: 'curate-your-context',
    visual: {
      background: 'warm-dark-gray',
      generator: { type: 'strange-attractor', seed: 118, opacity: 85, color: 'copper' },
      lightMode: { color: 'bronze', opacity: 100 },
      texture: 20,
      grain: 24,
    },
  },
  {
    title: 'When Creation Becomes Compulsion',
    slug: 'when-creation-becomes-compulsion',
    visual: {
      background: 'warm-dark-gray',
      generator: {
        type: 'flow-field',
        seed: 203,
        density: 150,
        steps: 100,
        scale: 320,
        curl: 30,
        strokeWidth: 1,
        opacity: 75,
        color: 'copper',
      },
      texture: 20,
      grain: 24,
    },
  },
  {
    title: 'Default It or Design It',
    slug: 'default-it-or-design-it',
    visual: {
      background: 'warm-dark-gray',
      generator: { type: 'isoline', seed: 301, levels: 12, scale: 350, strokeWidth: 0.7, opacity: 75, color: 'copper' },
      lightMode: { color: 'bronze', opacity: 100, strokeWidth: 1.05 },
      texture: 0,
      grain: 24,
    },
  },
  {
    title: '3 Models for Framing Software Complexity',
    slug: '3-models-for-framing-software-complexity',
    visual: {
      background: 'warm-dark-gray',
      generator: { type: 'voronoi', seed: 300, count: 60, jitter: 60, strokeWidth: 0.6, opacity: 75, color: 'copper' },
      lightMode: { color: 'bronze', opacity: 100, strokeWidth: 0.9 },
      texture: 0,
      grain: 24,
    },
  },
  {
    title: 'Be a Skill Surfer',
    slug: 'be-a-skill-surfer',
    visual: {
      background: 'warm-dark-gray',
      generator: { type: 'dot-grid', seed: 139, spacing: 22, scale: 300, dotSize: 70, opacity: 70, color: 'copper' },
      texture: 0,
      grain: 24,
    },
  },
];

export default function ArtReel() {
  const reduced = useReduced();
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const timer = setInterval(
      () => setIndex(i => (i + 1) % ARTICLES.length),
      (visual.loop!.seconds / ARTICLES.length) * 1000,
    );
    return () => clearInterval(timer);
  }, [reduced, index]);
  return (
    <Frame format={visual.format}>
      <LiveEditorialVisual key={index} visual={ARTICLES[index]!.visual} />
      <div className='absolute top-6 right-6 flex gap-2'>
        {ARTICLES.map((article, i) => (
          <button
            key={article.slug}
            type='button'
            aria-label={article.title}
            onClick={() => setIndex(i)}
            className='flex h-5 items-center'
          >
            <span
              className={
                i === index
                  ? 'block h-1.5 w-7 rounded-full bg-[#c98a5a] transition-all duration-500'
                  : 'block h-1.5 w-1.5 rounded-full bg-[#c98a5a]/40 transition-all duration-500 hover:bg-[#c98a5a]/80'
              }
            />
          </button>
        ))}
      </div>
    </Frame>
  );
}
