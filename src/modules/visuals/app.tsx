// Visuals in the app: the /visuals index of projects (built like the Prototypes gallery), and Snapshots, the board of the
// pieces the studio leads with, across the front page below the search. A project opens like a prototype at
// /visuals/<project>, through the platform's section routes: on its page (VisualPage.tsx), with Visuals' file tree
// policy (nav.tsx).
import { createRoute } from '@tanstack/react-router';
import { Image02Icon } from '@hugeicons/core-free-icons';
import type { ModuleApp } from '#studio/ui';
import { APP_NAME } from '#studio/data';
import { Board } from './Board.tsx';
import { VisualsIndex, validateIndexSearch } from './VisualsIndex.tsx';
import { VisualPage } from './VisualPage.tsx';
import { SelectedRow, visualPolicy } from './nav.tsx';

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
  // A project opens on Selected, the version picked for each piece, which has its own row at the top of the navigation;
  // the pieces follow, one row each. A version opens on the same page, on its piece's stage.
  sectionItem: {
    policy: visualPolicy,
    navTop: SelectedRow,
    landing: VisualPage,
    shows: item => /^[a-z0-9-]+\/v\d{2,}\.tsx$/.test(item.path) },
} satisfies ModuleApp;
