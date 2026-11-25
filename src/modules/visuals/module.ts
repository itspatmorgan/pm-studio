import type { ModuleSpec } from '#studio/module';

// Visuals: the foundation for brand and creative visuals. A visual is a view drawn at a named format, so the same piece
// renders the same way on a board, in a peek, on the website, and in an exported still or clip. Visuals live in their own
// section, src/visuals/<project>/, one folder per project with a folder of versions for each piece. See README.md.
export default {
  lib: true,
  id: 'visuals',
  label: 'Visuals',
  version: '0.1.0',
  requires: '0.5.0',
  description: 'Brand and creative visuals in projects: each piece a view drawn at a named format, with its versions and family.',
  // One folder per project (src/visuals/<project>/), opened at /visuals/<project> like a prototype. Patrick maintains them.
  section: { key: 'visuals', folder: 'src/visuals', items: 'prototypes', policy: 'maintainers' },
  optional: true,
  // A board: a page of visuals shown live, each one its own origin, such as Snapshots on the front page.
  hosts: [{ id: 'visuals/board', scopes: ['prototype'], references: 'same-prototype' }],
  instructions: [{ path: 'skills/use-visuals/', when: 'asks to make a visual, add a format, or draw a view at a format' }],
} satisfies ModuleSpec;
