/** @studio-id 6zehwjfdr89hsfzs */
import { Link } from '@module/prototypes';
import { cn } from '#studio/runtime';
import { SNAPSHOTS } from './_components/pieces';

// The other direction: Snapshots as a full-screen reel. One snapshot fills the screen at a time and the page snaps from
// one to the next as you scroll, with its title and first link along the bottom.
export default function SnapshotsReel() {
  return (
    <div className="h-dvh snap-y snap-mandatory overflow-y-auto bg-background text-foreground">
      {SNAPSHOTS.map(({ id, Visual, title, line, aspect, links }) => {
        const wide = id === 'pattern-engine' || id === 'pixel-wave' || id === 'pixel-mark';
        const first = links[0]!;
        return (
          <section key={id} aria-label={title} className="relative flex h-dvh snap-start items-center justify-center p-4 pb-24 sm:p-10 sm:pb-28">
            <div className={cn('relative w-full overflow-hidden rounded-2xl ring-1 ring-border/60', wide ? 'h-full' : cn('max-w-[72rem]', aspect))}>
              <Visual peek />
            </div>
            <div className="absolute inset-x-4 bottom-6 flex items-end justify-between gap-4 sm:inset-x-10 sm:bottom-8">
              <div className="min-w-0">
                <div className="text-sm text-muted-foreground">{line}</div>
                <div className="truncate text-lg font-semibold tracking-tight">{title}</div>
              </div>
              {first.external ? (
                <a href={first.to} target="_blank" rel="noreferrer" className="shrink-0 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background">
                  {first.label} ↗
                </a>
              ) : (
                <Link to={first.to} className="shrink-0 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background">
                  {first.label} →
                </Link>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
