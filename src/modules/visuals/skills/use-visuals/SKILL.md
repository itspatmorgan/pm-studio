---
name: use-visuals
description: Make a visual (a view drawn at a named format), add a format, or draw a view at a format, when Visuals is enabled.
---

# Use Visuals

Read [the module README](../../README.md) first.

A visual lives in a project (the work it is for, such as a case study) as a piece with versions. See the README's model.

To make a visual:

1. Find its project in `src/visuals/`, or start one: `src/visuals/<project>/` with `meta.json` (`formatVersion`,
   `title`, `line`, `created`, `ownerContributorId`, `systemId`, `maintainers`, `pieces: []`) and `_iterations.json`
   (`{ "formatVersion": 1, "versions": {} }`).
2. Pick the piece's family in `families.ts` (it sets the formats it may take) and add the piece to `pieces` in
   `meta.json`, in the project's order: `{ "id", "title", "family" }`. Its id is its folder's name.
3. Create `<piece>/v01.tsx`. With the dev server running, the view gets its `@studio-id`; then mark it `selected` in
   `_iterations.json`, keyed on that id.
4. In the view, export `visual = defineVisual({ format })` beside the default export, and draw it in
   `<Frame format={visual.format}>` (or `<Stage>` for a scene made for a page). Compose at the format's pixel size.
5. Use the system's components for everything drawn. Show real product and real words; never stand-ins.
6. For a new version, copy the selected one to the next number in the same piece, change it, and record its status and
   a note.
7. Check it on `/visuals/<project>` and open it at full size, in light and dark, and with reduced motion. Run
   `pnpm build`.

To put a piece on the front page board, add it to `snapshots.ts` as `<project>/<piece>` with its tile width, peek line, title, summary and
links. Only a piece whose selected version is drawn at a board format can be a snapshot, and it has to be compelling
on its own.

Add a format to `lib/formats.ts` only for a new channel or board shape, with its real pixel size.
