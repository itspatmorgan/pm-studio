import type { ModuleSpec } from '#studio/module';

// Snapshots: a visual feed of the studio's most compelling work, mirrored on itspatmorgan.com/snapshots. See
// README.md, and src/platform/context/modules.md for everything a module can declare.
export default {
  lib: false,
  id: 'snapshots',
  label: 'Snapshots',
  version: '0.1.0',
  requires: '0.5.0',
  description: 'A visual feed of the studio’s most compelling work, each piece shown in use, mirrored on the website.',
  optional: true,
  section: { key: 'snapshots' },
  instructions: [{ path: 'skills/use-snapshots/', when: 'asks to add, change, or re-record Snapshots' }],
} satisfies ModuleSpec;
