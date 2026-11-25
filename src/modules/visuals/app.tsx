// Visuals in the app: the /visuals index (built like the Prototypes gallery), and Snapshots, the board of the visuals the
// studio leads with, across the front page below the search. Visuals open like prototypes at /visuals/<id>, through the
// platform's section routes: on their page of versions (VisualPage.tsx), with Visuals' file tree policy (nav.tsx).
import { createRoute } from '@tanstack/react-router';
import { Image02Icon } from '@hugeicons/core-free-icons';
import type { ModuleApp } from '#studio/ui';
import { APP_NAME } from '#studio/data';
import { Board } from './Board.tsx';
import { VisualsIndex, validateIndexSearch } from './VisualsIndex.tsx';
import { VisualPage } from './VisualPage.tsx';
import { visualPolicy } from './nav.tsx';

export default {
  icon: Image02Icon,
  rail: 'top',
  order: 5,
  routes: root => [
    createRoute({
      getParentRoute: () => root,
      path: 'visuals',
      validateSearch: validateIndexSearch,
      head: () => ({ meta: [{ title: `Visuals — ${APP_NAME}` }] }),
      component: VisualsIndex,
    }),
  ],
  homeBoard: Board,
  // A visual opens on its page of versions, and its navigation knows its standard folders and each version's status.
  // Its versions open on that page too, so the navigation is the page's list of versions.
  sectionItem: { policy: visualPolicy, landing: VisualPage, shows: item => item.path.startsWith('iterations/') },
} satisfies ModuleApp;
