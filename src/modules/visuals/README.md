# Visuals

Brand and creative visuals in this studio, built here first and shaped to move upstream into Design Studio. The full
direction is the Visuals brief (Notion TASK-18). This build has the section, projects, pieces and their versions,
families, the index, a project's page, a piece's page of versions, the navigation, and Snapshots (the front page board).
The media store, export and posters come later.

The interface grows out of Prototypes' rather than standing apart: the index is built like the Prototypes gallery, and a
project opens in the prototype viewer, with Visuals' own file tree policy and a page of its pieces where a prototype
would open its first view.

## The model: project, piece, version

- A **project** is the work a set of visuals is for: a case study, a product, a series. It is the folder, the thing the
  index lists, and the place for what its pieces share (a brief, sources, exports). It opens at `/visuals/<project>`.
- A **piece** is one visual in the project, drawn at one format, such as a case study's card or one of its scenes. It
  is a folder of its versions, declared in the project's `meta.json` with its title and family, in the project's order.
- A **version** is one file in a piece, `v01.tsx` to `vNN.tsx`: a view. At most one per piece is selected, the one a
  board shows. It opens at `/visuals/<project>/<piece>/v03`.

A project of one piece is fine; its address opens the piece.

```
src/visuals/ade/
  meta.json            title, line, systemId, maintainers, pieces: [{ id, title, family }] in order
  _iterations.json     each version's status and note, keyed by the view's permanent id
  card/
    v01.tsx            a version: a view drawn at a format
  message-gap/
    v01.tsx
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

- **Status** in `_iterations.json`: `exploring`, `shortlisted`, `rejected` or `selected`, and a note.
- **Families** (`families.ts`) say what kind of piece it is and which formats it may take: project card, case study
  scene, feature art, identity. Every piece names one.
- **Formats** (`lib/formats.ts`) are one shared library of named canvas sizes. A view never invents a size.
- **Frame** lays its children out on the format's exact pixel canvas and scales it to the space it is given; **Stage**
  is a frame with the composition centred and a margin, for a scene made for a page.

No new file types: every version is a view (`.tsx`), as the brief decides.

## Files

- `build.ts` validates every project (its pieces, each piece's family, each version's format, one selection per piece,
  records that match files) and the Snapshots list, and puts the index in the manifest as `contributions.visuals`. The published manifest
  carries it, so itspatmorgan.com reads the same list.
- `app.tsx` adds Visuals to the rail, the `/visuals` route, a project's page and navigation, and the front page board.
- `VisualsIndex.tsx` is the index, on the Prototypes gallery's frame (title, a line, search on the right) and listing
  what Prototypes lists: projects, one tile each, drawn as its lead piece at that piece's true shape in justified rows,
  with its name and line under it. Search (`?q=`) matches projects and their pieces.
- `VisualPage.tsx` is a project's page. At `/visuals/<project>` it shows Selected: the version picked for each piece, in
  the project's order, then the pieces with no pick yet under "To decide", each at its newest version. It has its own
  row at the top of the navigation, so it's a place, not a hidden landing; a project of one piece opens that piece. At
  a version's address (`/visuals/<project>/<piece>/v03`) it shows that piece in one column of three layers, each
  answering one question: the header names the piece (project, family, format); the stage plays the version (← and →
  step through versions); the Versions panel under it holds everything about versions. Its first line has Compare and
  the fold; open, the film strip picks a version, and beside it the version on stage has its status (a menu), Tune
  (the ordinary viewer, `?mode=viewer`, with its DialKit dials, when it has any), the note, and "Ask for vNN", which
  copies a prompt with the note for the agent. Folded, the line still names the version and its status. Compare pins
  the version on stage, and the next one picked sits beside it.
- `server.ts` is the route the panel saves through (`POST /__studio/visuals/record`): it changes one version's status or
  note in the project's `_iterations.json`, for its maintainers only, keeping every other entry as it is on disk, and
  moves the piece's previous selection to shortlisted when another is selected.
- `nav.tsx` is the project's navigation: the Selected row on top (`navTop`), then the file tree policy, under the
  heading "Pieces": the pieces come first in the project's order, one row each named for
  its folder (the folder bundles its versions, and its row opens the lead one and stays lit on any of them), then the
  project's own files, then `exports/`. Piece folders and `exports/` can't be renamed or moved from the tree. The
  piece page's film strip lists the versions.
- **Performance.** Every live preview is mounted only near the screen and held still (the view module's still embeds)
  unless it is the one being looked at: the stage plays; index tiles play while pointed at; board tiles play while on
  screen and pause behind the peek.
- `Board.tsx` is Snapshots on the front page: justified rows
  where each tile grows by its format's aspect ratio, its name in the corner, a soft spotlight on hover, and a
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
- **Tree badges, order and bundled folders.** `FileTreePolicy` takes `arrange(nodes, context)` and `badge(item, context)`;
  `bundleItem` also gets the context, `bundleLabel(node)` names a bundled folder's row for the folder, and `heading`
  replaces "Artifacts" over the list (`src/platform/app/files/FileTree.tsx`, `FileTreeContext` in `#studio/ui`), the brief's "item badges" and "policy
  ordering" hooks.
- **Rows above a section item's files.** `ModuleApp.sectionItem.navTop` renders a module's own rows between the
  prototype header and the file tree (`PrototypeNav.tsx`), so a landing such as Selected has a row of its own.
- **`withItems` in `#studio/data`.** Exported so a module can build an artifact origin for a view it finds through `allPrototypes`.
