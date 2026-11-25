// The /visuals index: every visual with a selected version, live, grouped by collection in each collection's order.
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { useManifest, type ArtifactContext } from '#studio/data';
import { cn } from '#studio/runtime';
import { Live, data, sizeOf, useNear, useOrigins, useSize, useStable, versionHref } from './shared.tsx';
import type { VisualEntry, VisualsContribution } from './visuals.ts';

// ——— The index: every visual, by collection ———

function IndexTile({ visual, origin, families }: { visual: VisualEntry; origin?: ArtifactContext; families: VisualsContribution['families'] }) {
  const [box, { width }] = useSize<HTMLDivElement>();
  const near = useNear(box);
  const { width: w, height: h } = sizeOf(visual);
  return (
    <Link to={versionHref(visual) as never} className='group block break-inside-avoid outline-none'>
      <div
        ref={box}
        className='overflow-hidden rounded-xl bg-card ring-1 ring-border transition-shadow duration-300 group-hover:ring-foreground/25 group-focus-visible:ring-2 group-focus-visible:ring-ring'
        style={{ aspectRatio: `${w} / ${h}` }}
      >
        {near && <Live visual={visual} origin={origin} width={width} height={(width * h) / w} />}
      </div>
      <div className='mt-2.5 mb-8 flex items-baseline justify-between gap-3 px-0.5'>
        <span className='text-sm font-medium text-pretty text-foreground'>{visual.title}</span>
        <span className='shrink-0 text-xs text-muted-foreground'>{families.find(f => f.id === visual.family)?.label}</span>
      </div>
    </Link>
  );
}

export function VisualsIndex() {
  const manifest = useManifest();
  const index = data(manifest);
  const search = useSearch({ strict: false }) as { collection?: string };
  const navigate = useNavigate();
  const shown = useStable((index?.visuals ?? []).filter(v => v.selected));
  const origins = useOrigins(manifest, shown);
  if (!index) return null;
  const groups = index.collections
    .map(c => {
      const rank = (v: VisualEntry) => (c.order?.includes(v.id) ? c.order.indexOf(v.id) : Infinity);
      return { collection: c, visuals: shown.filter(v => v.collections.includes(c.id)).sort((a, b) => rank(a) - rank(b)) };
    })
    .filter(g => g.visuals.length && (!search.collection || g.collection.id === search.collection));
  const loose = search.collection ? [] : shown.filter(v => !v.collections.length);
  const chip = (active: boolean) =>
    cn(
      'h-8 rounded-full px-3.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
      active ? 'bg-foreground text-background' : 'text-muted-foreground ring-1 ring-border hover:bg-muted hover:text-foreground',
    );
  const pick = (collection?: string) => void navigate({ to: '/visuals' as never, search: (collection ? { collection } : {}) as never });
  return (
    <main className='mx-auto w-full max-w-[1400px] px-4 pt-10 pb-20 sm:px-8'>
      <header className='mb-8'>
        <h1 className='text-2xl font-semibold tracking-tight text-foreground'>Visuals</h1>
        <p className='mt-1 text-sm text-muted-foreground'>
          {shown.length} visuals, each drawn live at its format. Open one to see its versions.
        </p>
      </header>
      <nav aria-label='Collections' className='mb-10 flex flex-wrap gap-2'>
        <button type='button' className={chip(!search.collection)} onClick={() => pick()}>
          All
        </button>
        {index.collections
          .filter(c => shown.some(v => v.collections.includes(c.id)))
          .map(c => (
            <button key={c.id} type='button' className={chip(search.collection === c.id)} onClick={() => pick(c.id)}>
              {c.label}
            </button>
          ))}
      </nav>
      {groups.map(({ collection, visuals }) => (
        <section key={collection.id} className='mb-14'>
          <div className='mb-4 flex items-baseline gap-3'>
            <h2 className='text-base font-semibold tracking-tight text-foreground'>{collection.label}</h2>
            <span className='text-sm text-muted-foreground'>{collection.line}</span>
          </div>
          <div className='columns-1 gap-6 sm:columns-2 xl:columns-3'>
            {visuals.map(v => (
              <IndexTile key={v.id} visual={v} origin={origins[v.id]} families={index.families} />
            ))}
          </div>
        </section>
      ))}
      {loose.length > 0 && (
        <section className='mb-14'>
          <h2 className='mb-4 text-base font-semibold tracking-tight text-foreground'>Other visuals</h2>
          <div className='columns-1 gap-6 sm:columns-2 xl:columns-3'>
            {loose.map(v => (
              <IndexTile key={v.id} visual={v} origin={origins[v.id]} families={index.families} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
