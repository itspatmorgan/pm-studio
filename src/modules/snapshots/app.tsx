// Snapshots in the app: a feed of the studio's most compelling work at /snapshots, reached from its rail button. Nothing
// is made here; it's a view of snapshots.ts, read through the manifest (build.ts), and the website mirrors the same list.
import { createRoute } from '@tanstack/react-router';
import { PlayCircleIcon } from '@hugeicons/core-free-icons';
import type { ModuleApp } from '#studio/ui';
import { APP_NAME, contribution, useManifest } from '#studio/data';
import type { SnapshotsContribution } from './snapshots.ts';
import { SnapshotTile } from './SnapshotTile.tsx';

function Feed() {
  const manifest = useManifest();
  const entries = contribution<SnapshotsContribution>(manifest, 'snapshots')?.entries ?? [];
  return (
    <main className='w-full px-4 pt-6 pb-10 sm:px-6'>
      <h1 className='mb-4 px-1 text-sm font-medium text-muted-foreground'>Snapshots</h1>
      {entries.length ? (
        <div className='columns-1 gap-4 sm:columns-2 xl:columns-3'>
          {entries.map(entry => (
            <SnapshotTile key={entry.id} entry={entry} />
          ))}
        </div>
      ) : (
        <p className='px-1 text-sm text-muted-foreground'>No snapshots yet. Add one in src/modules/snapshots/snapshots.ts.</p>
      )}
    </main>
  );
}

export default {
  icon: PlayCircleIcon,
  rail: 'top',
  order: 35,
  routes: root => [
    createRoute({
      getParentRoute: () => root,
      path: 'snapshots',
      head: () => ({ meta: [{ title: `Snapshots — ${APP_NAME}` }] }),
      component: Feed,
    }),
  ],
} satisfies ModuleApp;
