// The kinds of visual this studio makes. A family sets which formats a visual may take and what it is for; every visual
// names exactly one in its meta.json ("family"). Add a family when real work needs one, with the formats it uses.
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

// What a visual can be part of: a case study, a product, a series. A visual lists its collections in meta.json
// ("collections"); a collection carries no rules, only its name, the line that introduces it, and the order its visuals
// read in (the story's order for a case study). Visuals it doesn't list follow, by name.
export type Collection = { id: string; label: string; line: string; order?: readonly string[] };

export const COLLECTIONS: readonly Collection[] = [
  {
    id: 'ade',
    label: 'ADÉ at Sublime',
    line: 'Sublime Security',
    order: ['ade-card', 'ade-message-gap', 'ade-job-review', 'ade-handoff', 'ade-auto-accepted', 'ade-automation-config', 'ade-jobs'],
  },
  {
    id: 'design-studio',
    label: 'Design Studio',
    line: 'Open-source prototyping environment',
    order: ['design-studio-card', 'design-studio-ask', 'design-studio-workspace', 'design-studio-range', 'design-studio-systems', 'design-studio-context', 'design-studio-share'],
  },
  { id: 'expansion', label: 'Bot defense at Signal Sciences', line: 'Signal Sciences' },
  { id: 'query-builder', label: 'Query builder at JupiterOne', line: 'JupiterOne' },
  { id: 'unknown-arts', label: 'Unknown Arts', line: 'Feature art for the newsletter' },
  { id: 'brand', label: 'Brand', line: 'Patrick Morgan' },
];
