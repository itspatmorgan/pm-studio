// What the Visuals build puts in the manifest (contributions.visuals), read by the Visuals pages, Snapshots, and
// itspatmorgan.com through the published manifest. Plain data, so Node and the browser share it.
import type { FormatId } from './lib/formats.ts';
import type { Family } from './families.ts';
import type { Snapshot } from './snapshots.ts';

// Where a version stands. Exactly one is selected: the one a board shows and an export renders.
export const STATUSES = ['exploring', 'shortlisted', 'rejected', 'selected'] as const;
export type Status = (typeof STATUSES)[number];

export type VisualVersion = {
  /** The view's permanent id, which the version's record is keyed on, so renaming the file keeps its notes. */
  studioId: string;
  /** Its path in the project's folder, such as card/v01.tsx. */
  path: string;
  format: FormatId;
  status: Status;
  note?: string;
};

// A piece: one visual in a project, drawn at one format and made better version by version. Its versions are the files
// in its folder (src/visuals/<project>/<piece>/v01.tsx…), and at most one is selected.
export type VisualEntry = {
  /** Its address in the section: <project>/<piece>, such as ade/card. */
  id: string;
  /** The project's folder name in src/visuals/. */
  project: string;
  /** The piece's folder name in the project. */
  piece: string;
  title: string;
  family: string;
  /** Versions in order, v01 first. */
  versions: VisualVersion[];
  /** The selected version's view, or null while none is. */
  selected: VisualVersion | null;
};

// A visual project: the work a set of pieces is for, such as a case study, a product, or a series. It is the folder
// (src/visuals/<project>/), opened at /visuals/<project> like a prototype, and holds what the pieces share: its brief,
// sources and exports, beside the pieces themselves.
export type VisualProject = {
  id: string;
  title: string;
  /** The line that introduces it: the company for a case study, or what kind of work it is. */
  line: string;
  /** Its pieces' ids (<project>/<piece>) in the project's own order, the story's order for a case study. */
  pieces: string[];
};

export type VisualsContribution = {
  projects: VisualProject[];
  /** Every piece of every project, in project order. */
  visuals: VisualEntry[];
  families: readonly Family[];
  /** The front page board, in order (snapshots.ts). */
  snapshots: Snapshot[];
};

// The record beside a project's pieces (_iterations.json): only each version's status and note. The files in the pieces'
// folders are the version list, so a record entry with no file, or a file with no entry, is reported rather than guessed at.
export type IterationsRecord = {
  formatVersion: 1;
  versions: Record<string, { status: Status; note?: string }>;
};
