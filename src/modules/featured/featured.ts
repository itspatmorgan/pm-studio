// The featured list: the few pieces of work this studio shows off, in order. It draws the Featured work page and its
// front-page row, and the published manifest carries it (build.ts) so itspatmorgan.com can show the same pieces as
// snapshots. Featuring a piece means adding it here and recording its snapshot (README.md).

/** How much of the bento grid a tile takes: large 2x2, wide 2x1, tall 1x2, small 1x1. */
export type FeaturedSize = 'large' | 'wide' | 'tall' | 'small';

export type FeaturedEntry = {
  /** Stable id, also the snapshot's file name. Lowercase words and dashes. */
  id: string;
  title: string;
  /** One sentence saying what the piece is. */
  line: string;
  size: FeaturedSize;
  /** The piece's permanent Studio address: a prototype view or a system page. */
  href: string;
  /** A muted loop of the piece being used, and its first frame, under public/ (recorded by node/record.ts). */
  snapshot: { clip: string; poster: string };
  /** The kit piece itspatmorgan.com can draw itself instead of playing the clip, or null when it plays the clip. */
  native: 'pattern-engine' | 'pixel-mark' | 'pixel-wave' | null;
};

export type FeaturedContribution = { entries: FeaturedEntry[] };

export const FEATURED: FeaturedEntry[] = [
  {
    id: 'pattern-engine',
    title: 'Pattern Engine',
    line: 'A generative art tool that draws the art for every Unknown Arts article.',
    size: 'large',
    href: '/prototypes/vjwrvf5t8z1cbwy3/artifacts/tc3b4fm8y98jv6nx',
    snapshot: { clip: '/featured/pattern-engine.mp4', poster: '/featured/pattern-engine.jpg' },
    native: 'pattern-engine',
  },
  {
    id: 'pixel-mark',
    title: 'Pixel Mark',
    line: 'A four-pixel logo that spells P in braille, and the ways it moves.',
    size: 'wide',
    href: '/systems/v4576ka1mbpbqdp1/components/logo',
    snapshot: { clip: '/featured/pixel-mark.mp4', poster: '/featured/pixel-mark.jpg' },
    native: 'pixel-mark',
  },
  {
    id: 'pixel-wave',
    title: 'Pixel Wave',
    line: 'A split-flap text reveal that settles from Geist Pixel into Geist Sans.',
    size: 'wide',
    href: '/systems/v4576ka1mbpbqdp1/components/pixel-wave-text',
    snapshot: { clip: '/featured/pixel-wave.mp4', poster: '/featured/pixel-wave.jpg' },
    native: 'pixel-wave',
  },
];
