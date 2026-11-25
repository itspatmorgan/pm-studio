---
name: use-snapshots
description: Add a piece to Snapshots, change the list, or re-record a clip, when Snapshots is enabled.
---

Read this module's [README](../../README.md).

To add a piece:

1. Check the bar first: the piece's clip has to be compelling on its own, in a feed of other visual work. If it isn't yet, improve the piece or its scene before adding it.
2. Add an entry to `snapshots.ts` at the place it should appear. Use the piece's permanent address from the Studio (a prototype view, `/prototypes/<id>/artifacts/<id>`, or a system component page, `/systems/<id>/components/<name>`). Write the one line in plain words: what the piece is, not how it was built. Set `native` only for a piece whose code is in `@itspatmorgan/kit` and that itspatmorgan.com already draws.
3. Add a scene for it in `node/record.ts` that shows the piece being used: hovering, clicking, or changing a setting, so the result responds. Crop to the piece itself, not the Studio around it, and keep it under 15 seconds.
4. Run the studio and record it with `--only <id>`. Look at the poster and a few frames of the clip before committing.
5. Run `pnpm check` and `pnpm build`, then open `/snapshots` in both color modes and at phone width.

The site picks up the change on its next build after this studio deploys. To remove a piece, remove its entry and its two clip files.
