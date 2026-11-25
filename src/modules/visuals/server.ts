// Local routes for the visual page (POST /__studio/visuals/<route>). Dev only, like every module route.
//
// record: changes one version's status or note in a project's _iterations.json. The record is a helper file (its name
// starts with an underscore), which Studio's ordinary save doesn't open, so the module writes it here. It reads the file,
// changes only that version's entry, and writes it back in one step, so a status or note an agent wrote to another
// version a moment earlier is kept. Selecting a version moves its piece's previous selection to shortlisted, since a piece
// has at most one. Only the project's maintainers (meta.json "maintainers") may change it.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ModuleServer } from '#studio/module';
import { STATUSES, type IterationsRecord, type Status } from './visuals.ts';

const root = fileURLToPath(new URL('../../../', import.meta.url));
const ID = /^[a-z][a-z0-9-]*$/;
const STUDIO_ID = /^[a-z0-9]{16}$/;
const MAX_NOTE = 2000;

class RouteError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

function changeRecord(me: string | null, body: unknown) {
  const request = (body ?? {}) as { project?: unknown; version?: unknown; status?: unknown; note?: unknown };
  const { project, version, status, note } = request;
  if (typeof project !== 'string' || !ID.test(project)) throw new RouteError('Unknown project.');
  if (typeof version !== 'string' || !STUDIO_ID.test(version)) throw new RouteError('Unknown version.');
  if (status !== undefined && !STATUSES.includes(status as Status)) throw new RouteError('Unknown status.');
  if (note !== undefined && (typeof note !== 'string' || note.length > MAX_NOTE)) throw new RouteError('Invalid note.');
  const dir = path.join(root, 'src', 'visuals', project);
  let meta: { maintainers?: unknown; pieces?: unknown };
  try {
    meta = JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8'));
  } catch {
    throw new RouteError('This project no longer exists.', 404);
  }
  if (!me || !Array.isArray(meta.maintainers) || !meta.maintainers.includes(me))
    throw new RouteError('Only this project’s maintainers can change it.', 403);
  // The version must be one of the project's pieces' files, found by the permanent id at the top of each. Its piece's
  // other versions are the ones a selection takes over from.
  const pieces = (Array.isArray(meta.pieces) ? meta.pieces : []).map((p: { id?: unknown }) => String(p?.id ?? ''));
  const idsIn = (piece: string) => {
    const folder = path.join(dir, piece);
    if (!ID.test(piece) || !fs.existsSync(folder)) return [];
    return fs
      .readdirSync(folder)
      .filter(f => f.endsWith('.tsx'))
      .map(f => /@studio-id ([a-z0-9]+)/.exec(fs.readFileSync(path.join(folder, f), 'utf8').slice(0, 200))?.[1]);
  };
  const siblings = pieces.map(idsIn).find(ids => ids.includes(version));
  if (!siblings) throw new RouteError('This version no longer exists.', 404);
  const file = path.join(dir, '_iterations.json');
  const record: IterationsRecord = fs.existsSync(file)
    ? JSON.parse(fs.readFileSync(file, 'utf8'))
    : { formatVersion: 1, versions: {} };
  if (status === 'selected')
    for (const [id, entry] of Object.entries(record.versions))
      if (siblings.includes(id) && entry.status === 'selected') entry.status = 'shortlisted';
  const entry: { status: Status; note?: string } = record.versions[version] ?? { status: 'exploring' };
  if (status !== undefined) entry.status = status as Status;
  if (note !== undefined) {
    const text = (note as string).trim();
    if (text) entry.note = text;
    else delete entry.note;
  }
  record.versions[version] = entry;
  fs.writeFileSync(file, `${JSON.stringify(record, null, 2)}\n`);
  return { ok: true };
}

export default {
  record: ({ me, body }) => {
    try {
      return { body: changeRecord(me, body) };
    } catch (error) {
      return {
        status: error instanceof RouteError ? error.status : 400,
        body: { error: error instanceof Error ? error.message : 'Couldn’t change this version.' },
      };
    }
  },
} satisfies ModuleServer;
