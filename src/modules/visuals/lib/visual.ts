import type { FormatId } from './formats';

// What a view says about itself as a visual, exported beside its default export:
//   export const visual = defineVisual({ format: 'board-card' });
// A board, a render, and an agent read it to draw the view at the right size. Everything is explicit: a view without
// `visual` is an ordinary view, not a visual. The visual's name lives in its folder's meta.json, so its iterations share it.
export type VisualMeta = {
  format: FormatId;
  /** A name for this one view, when it differs from the visual's own (meta.json). */
  title?: string;
  /** Moving visuals: how long one loop runs, so a render records a whole one. Absent for a still. */
  loop?: { seconds: number };
  /** For a still of a moving visual (a poster, reduced motion): the moment that tells the story on its own, in seconds. */
  still?: number;
};

export const defineVisual = (meta: VisualMeta): VisualMeta => meta;
