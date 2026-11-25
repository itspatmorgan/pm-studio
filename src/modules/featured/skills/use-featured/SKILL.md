---
name: use-featured
description: Feature a piece of work, change the featured list, or re-record a snapshot, when Featured work is enabled.
---

Read this module's [README](../../README.md).

To feature a piece:

1. Add an entry to `featured.ts` at the place it should appear. Use the piece's permanent address from the Studio (a prototype view, `/prototypes/<id>/artifacts/<id>`, or a system component page, `/systems/<id>/components/<name>`). Write the one line in plain words: what the piece is, not how it was built. Set `native` only for a piece whose code is in `@itspatmorgan/kit` and that itspatmorgan.com already draws.
2. Add a scene for it in `node/record.ts` that shows the piece being used: hovering, clicking, or changing a setting, so the result responds. Keep it under 15 seconds.
3. Run the studio and record it with `--only <id>`. Look at the poster and a few frames of the clip before committing.
4. Run `pnpm check` and `pnpm build`, then open `/featured` and the front page in both color modes.

The site picks up the change on its next build after this studio deploys. To unfeature a piece, remove its entry and its two snapshot files.
