# Snapshots

A team module: the studio's most compelling work, shown live as a board on Studio's front page, below the search. It's a view, not a place to make things. itspatmorgan.com mirrors the same list on its own Snapshots page, so adding a piece here is the only step that puts it on the site.

The bar for a piece is that it is compelling on its own. The board should feel like dropping into a wall of experiments, so a piece that doesn't hold attention stays out.

Each snapshot is a visual from the [Visuals module](../visuals/README.md): a view drawn at a named format. The path through it is snapshot, then peek, then source:

1. **Snapshot.** A tile on the board draws the view live at its format, scaled to the tile and inert.
2. **Peek.** Clicking a tile opens it large and interactive, with a short summary and its links. Arrow keys move between pieces; Escape closes.
3. **Source.** The first link usually goes to the prototype that holds every visual for that piece of work (one view per visual); the website owns the case study itself.

## Files

- `snapshots.ts` is the list, in board order. Each entry declares its id, the view's permanent address, its format (which the view must declare with `defineVisual`), its tile width, the peek's line, title, summary and links, and an optional rendered clip.
- `build.ts` validates the list (the view exists and declares that format, links are Studio addresses or https, clip files exist) and puts it in the manifest as `contributions.snapshots`. The published `prototypes/manifest.json` carries it, so the site reads it at build time.
- `app.tsx` is the front page board (`homeBoard`) and the peek. Each tile hosts its view on the `visuals/board` surface with the view as its own origin, so the same-prototype reference rule holds.
- `node/record.ts` records a clip for an entry that has one, from a running studio with Playwright and ffmpeg. It is the seed of a render service in the Visuals module (artifact, format and color mode in; poster and clip out).

## Clips

An entry needs a clip only where a live view can't be drawn, such as the website until it draws views itself. Clips live in `public/snapshots/<id>.mp4` and `.jpg`, because the site needs fixed URLs for them.

```sh
pnpm dev --port 5173
node src/modules/snapshots/node/record.ts --url http://localhost:5173 [--only <id>]
```

The build fails while a declared clip is missing.

## Off and removed

The module has no library, so turning it off only hides the board, and the published manifest stops carrying the list. The site then keeps showing its last saved copy.
