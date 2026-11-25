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

Nothing in `src/platform/` has changed for Visuals yet. Changes that later steps need are logged here as they land.
