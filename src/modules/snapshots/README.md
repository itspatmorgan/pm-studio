# Snapshots

A team module: a visual feed of the studio's most compelling work at `/snapshots`, reached from its rail button. It's a view, not a place to make things. Each piece plays a short clip of itself in use and opens the real thing. itspatmorgan.com mirrors the same list on its own Snapshots page, so adding a piece here is the only step that puts it on the site.

The bar for a piece is that its clip is compelling on its own. The feed should feel like dropping into a board of experiments, so a piece whose clip doesn't hold attention stays out.

## Files

- `snapshots.ts` is the list, in order. Each entry declares its id, title, one line, permanent Studio address (a prototype view or a system component page), clip files, and `native`: the kit piece the site can draw itself, or `null` when the site plays the clip.
- `build.ts` validates the list and puts it in the manifest as `contributions.snapshots`. The published `prototypes/manifest.json` carries it, so the site reads it at build time.
- `app.tsx` and `SnapshotTile.tsx` draw the feed: a masonry of clips at their own shapes, each playing while it's on screen (the poster stays under reduced motion), then its title and line.
- `node/record.ts` records each clip from a running studio with Playwright and ffmpeg: a muted loop of the piece being used, with a pointer, and its first frame as a poster. Each piece has a scene there that drives it.

## Clips

Clips live in `public/snapshots/<id>.mp4` and `.jpg`, because the site needs fixed URLs for them. That's the one thing this module keeps outside its folder. They're recorded in the light color mode at 960 pixels wide, which keeps each clip far under the studio's asset limit.

```sh
pnpm build && pnpm preview
node src/modules/snapshots/node/record.ts --url http://localhost:4173 [--only <id>]
```

`pnpm dev` works too. Re-record a piece when it changes visibly. The build fails while an entry's clip is missing.

## Off and removed

The module has no library, so turning it off only hides the feed, and the published manifest stops carrying the list. The site then keeps showing its last saved copy.
