// Featured work in the app: the bento grid at /featured, a button for it on the rail, and a row of the first few pieces
// on the front page. The list itself is featured.ts, read through the manifest (build.ts).
import { createRoute } from '@tanstack/react-router';
import { StarIcon } from '@hugeicons/core-free-icons';
import { HomeSection, type ModuleApp } from '#studio/ui';
import { APP_NAME, contribution, useManifest, type Manifest } from '#studio/data';
import type { FeaturedContribution } from './featured.ts';
import { Tile } from './Tile.tsx';

const entries = (manifest: Manifest) => contribution<FeaturedContribution>(manifest, 'featured')?.entries ?? [];

function Page() {
  const manifest = useManifest();
  const list = entries(manifest);
  return (
    <main className='mx-auto w-full max-w-5xl px-6 pt-12 pb-8'>
      <header className='mb-6'>
        <h1 className='text-2xl font-semibold tracking-tight text-foreground'>Featured work</h1>
        <p className='mt-1 text-sm leading-relaxed text-muted-foreground'>A few pieces from this studio. Open one to try it.</p>
      </header>
      {list.length ? (
        <div className='grid auto-rows-[minmax(14rem,auto)] grid-cols-1 gap-4 sm:grid-cols-4'>
          {list.map(entry => (
            <Tile key={entry.id} entry={entry} />
          ))}
        </div>
      ) : (
        <p className='text-sm text-muted-foreground'>Nothing is featured yet. Add a piece in src/modules/featured/featured.ts.</p>
      )}
    </main>
  );
}

// The front page shows the first three, as a way into the work, with the heading linking to the whole grid.
function Overview({ manifest }: { manifest: Manifest }) {
  const list = entries(manifest).slice(0, 3);
  if (!list.length) return null;
  return (
    <HomeSection title='Featured work' to='/featured'>
      <div className='grid grid-cols-1 gap-3 px-2 pt-1 sm:grid-cols-3'>
        {list.map(entry => (
          <Tile key={entry.id} entry={entry} compact />
        ))}
      </div>
    </HomeSection>
  );
}

export default {
  icon: StarIcon,
  rail: 'top',
  order: 5,
  homeOrder: { local: 50, deployed: 5 },
  overview: Overview,
  routes: root => [
    createRoute({
      getParentRoute: () => root,
      path: 'featured',
      head: () => ({ meta: [{ title: `Featured work — ${APP_NAME}` }] }),
      component: Page,
    }),
  ],
} satisfies ModuleApp;
