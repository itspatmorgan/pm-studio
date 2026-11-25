import type { ModuleSpec } from '#studio/module';

// Featured work. This file says what the module is, and what it adds. See src/platform/context/modules.md for everything
// it can say: a section (an address and a folder), a lib prototypes can import, module context and skills, npm dependencies.
export default {
  lib: false,
  id: 'featured',
  label: 'Featured work',
  version: '0.1.0',
  requires: '0.5.0',
  description: 'A curated bento grid of the work this studio shows off, also published for itspatmorgan.com.',
  optional: true,
  section: { key: 'featured' },
  instructions: [{ path: 'skills/use-featured/', when: 'asks about Featured work' }],
} satisfies ModuleSpec;
