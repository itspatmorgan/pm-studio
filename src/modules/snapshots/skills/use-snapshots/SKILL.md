---
name: use-snapshots
description: Add a piece to Snapshots, change the list, or re-record a clip, when Snapshots is enabled.
---

Read this module's [README](../../README.md) and the [Visuals README](../../../visuals/README.md).

To add a piece:

1. Check the bar first: the piece has to be compelling on its own, on a board of other visual work. If it isn't yet, improve the visual before adding it.
2. Make sure there is a visual for it: a view in the piece's source prototype that declares a board format with `defineVisual` (`board-wide`, `board-companion` or `board-card`). Use the use-visuals skill to make one.
3. Add an entry to `snapshots.ts` at the place it should appear, with the view's permanent address, its format and a tile width that fits the row. Write the line and summary in plain words, using the site's own descriptions for case studies. Put the source prototype's overview first in `links`, then the website page.
4. Leave `clip` as `null` unless a place that can't draw views needs one; then add a scene in `node/record.ts` and record it with `--only <id>`.
5. Run `pnpm build`, then open the front page in both color modes and at phone width, and open the piece's peek.

The site picks up the change on its next build after this studio deploys.
