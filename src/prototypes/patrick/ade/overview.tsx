/** @studio-id 3h97z7qn7gw92bgx */
import Card, { visual as cardVisual } from './card';
import MessageGap, { visual as gap } from './message-gap';
import JobReview, { visual as bet } from './job-review';
import Handoff, { visual as handoff } from './handoff';
import AutoAccepted, { visual as evidence } from './auto-accepted';
import AutomationConfig, { visual as limits } from './automation-config';
import AdeJobs, { visual as outcome } from './ade-jobs';

// Every visual of the ADÉ case study on one page, in the story's order: the snapshot first, then one per slide. Each is
// the live view, drawn at its format.
const SLIDES = [
  { View: MessageGap, visual: gap },
  { View: JobReview, visual: bet },
  { View: Handoff, visual: handoff },
  { View: AutoAccepted, visual: evidence },
  { View: AutomationConfig, visual: limits },
  { View: AdeJobs, visual: outcome },
];

export default function Overview() {
  return (
    <main className="min-h-dvh bg-background px-4 py-10 text-foreground sm:px-8 lg:px-12">
      <header className="mx-auto mb-10 max-w-[1400px]">
        <div className="text-sm text-muted-foreground">Sublime Security</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-balance">Giving a security agent the right amount of control</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
          The visuals of the ADÉ case study, live: the snapshot that leads the board, then one scene for each point the story makes.
        </p>
      </header>
      <section className="mx-auto max-w-[1400px]">
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">Snapshot · {cardVisual.title}</h2>
        <div className="max-w-xl overflow-hidden rounded-2xl ring-1 ring-border/70">
          <Card />
        </div>
      </section>
      <section className="mx-auto mt-14 grid max-w-[1400px] grid-cols-1 gap-x-8 gap-y-12 lg:grid-cols-2">
        {SLIDES.map(({ View, visual }, i) => (
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
