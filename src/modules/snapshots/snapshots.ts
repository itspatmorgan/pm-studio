// The snapshots list: the pieces of work this studio shows in its Snapshots feed, in order. itspatmorgan.com mirrors it
// at /snapshots through the published manifest (build.ts). A piece is here only if its snapshot is compelling on its
// own: the feed is the most visual view of the studio, so every clip has to earn its place.

export type Snapshot = {
  /** Stable id, also the clip's file name. Lowercase words and dashes. */
  id: string;
  title: string;
  /** One sentence saying what the piece is. */
  line: string;
  /** The piece's permanent Studio address: a prototype view or a system page. */
  href: string;
  /** A muted loop of the piece being used, and its first frame, under public/ (recorded by node/record.ts). */
  clip: { video: string; poster: string };
  /** The kit piece itspatmorgan.com can draw itself instead of playing the clip, or null when it plays the clip. */
  native: 'pattern-engine' | 'pixel-mark' | 'pixel-wave' | null;
};

export type SnapshotsContribution = { entries: Snapshot[] };

export const SNAPSHOTS: Snapshot[] = [
  {
    id: 'pattern-engine',
    title: 'Pattern Engine',
    line: 'A generative art tool that draws the art for every Unknown Arts article.',
    href: '/prototypes/vjwrvf5t8z1cbwy3/artifacts/tc3b4fm8y98jv6nx',
    clip: { video: '/snapshots/pattern-engine.mp4', poster: '/snapshots/pattern-engine.jpg' },
    native: 'pattern-engine',
  },
  {
    id: 'pixel-mark',
    title: 'Pixel Mark',
    line: 'A four-pixel logo that spells P in braille, and the ways it moves.',
    href: '/systems/v4576ka1mbpbqdp1/components/logo',
    clip: { video: '/snapshots/pixel-mark.mp4', poster: '/snapshots/pixel-mark.jpg' },
    native: 'pixel-mark',
  },
  {
    id: 'pixel-wave',
    title: 'Pixel Wave',
    line: 'A split-flap text reveal that settles from Geist Pixel into Geist Sans.',
    href: '/systems/v4576ka1mbpbqdp1/components/pixel-wave-text',
    clip: { video: '/snapshots/pixel-wave.mp4', poster: '/snapshots/pixel-wave.jpg' },
    native: 'pixel-wave',
  },
];
