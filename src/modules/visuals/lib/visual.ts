import type { FormatId } from './formats';

// What a view says about itself as a visual, exported beside its default export:
//   export const visual = defineVisual({ format: 'board-card', title: 'ADÉ, auto-accepted' });
// A board, a render, and an agent read it to draw the view at the right size and name it. Everything is explicit: a view
// without `visual` is an ordinary view, not a visual.
export type VisualMeta = {
  format: FormatId;
  title: string;
  /** Moving visuals: how long one loop runs, so a render records a whole one. Absent for a still. */
  loop?: { seconds: number };
  /** For a still of a moving visual (a poster, reduced motion): the moment that tells the story on its own, in seconds. */
  still?: number;
};

export const defineVisual = (meta: VisualMeta): VisualMeta => meta;
