// What the Visuals build puts in the manifest (contributions.visuals), read by the Visuals pages, Snapshots, and
// itspatmorgan.com through the published manifest. Plain data, so Node and the browser share it.
import type { FormatId } from './lib/formats.ts';
import type { Collection, Family } from './families.ts';
import type { Snapshot } from './snapshots.ts';

// Where a version stands. Exactly one is selected: the one a board shows and an export renders.
export const STATUSES = ['exploring', 'shortlisted', 'rejected', 'selected'] as const;
export type Status = (typeof STATUSES)[number];

export type VisualVersion = {
  /** The view's permanent id, which the version's record is keyed on, so renaming the file keeps its notes. */
  studioId: string;
  /** Its path in the visual's folder, such as iterations/v01.tsx. */
  path: string;
  format: FormatId;
  status: Status;
  note?: string;
};

export type VisualEntry = {
  /** The visual's folder name in src/visuals/, and its address: /visuals/<id>. */
  id: string;
  title: string;
  family: string;
  collections: string[];
  /** Versions in order, v01 first. */
  versions: VisualVersion[];
  /** The selected version's view, or null while none is. */
  selected: VisualVersion | null;
};

export type VisualsContribution = {
  visuals: VisualEntry[];
  families: readonly Family[];
  collections: readonly Collection[];
  /** The front page board, in order (snapshots.ts). */
  snapshots: Snapshot[];
};

// The record beside a visual's iterations (_iterations.json): only status and notes. The files in iterations/ are the
// version list, so a record entry with no file, or a file with no entry, is reported rather than guessed at.
export type IterationsRecord = {
  formatVersion: 1;
  versions: Record<string, { status: Status; note?: string }>;
};
