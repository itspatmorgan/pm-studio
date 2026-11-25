// The Snapshots list: the visuals this studio leads with, in board order. Studio's front page shows them live below the
// search, and itspatmorgan.com mirrors the same list through the published manifest (build.ts). A piece is here only if
// it is compelling on its own: the board is the most visual view of the studio, so every snapshot has to earn its place.
//
// Each snapshot is a visual (a view drawn at a format, see src/modules/visuals) plus what the peek says about it and
// where it leads: snapshot, then peek, then source.

export type Snapshot = {
  /** Stable id, also the name of its rendered fallback. Lowercase words and dashes. */
  id: string;
  /** The visual itself: a view's permanent address, /prototypes/<prototype id>/artifacts/<view id>. */
  view: string;
  /** The visual's format, as its view declares it (defineVisual): the tile's shape. */
  format: 'board-wide' | 'board-companion' | 'board-card';
  /** The tile's width on the board: a wide lead (two thirds), a third, or a half. */
  tile: 'wide' | 'third' | 'half';
  /** A few words above the title in the peek: the company for a case study, or what kind of piece it is. */
  line: string;
  title: string;
  /** Two or three sentences for the peek: what the work is and why it matters, in the site's own words. */
  summary: string;
  /** Where the work goes deeper, first link first: a Studio address (a prototype view or a system page) or a website URL. */
  links: { label: string; href: string }[];
  /** A rendered loop and poster under public/, for places that can't draw the view live. Null when none is needed. */
  clip: { video: string; poster: string } | null;
};

export type SnapshotsContribution = { entries: Snapshot[] };

const SITE = 'https://itspatmorgan.com';

export const SNAPSHOTS: Snapshot[] = [
  {
    id: 'pattern-engine',
    view: '/prototypes/vjwrvf5t8z1cbwy3/artifacts/z29gs4rdpkeb3kc2',
    format: 'board-wide',
    tile: 'wide',
    line: 'Tool for Unknown Arts',
    title: 'Pattern Engine',
    summary:
      'A generative art tool that draws the feature art for every Unknown Arts article I publish. Each article keeps its settings, so its art can be opened, tuned and redrawn.',
    links: [
      { label: 'Open Pattern Engine', href: '/prototypes/vjwrvf5t8z1cbwy3/artifacts/tc3b4fm8y98jv6nx' },
      { label: 'Read the articles', href: `${SITE}/writing` },
    ],
    clip: { video: '/snapshots/pattern-engine.mp4', poster: '/snapshots/pattern-engine.jpg' },
  },
  {
    id: 'pixel-wave',
    view: '/prototypes/7c8v6f30qjwq4rwv/artifacts/kr6jxa701c70653w',
    format: 'board-companion',
    tile: 'third',
    line: 'Type study',
    title: 'Pixel Wave',
    summary:
      'A split-flap text reveal for crafted interfaces. Letters flip through Geist Pixel and settle into Geist Sans, then pixelate again under the pointer.',
    links: [{ label: 'Open its component page', href: '/systems/v4576ka1mbpbqdp1/components/pixel-wave-text' }],
    clip: { video: '/snapshots/pixel-wave.mp4', poster: '/snapshots/pixel-wave.jpg' },
  },
  {
    id: 'sublime',
    view: '/prototypes/8d4sjh3tqcpateeb/artifacts/txcgzk5n4kcghqpv',
    format: 'board-card',
    tile: 'third',
    line: 'Sublime Security',
    title: 'Giving a security agent the right amount of control',
    summary:
      'At Sublime Security, I lead design for ADÉ, an AI agent that writes detection rules, and gives security teams control over its autonomy.',
    links: [
      { label: 'See every visual', href: '/prototypes/8d4sjh3tqcpateeb/artifacts/3h97z7qn7gw92bgx' },
      { label: 'Read the case study', href: `${SITE}/work/sublime-agents` },
    ],
    clip: null,
  },
  {
    id: 'design-studio',
    view: '/prototypes/tmqb4g4sdtm1zmyn/artifacts/7fz9b433wn57aqnj',
    format: 'board-card',
    tile: 'third',
    line: 'Design Studio',
    title: 'Building a design environment for people and agents',
    summary:
      "I designed and built Design Studio on my own: the environment where Sublime's product team and their agents prototype together, and an open-source version for any team.",
    links: [
      { label: 'See every visual', href: '/prototypes/tmqb4g4sdtm1zmyn/artifacts/kqrkpnx85z1g6wjh' },
      { label: 'Read the case study', href: `${SITE}/work/design-studio` },
    ],
    clip: null,
  },
  {
    id: 'pixel-mark',
    view: '/prototypes/7c8v6f30qjwq4rwv/artifacts/egxhnxp9k7qpmsts',
    format: 'board-card',
    tile: 'third',
    line: 'Identity',
    title: 'Pixel Mark',
    summary: 'My mark: four pixels that spell P in braille. Its pixels cycle on hover, and it doubles as my site’s sidebar toggle.',
    links: [{ label: 'Open its component page', href: '/systems/v4576ka1mbpbqdp1/components/logo' }],
    clip: { video: '/snapshots/pixel-mark.mp4', poster: '/snapshots/pixel-mark.jpg' },
  },
  {
    id: 'expansion',
    view: '/prototypes/15y8xqkgz1pdmh0j/artifacts/6bxternk4dfakd0r',
    format: 'board-card',
    tile: 'half',
    line: 'Signal Sciences',
    title: 'Expanding a security platform for a new use case',
    summary:
      'At Signal Sciences, I shaped how a new bot defense SKU came to market by extending the platform instead of building a separate product.',
    links: [{ label: 'Read the case study', href: `${SITE}/work/expansion` }],
    clip: null,
  },
  {
    id: 'query-builder',
    view: '/prototypes/8rd8gh0ev41wjgdk/artifacts/rg0wej5qt0abax6e',
    format: 'board-card',
    tile: 'half',
    line: 'JupiterOne',
    title: 'Making a complex query language approachable',
    summary:
      'At JupiterOne, I designed a visual query builder that taught J1QL, a proprietary graph query language, as customers used it.',
    links: [{ label: 'Read the case study', href: `${SITE}/work/query-language` }],
    clip: null,
  },
];
