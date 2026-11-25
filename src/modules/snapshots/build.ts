import fs from 'node:fs';
import path from 'node:path';
import type { ModuleBuild } from '#studio/module';
import { SNAPSHOTS, type SnapshotsContribution } from './snapshots.ts';

const ID = /^[a-z][a-z0-9-]*$/;
const HREF = /^\/(prototypes\/[a-z0-9]+\/artifacts\/[a-z0-9]+|systems\/[a-z0-9]+\/components\/[a-z0-9-]+)$/;

// Puts the snapshots list in the manifest, so the Snapshots feed and the published manifest.json (which
// itspatmorgan.com reads) come from one declaration. Each problem is counted as a manifest error.
export default {
  manifest({ root, out }) {
    let errors = 0;
    const fail = (message: string) => {
      out.error(`snapshots: ${message}`);
      errors++;
    };
    const ids = new Set<string>();
    for (const entry of SNAPSHOTS) {
      if (!ID.test(entry.id)) fail(`"${entry.id}" needs an id of lowercase words and dashes.`);
      if (ids.has(entry.id)) fail(`"${entry.id}" is listed twice.`);
      ids.add(entry.id);
      if (!HREF.test(entry.href)) fail(`"${entry.id}" needs a permanent prototype view or system component address.`);
      for (const file of [entry.clip.video, entry.clip.poster])
        if (!fs.existsSync(path.join(root, 'public', file)))
          fail(`"${entry.id}" is missing public${file}. Record it with node src/modules/snapshots/node/record.ts.`);
    }
    return { data: { entries: SNAPSHOTS } satisfies SnapshotsContribution, errors };
  },
} satisfies ModuleBuild<SnapshotsContribution>;
