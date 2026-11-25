import fs from 'node:fs';
import path from 'node:path';
import type { ModuleBuild } from '#studio/module';
import { COLLECTIONS, FAMILIES } from './families.ts';
import { SNAPSHOTS } from './snapshots.ts';
import { FORMATS, type FormatId } from './lib/formats.ts';
import { STATUSES, type IterationsRecord, type VisualEntry, type VisualVersion, type VisualsContribution } from './visuals.ts';

const ID = /^[a-z][a-z0-9-]*$/;
const VERSION = /^v(\d{2,})\.tsx$/;
const STUDIO_LINK =
  /^\/(prototypes\/[a-z0-9]+\/artifacts\/[a-z0-9]+|systems\/[a-z0-9]+\/components\/[a-z0-9-]+|visuals(\?collection=[a-z0-9-]+)?|visuals\/[a-z0-9-]+)$/;
const WEB_LINK = /^https:\/\/[^\s]+$/;
const BOARD = ['board-wide', 'board-companion', 'board-card'];

// Reads src/visuals/: one folder per visual, each with meta.json (its title, family and collections), its versions in
// iterations/ (v01.tsx, v02.tsx… each a view that declares its format with defineVisual) and _iterations.json (each
// version's status and note, keyed by the view's permanent id). Puts the index in the manifest and counts each problem,
// so a visual whose family, format or selection is wrong fails the build instead of drawing wrongly on a board.
export default {
  // A status or note changed in a visual's record, by the app or an agent, shows at once.
  records: ['_iterations.json'],
  manifest({ root, out }) {
    let errors = 0;
    const fail = (where: string, message: string) => {
      out.error(`visuals: ${where} ${message}`);
      errors++;
    };
    const base = path.join(root, 'src', 'visuals');
    const visuals: VisualEntry[] = [];
    const folders = fs.existsSync(base)
      ? fs.readdirSync(base, { withFileTypes: true }).filter(d => d.isDirectory() && !d.name.startsWith('_'))
      : [];
    for (const { name: id } of folders.sort((a, b) => a.name.localeCompare(b.name))) {
      const dir = path.join(base, id);
      const where = `src/visuals/${id}`;
      if (!ID.test(id)) fail(where, 'needs a name of lowercase words and dashes.');
      let meta: Record<string, unknown>;
      try {
        meta = JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8'));
      } catch {
        continue; // the manifest reports a missing or broken meta.json for every item of a section
      }
      const family = FAMILIES.find(f => f.id === meta.family);
      if (!family) fail(`${where}/meta.json`, `needs "family": one of ${FAMILIES.map(f => f.id).join(', ')}.`);
      const collections = Array.isArray(meta.collections) ? (meta.collections as unknown[]) : null;
      if (!collections || collections.some(c => typeof c !== 'string'))
        fail(`${where}/meta.json`, 'needs "collections": a list, empty when the visual is part of none.');
      for (const c of collections ?? [])
        if (!COLLECTIONS.some(k => k.id === c))
          fail(`${where}/meta.json`, `lists collection "${String(c)}", which families.ts doesn't declare.`);

      let record: IterationsRecord = { formatVersion: 1, versions: {} };
      const recordFile = path.join(dir, '_iterations.json');
      if (!fs.existsSync(recordFile)) fail(where, 'needs _iterations.json, the status of each version.');
      else
        try {
          record = JSON.parse(fs.readFileSync(recordFile, 'utf8'));
          if (record.formatVersion !== 1 || typeof record.versions !== 'object' || !record.versions)
            throw new Error('shape');
        } catch {
          fail(`${where}/_iterations.json`, 'should be { "formatVersion": 1, "versions": { "<view id>": { "status": … } } }.');
          record = { formatVersion: 1, versions: {} };
        }

      const versions: VisualVersion[] = [];
      const iterations = path.join(dir, 'iterations');
      const files = fs.existsSync(iterations) ? fs.readdirSync(iterations).filter(f => f.endsWith('.tsx')) : [];
      for (const file of files.sort()) {
        const at = `${where}/iterations/${file}`;
        if (!VERSION.test(file)) fail(at, 'should be named by its version number, like v01.tsx.');
        const source = fs.readFileSync(path.join(iterations, file), 'utf8');
        const studioId = /@studio-id ([a-z0-9]+)/.exec(source.slice(0, 200))?.[1];
        if (!studioId) continue; // waiting for its identity, which the dev server or `pnpm studio identify` writes
        const format = /defineVisual\(\{[^}]*format: '([a-z-]+)'/.exec(source)?.[1] as FormatId | undefined;
        if (!format || !(format in FORMATS)) {
          fail(at, 'needs `export const visual = defineVisual({ format: … })` with a format from lib/formats.ts.');
          continue;
        }
        if (family && !family.formats.includes(format))
          fail(at, `is drawn at ${format}, which the ${family.id} family doesn't use (${family.formats.join(', ')}).`);
        const entry = record.versions[studioId];
        if (entry && !STATUSES.includes(entry.status))
          fail(`${where}/_iterations.json`, `gives ${studioId} the status "${entry.status}": use ${STATUSES.join(', ')}.`);
        versions.push({
          studioId,
          path: `iterations/${file}`,
          format,
          status: entry?.status ?? 'exploring',
          ...(entry?.note && { note: entry.note }),
        });
      }
      for (const key of Object.keys(record.versions))
        if (!versions.some(v => v.studioId === key))
          fail(`${where}/_iterations.json`, `has a record for ${key}, which no file in iterations/ is.`);
      const selected = versions.filter(v => v.status === 'selected');
      if (selected.length > 1) fail(where, 'has more than one selected version; select one.');
      if (!versions.length) fail(where, 'has no versions: add iterations/v01.tsx.');
      visuals.push({
        id,
        title: String(meta.title ?? id),
        family: String(meta.family ?? ''),
        collections: (collections ?? []).map(String),
        versions,
        selected: selected[0] ?? null,
      });
    }
    // The board: each snapshot names a visual whose selected version is drawn at a board format.
    const seen = new Set<string>();
    for (const snapshot of SNAPSHOTS) {
      const where = `snapshots.ts: "${snapshot.visual}"`;
      if (seen.has(snapshot.visual)) fail(where, 'is listed twice.');
      seen.add(snapshot.visual);
      const visual = visuals.find(v => v.id === snapshot.visual);
      if (!visual) fail(where, 'is not a visual in src/visuals/.');
      else if (!visual.selected) fail(where, 'has no selected version to show.');
      else if (!BOARD.includes(visual.selected.format))
        fail(where, `is drawn at ${visual.selected.format}; a snapshot needs a board format (${BOARD.join(', ')}).`);
      if (!snapshot.summary.trim()) fail(where, 'needs a summary for its peek.');
      if (!snapshot.links.length) fail(where, 'needs at least one link to where the work goes deeper.');
      for (const link of snapshot.links)
        if (!STUDIO_LINK.test(link.href) && !WEB_LINK.test(link.href))
          fail(where, `links to "${link.href}": use a permanent Studio address or an https URL.`);
      for (const file of snapshot.clip ? [snapshot.clip.video, snapshot.clip.poster] : [])
        if (!fs.existsSync(path.join(root, 'public', file))) fail(where, `is missing public${file}.`);
    }
    return {
      data: { visuals, families: FAMILIES, collections: COLLECTIONS, snapshots: SNAPSHOTS } satisfies VisualsContribution,
      errors,
    };
  },
} satisfies ModuleBuild<VisualsContribution>;
