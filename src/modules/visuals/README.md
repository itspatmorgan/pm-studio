# Visuals

The foundation for brand and creative visuals in this studio, built here first and shaped to move upstream into Design
Studio. The full direction is the Visuals brief (Notion TASK-18); this is its first slice, pulled forward for Snapshots.

## A visual is a view drawn at a format

A visual is an ordinary view whose module also exports `visual`:

```tsx
import { Frame, defineVisual } from '@module/visuals';
import { SublimeCard } from '@/systems/website/components/sublime';

export const visual = defineVisual({ format: 'board-card', title: 'ADÉ, auto-accepted' });

export default function AdeCard() {
  return (
    <Frame format={visual.format}>
      <SublimeCard />
    </Frame>
  );
}
```

- **Formats** (`lib/formats.ts`) are one shared library of named canvas sizes: channel formats (share card, slide, social
  post) and board formats (the Snapshots tile shapes). A view never invents a size.
- **Frame** lays its children out on the format's exact pixel canvas and scales the canvas to the space it is given, so
  the composition is identical in a tile, a peek, the website, and an export.
- **defineVisual** records the format, the title, and for moving visuals the loop length and the still moment, which a
  board and the render service read.

No new file types: every visual is a view (`.tsx`), as the brief decides.

## Library

`@module/visuals` exports `FORMATS`, `formatOf`, `aspectOf`, `Frame`, and `defineVisual`. While the module is off,
`lib/off.ts` serves the same exports, since nothing in them depends on Studio. There is no `detach.ts` yet, so removing
the module is refused while views import it.

## Upstream candidates

These platform changes were made in this studio for Visuals and Snapshots, and are candidates to send upstream once they hold up:

- **A board surface for views.** `src/platform/modules/view/type.ts` lists `visuals/board` in the view type's `embeds`, so a view can be hosted on the board this module declares.
- **Bare hosting.** `ArtifactHost` takes `chrome: 'frame' | 'bare'`. `bare` draws the artifact without the embed frame, for places where the visual is the whole tile.
- **A front page board slot.** A module app can declare `homeBoard`, drawn full width under the front page panel (`src/platform/app/modules.ts`, `src/platform/app/pages/home/Home.tsx`). The panel sits higher when a board is present.
- **`withItems` in `#studio/data`.** Exported so a module can build an artifact origin for a view it finds through `allPrototypes`.
