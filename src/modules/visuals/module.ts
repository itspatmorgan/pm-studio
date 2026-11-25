import type { ModuleSpec } from '#studio/module';

// Visuals: the foundation for brand and creative visuals. A visual is a view drawn at a named format, so the same piece
// renders the same way on a board, in a peek, on the website, and in an exported still or clip. This first slice is the
// library: the shared formats and the frame that draws a view at one. See README.md.
export default {
  lib: true,
  id: 'visuals',
  label: 'Visuals',
  version: '0.1.0',
  requires: '0.5.0',
  description: 'Visuals drawn at named formats: a shared formats library and a frame that renders any view at one.',
  optional: true,
  instructions: [{ path: 'skills/use-visuals/', when: 'asks to make a visual, add a format, or draw a view at a format' }],
} satisfies ModuleSpec;
