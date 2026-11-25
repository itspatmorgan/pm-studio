// @module/visuals: the public library prototypes import. A visual is a view whose module also exports `visual`, made with
// defineVisual: its format, title, and the facts a board or a render needs. Pure values and one component, so the same
// entry serves while the module is off (off.ts).
export { FORMATS, aspectOf, formatOf, type Format, type FormatId } from './formats';
export { Frame } from './Frame';
export { defineVisual, type VisualMeta } from './visual';
