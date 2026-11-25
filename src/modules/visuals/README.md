# Visuals

Brand and creative visuals in this studio, built here first and shaped to move upstream into Design Studio. The full
direction is the Visuals brief (Notion TASK-18). This build has the section, versions, families, collections, the index,
a visual's page of versions, its navigation, and Snapshots (the front page board). The media store, compare, select,
export and posters come later.

The interface grows out of Prototypes' rather than standing apart: the index is built like the Prototypes gallery, and a
visual opens in the prototype viewer, with Visuals' own file tree policy and a page of its versions where a prototype
would open its first view.

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
- `app.tsx` adds Visuals to the rail, the `/visuals` route, a visual's page and navigation, and the front page board.
- `VisualsIndex.tsx` is the index, on the Prototypes gallery's frame (title, a line, search on the right) but with one
  view, since it is a picture library: the visuals themselves in justified rows that keep each format's true shape,
  grouped by collection, with nothing around a visual but its name. Search (`?q=`) and one collection menu
  (`?collection=`) narrow it.
- `VisualPage.tsx` is what a version's address (`/visuals/<id>/iterations/v03`) shows, and `/visuals/<id>` opens the
  lead version. The file tree on the left is the list of versions; the page is a stage with that version large and
  playing (← and → step to its neighbours) and a details panel, collapsible from the header, with the version's status
  and note. Compare pins the version on stage, and the next version picked in the list or stepped to sits beside it.
  "Tune" opens the version in the ordinary viewer (`?mode=viewer`) with its DialKit dials, when it has any; "Iterate"
  copies a prompt for the agent to make the next version.
- `server.ts` is the route the panel saves through (`POST /__studio/visuals/record`): it changes one version's status or
  note in `_iterations.json`, for the visual's maintainers only, keeping every other entry as it is on disk, and moves
  the previous selection to shortlisted when another is selected.
- `nav.tsx` is the visual's file tree policy: `iterations/` and `exports/` are fixed and follow the working files,
  each version shows its status, and versions sort as on the page.
- **Performance.** Every live preview is mounted only near the screen and held still (the view module's still embeds)
  unless it is the one being looked at: the stage plays; index tiles play while pointed at; board tiles play while on
  screen and pause behind the peek.
- `Board.tsx` is Snapshots on the front page: justified rows
  where each tile grows by its format's aspect ratio, a spotlight on hover with the name following the pointer, and a
  peek that grows out of its tile once the live view has drawn; `shared.tsx` holds the live preview and origins.
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
- **A front page board slot.** A module app can declare `homeBoard`, which takes over the front page (`src/platform/app/modules.ts`, `src/platform/app/pages/home/Home.tsx`): the greeting and search become one row above the board, and the panel's lists stay in the ⌘K palette.
- **Section items are prototypes when hosted.** `src/platform/app/artifacts/resolveArtifact.ts` decided a hosted artifact's scope with `isSectionKey`, so a view in a module's own section of prototype-shaped folders counted as system content and could not be embedded. It now uses `SYSTEM_CONTENT_KEY`, as the item page and the source editor do.
- **Not yet: `pnpm studio identify` for section items.** It accepts only `src/prototypes/<person>/<id>`, so visual folders have no folder-level `studioId` yet; they are addressed by folder name.
- **A module's own item page and tree policy.** A module app can declare `sectionItem: { policy, landing, shows }`
  (`src/platform/app/modules.ts`). `PrototypeNav` uses `policy(base)` for that section's items, and the section item
  route shows `landing` at the item's own address instead of its first item (`src/platform/app/router.tsx`,
  `PrototypeLayout.tsx`). `shows(item)` names files whose address opens the landing too (Visuals: every version), and
  `?mode=viewer` opens such a file in the ordinary viewer instead, as `?mode=source` opens its source. Prototypes could
  use the same slot for a cover page.
- **Module records rebuild the manifest.** `ModuleBuild.records` names files a module's build reads inside items
  (`_iterations.json`); `src/platform/node/build/vite-manifest-watch-plugin.js` rebuilds the manifest when one changes,
  as it does for `meta.json`, so a status set by the app or an agent shows at once (`contributedRecords` in
  `src/platform/node/lib/module-builds.js`, the type in `src/platform/core/modules/index.ts`).
- **The front page with a board.** `Home.tsx` gives the first screen to the greeting and a large search over a faint dot
  field, and the board starts below it under a fade that lifts when you scroll.
- **Tree badges and order.** `FileTreePolicy` takes `arrange(nodes, context)` and `badge(item, context)`
  (`src/platform/app/files/FileTree.tsx`, `FileTreeContext` in `#studio/ui`), the brief's "item badges" and "policy
  ordering" hooks.
- **`withItems` in `#studio/data`.** Exported so a module can build an artifact origin for a view it finds through `allPrototypes`.
