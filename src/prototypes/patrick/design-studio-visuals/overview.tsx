/** @studio-id kqrkpnx85z1g6wjh */
import Card, { visual as cardVisual } from './card';
import Ask, { visual as ask } from './ask';
import Workspace, { visual as workspace } from './workspace';
import Range, { visual as range } from './range';
import Systems, { visual as systems } from './systems';
import Context, { visual as context } from './context';
import Share, { visual as share } from './share';

// Every visual of Design Studio on one page, in the product page's order: the snapshot first, then the hero and one per
// slide. Each is the live view, drawn at its format.
const SCENES = [
  { View: Ask, visual: ask },
  { View: Workspace, visual: workspace },
  { View: Range, visual: range },
  { View: Systems, visual: systems },
  { View: Context, visual: context },
  { View: Share, visual: share },
];

export default function Overview() {
  return (
    <main className="min-h-dvh bg-background px-4 py-10 text-foreground sm:px-8 lg:px-12">
      <header className="mx-auto mb-10 max-w-[1400px]">
        <div className="text-sm text-muted-foreground">Design Studio</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-balance">Building a design environment for people and agents</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          The visuals of Design Studio, live: the snapshot that leads the board, then the product page's hero and slides.
        </p>
      </header>
      <section className="mx-auto max-w-[1400px]">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Snapshot · {cardVisual.title}</h2>
        <div className="max-w-xl overflow-hidden rounded-2xl ring-1 ring-border/70">
          <Card />
        </div>
      </section>
      <section className="mx-auto mt-14 grid max-w-[1400px] grid-cols-1 gap-x-8 gap-y-12 lg:grid-cols-2">
        {SCENES.map(({ View, visual }, i) => (
          <figure key={visual.title}>
            <div className="overflow-hidden rounded-2xl ring-1 ring-border/70">
              <View />
            </div>
            <figcaption className="mt-3 flex gap-3 text-sm">
              <span className="tabular-nums text-muted-foreground">{i + 1}</span>
              <span className="font-medium">{visual.title}</span>
            </figcaption>
          </figure>
        ))}
      </section>
    </main>
  );
}
