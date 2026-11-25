// The kinds of visual this studio makes. A family sets which formats a visual may take and what it is for; every piece
// names exactly one in its project's meta.json ("family"). Add a family when real work needs one, with the formats it uses.
// These are Patrick's families, kept with the module for now; the brief moves them to the brand system later.
import type { FormatId } from './lib/formats.ts';

export type Family = { id: string; label: string; formats: readonly FormatId[]; description: string };

export const FAMILIES: readonly Family[] = [
  {
    id: 'project-card',
    label: 'Project card',
    formats: ['board-card'],
    description: "A project's headline visual: its product at a glance, for the Work grid and the board.",
  },
  {
    id: 'case-study-scene',
    label: 'Case study scene',
    formats: ['scene', 'board-square'],
    description: 'One point of a case study told with the real product, as it plays on the page.',
  },
  {
    id: 'feature-art',
    label: 'Feature art',
    formats: ['board-wide', 'share-card'],
    description: 'Generative art for an article or a launch.',
  },
  {
    id: 'identity',
    label: 'Identity',
    formats: ['board-card', 'board-companion'],
    description: 'The mark, the type and the other pieces of the brand, shown in use.',
  },
];
