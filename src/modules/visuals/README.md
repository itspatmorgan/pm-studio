# Visuals

Brand and creative visuals in this studio, built here first and shaped to move upstream into Design Studio. The full
direction is the Visuals brief (Notion TASK-18). This build has the section, versions, families, collections, the index,
and Snapshots (the front page board). The media store, export and the iteration screens come later.

## A visual on disk

Each visual is a folder in its own section, `src/visuals/<id>/`, opened at `/visuals/<id>` like a prototype:

```
src/visuals/ade-card/
  meta.json            title, systemId, maintainers, family, collections
  _iterations.json     each version's status and note, keyed by the view's permanent id
  iterations/
    v01.tsx            a version: a view drawn at a format
```

```tsx
/** @studio-id txcgzk5n4kcghqpv */
import { Frame, defineVisual } from '@module/visuals';
import { SublimeCard } from '@/systems/website/components/sublime';

export const visual = defineVisual({ format: 'board-card' });

export default function AdeCard() {
  return (
    <Frame format={visual.format} className="texture-bg">
      <SublimeCard />
    </Frame>
  );
}
```

- **Versions** are the files in `iterations/`, `v01.tsx` to `vNN.tsx`. `_iterations.json` records each one's status
  (`exploring`, `shortlisted`, `rejected`, `selected`) and note. Exactly one is selected: the one a board shows.
- **Families** (`families.ts`) say what kind of visual it is and which formats it may take: project card, case study
  scene, feature art, identity. Every visual names one.
- **Collections** (`families.ts`) group visuals by the work they belong to, such as a case study, in the story's order.
- **Formats** (`lib/formats.ts`) are one shared library of named canvas sizes. A view never invents a size.
- **Frame** lays its children out on the format's exact pixel canvas and scales it to the space it is given; **Stage**
  is a frame with the composition centred and a margin, for a scene made for a page.

No new file types: every version is a view (`.tsx`), as the brief decides.

## Files

- `build.ts` validates every visual (family, collections, each version's format, one selection, records that match
  files) and the Snapshots list, and puts the index in the manifest as `contributions.visuals`. The published manifest
  carries it, so itspatmorgan.com reads the same list.
- `app.tsx` adds Visuals to the rail, the `/visuals` index (live tiles by collection, filtered with `?collection=`), and
  the front page board.
- `snapshots.ts` is the board: which visuals lead, in order, with each one's peek (line, title, summary, links).
- `node/record.ts` records a clip for a snapshot that needs one, the seed of the render service.

## Library

`@module/visuals` exports `FORMATS`, `formatOf`, `aspectOf`, `Frame`, `Stage` and `defineVisual`. While the module is
off, `lib/off.ts` serves the same exports, since nothing in them depends on Studio. There is no `detach.ts` yet, so
removing the module is refused while views import it.

## Upstream candidates

These platform changes were made in this studio for Visuals and Snapshots, and are candidates to send upstream once they hold up:

- **A board surface for views.** `src/platform/modules/view/type.ts` lists `visuals/board` in the view type's `embeds`, so a view can be hosted on the board this module declares.
- **Bare hosting.** `ArtifactHost` takes `chrome: 'frame' | 'bare'`. `bare` draws the artifact without the embed frame, for places where the visual is the whole tile.
- **A front page board slot.** A module app can declare `homeBoard`, drawn full width under the front page panel (`src/platform/app/modules.ts`, `src/platform/app/pages/home/Home.tsx`). The panel sits higher when a board is present.
- **Section items are prototypes when hosted.** `src/platform/app/artifacts/resolveArtifact.ts` decided a hosted artifact's scope with `isSectionKey`, so a view in a module's own section of prototype-shaped folders counted as system content and could not be embedded. It now uses `SYSTEM_CONTENT_KEY`, as the item page and the source editor do.
- **Not yet: `pnpm studio identify` for section items.** It accepts only `src/prototypes/<person>/<id>`, so visual folders have no folder-level `studioId` yet; they are addressed by folder name.
- **`withItems` in `#studio/data`.** Exported so a module can build an artifact origin for a view it finds through `allPrototypes`.
