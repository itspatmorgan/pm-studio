# Featured work

A team module: the few pieces of work this studio shows off, as a bento grid at `/featured` and a row of the first three on the front page. The same list is published for itspatmorgan.com, whose Snapshots page shows each piece and links to it here. Featuring a piece is the only step that puts it on the site.

## Files

- `featured.ts` is the list, in order. Each entry declares its id, title, one line, tile size, permanent Studio address (a prototype view or a system component page), snapshot files, and `native`: the kit piece the site can draw itself, or `null` when the site plays the clip.
- `build.ts` validates the list and puts it in the manifest as `contributions.featured`. The published `prototypes/manifest.json` carries it, so the site reads it at build time.
- `app.tsx` and `Tile.tsx` draw the grid, the front-page row, and the rail button. A tile shows its snapshot's poster and plays the clip while it's hovered or focused, except under reduced motion.
- `node/record.ts` records each snapshot from a running studio with Playwright and ffmpeg: a muted loop of the piece being used, with a pointer, and its first frame as a poster. Each piece has a scene there that drives it.

## Snapshots

Snapshots live in `public/featured/<id>.mp4` and `.jpg`, because the site needs fixed URLs for them. That's the one thing this module keeps outside its folder. They're recorded in the light color mode at 960 pixels wide, which keeps each clip far under the studio's asset limit.

```sh
pnpm build && pnpm preview
node src/modules/featured/node/record.ts --url http://localhost:4173 [--only <id>]
```

`pnpm dev` works too. Re-record a piece when it changes visibly. The build fails while an entry's snapshot is missing.

## Off and removed

The module has no library, so turning it off only hides the page and the front-page row, and the published manifest stops carrying the list. The site then keeps showing its last saved copy.
