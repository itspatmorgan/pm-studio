import fs from 'node:fs';
import path from 'node:path';
import type { ModuleBuild } from '#studio/module';
import { SNAPSHOTS, type SnapshotsContribution } from './snapshots.ts';

const ID = /^[a-z][a-z0-9-]*$/;
const VIEW = /^\/prototypes\/([a-z0-9]+)\/artifacts\/([a-z0-9]+)$/;
const STUDIO_LINK = /^\/(prototypes\/[a-z0-9]+\/artifacts\/[a-z0-9]+|systems\/[a-z0-9]+\/components\/[a-z0-9-]+)$/;
const WEB_LINK = /^https:\/\/[^\s]+$/;

// Every view identity under src/prototypes, read from the files' @studio-id comments, so a snapshot that points at a view
// that moved or was deleted fails the build instead of showing an empty tile.
function viewIds(root: string) {
  const ids = new Map<string, string>();
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (entry.name.endsWith('.tsx')) {
        const source = fs.readFileSync(file, 'utf8');
        const id = /@studio-id ([a-z0-9]+)/.exec(source.slice(0, 200))?.[1];
        if (id) ids.set(id, source);
      }
    }
  };
  walk(path.join(root, 'src', 'prototypes'));
  return ids;
}

// Puts the snapshots list in the manifest, so the front page board and the published manifest.json (which
// itspatmorgan.com reads) come from one declaration. Each problem is counted as a manifest error.
export default {
  manifest({ root, out }) {
    let errors = 0;
    const fail = (message: string) => {
      out.error(`snapshots: ${message}`);
      errors++;
    };
    const ids = new Set<string>();
    const views = viewIds(root);
    for (const entry of SNAPSHOTS) {
      if (!ID.test(entry.id)) fail(`"${entry.id}" needs an id of lowercase words and dashes.`);
      if (ids.has(entry.id)) fail(`"${entry.id}" is listed twice.`);
      ids.add(entry.id);
      const view = VIEW.exec(entry.view);
      if (!view) fail(`"${entry.id}" needs its visual's permanent view address, /prototypes/<id>/artifacts/<id>.`);
      else if (!views.has(view[2]!)) fail(`"${entry.id}" points at view ${view[2]}, which no prototype has.`);
      else if (!views.get(view[2]!)!.includes(`format: '${entry.format}'`))
        fail(`"${entry.id}" says its format is ${entry.format}, but its view doesn't declare it with defineVisual.`);
      if (!entry.summary.trim()) fail(`"${entry.id}" needs a summary for its peek.`);
      if (!entry.links.length) fail(`"${entry.id}" needs at least one link to where the work goes deeper.`);
      for (const link of entry.links)
        if (!STUDIO_LINK.test(link.href) && !WEB_LINK.test(link.href))
          fail(`"${entry.id}" links to "${link.href}": use a permanent Studio address or an https URL.`);
      for (const file of entry.clip ? [entry.clip.video, entry.clip.poster] : [])
        if (!fs.existsSync(path.join(root, 'public', file)))
          fail(`"${entry.id}" is missing public${file}. Record it with node src/modules/snapshots/node/record.ts.`);
    }
    return { data: { entries: SNAPSHOTS } satisfies SnapshotsContribution, errors };
  },
} satisfies ModuleBuild<SnapshotsContribution>;
