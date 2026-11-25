---
name: use-visuals
description: Make a visual (a view drawn at a named format), add a format, or draw a view at a format, when Visuals is enabled.
---

# Use Visuals

Read [the module README](../../README.md) first.

To make a visual:

1. Pick its family in `families.ts` (it sets the formats it may take) and the collections it belongs to.
2. Create `src/visuals/<id>/` with `meta.json` (`formatVersion`, `title`, `created`, `ownerContributorId`, `systemId`,
   `maintainers`, `family`, `collections`), `iterations/v01.tsx`, and `_iterations.json` marking v01 `selected`. With the
   dev server running, the view gets its `@studio-id`; then key its record on that id.
3. In the view, export `visual = defineVisual({ format })` beside the default export, and draw it in
   `<Frame format={visual.format}>` (or `<Stage>` for a scene made for a page). Compose at the format's pixel size.
4. Use the system's components for everything drawn. Show real product and real words; never stand-ins.
5. For a new version, copy the selected one to the next number, change it, and record its status and a note.
6. Check it on `/visuals` and open it at full size, in light and dark, and with reduced motion. Run `pnpm build`.

To put a visual on the front page board, add it to `snapshots.ts` with its tile width, peek line, title, summary and
links. Only a visual whose selected version is drawn at a board format can be a snapshot, and it has to be compelling
on its own.

Add a format to `lib/formats.ts` only for a new channel or board shape, with its real pixel size.
