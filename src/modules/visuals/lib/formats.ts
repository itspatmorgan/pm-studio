// The shared formats library. A format is a named canvas size, independent of any brand: a visual is composed at its
// format's pixel size and scaled to wherever it is shown, so its layout never reflows between a tile, a peek, and an
// export. Channel formats come from itspatmorgan.com's formats (src/visuals/formats.ts) and its share cards; board
// formats are the tile shapes the Snapshots board composes for. Add a format here, never in a view.

export type Format = {
  label: string;
  /** The canvas a visual is composed on, in CSS pixels. Exports render at this size times the pixel ratio. */
  width: number;
  height: number;
  /** What it is for. */
  note: string;
  kind: 'channel' | 'board';
};

export const FORMATS = {
  'share-card': { label: 'Share card', width: 1200, height: 630, note: 'The image shown when a link is shared', kind: 'channel' },
  slide: { label: 'Slide', width: 1920, height: 1080, note: '16:9 presentation slide', kind: 'channel' },
  'social-portrait': { label: 'Social post', width: 1080, height: 1350, note: '4:5 post for X and LinkedIn', kind: 'channel' },
  scene: { label: 'Product scene', width: 1120, height: 720, note: 'A case study scene at the size its stage is drawn, with room for its caption', kind: 'channel' },
  'board-wide': { label: 'Wide tile', width: 1200, height: 630, note: 'The board’s lead tile, and the article art’s own shape', kind: 'board' },
  'board-card': { label: 'Card tile', width: 800, height: 450, note: 'A 16:9 tile, the shape of a Work card visual', kind: 'board' },
  'board-portrait': { label: 'Portrait tile', width: 640, height: 800, note: 'A 4:5 tile beside the wide one', kind: 'board' },
  'board-square': { label: 'Square tile', width: 720, height: 720, note: 'A square tile for marks and details', kind: 'board' },
} as const satisfies Record<string, Format>;

export type FormatId = keyof typeof FORMATS;

export const formatOf = (id: FormatId): Format => FORMATS[id];

/** The CSS aspect-ratio of a format, such as "1200 / 630". */
export const aspectOf = (id: FormatId) => `${FORMATS[id].width} / ${FORMATS[id].height}`;
