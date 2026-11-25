// Visuals in the app: the /visuals index (every visual, live, by collection), and Snapshots, the board of the visuals
// the studio leads with, across the front page below the search. Visuals open like prototypes at /visuals/<id>, through
// the platform's section routes.
import { createRoute } from '@tanstack/react-router';
import { Image02Icon } from '@hugeicons/core-free-icons';
import type { ModuleApp } from '#studio/ui';
import { APP_NAME } from '#studio/data';
import { Board } from './Board.tsx';
import { VisualsIndex } from './VisualsIndex.tsx';

export default {
  icon: Image02Icon,
  rail: 'top',
  order: 5,
  routes: root => [
    createRoute({
      getParentRoute: () => root,
      path: 'visuals',
      validateSearch: (search: Record<string, unknown>) =>
        typeof search.collection === 'string' ? { collection: search.collection } : {},
      head: () => ({ meta: [{ title: `Visuals — ${APP_NAME}` }] }),
      component: VisualsIndex,
    }),
  ],
  homeBoard: Board,
} satisfies ModuleApp;
