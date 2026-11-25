// The app's front page: a greeting, a search field, and under them one small panel of what each module chooses to show
// (its `overview`, src/platform/app/modules.ts). The panel is narrow and centred, so it reads as a welcome rather
// than a page to fill, and stays comfortable in the narrow window an agent's harness gives the app. The modules decide
// what is worth showing and in what order, so a module added to the app can put something here with no change to this file.
// A module whose contribution is visual (its `homeBoard`) changes the page: the greeting and a larger search take the
// first screen, the board follows below them, and the panel's lists stay in the palette.
//
// While you run the app locally it greets you and puts your own work first. The deployed site doesn't know who is
// looking, so it names the app, adds the tagline from studio.config.json, and puts what colleagues come for first.
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { getRouteApi, Link } from '@tanstack/react-router';
import { cn } from '#studio/runtime';
import { HugeiconsIcon } from '@hugeicons/react';
import { Search01Icon } from '@hugeicons/core-free-icons';
import { Card } from '@/platform/systems/studio/components/card';
import { APP_NAME, TAGLINE } from '@/platform/app/data/config';
import { homeApps, moduleApps, sectionPath } from '@/platform/app/modules';
import { useMyName } from '@/platform/app/data/files';
import { useOpenPalette } from '@/platform/app/shell/paletteContext';

const rootApi = getRouteApi('__root__');
// The front page's search works in place (CommandPaletteDialog.tsx), loaded with the palette's list as the page opens.
const loadSearch = () => import('@/platform/app/shell/CommandPaletteDialog');
const InlineSearch = lazy(() => loadSearch().then(m => ({ default: m.InlineSearch })));

export default function Home() {
  const manifest = rootApi.useLoaderData();
  const openPalette = useOpenPalette();
  const local = import.meta.env.DEV;
  // Until the dev server says who you are the heading is blank, so it doesn't change under you.
  const name = useMyName();
  const first = name?.split(' ')[0];
  const heading = name === undefined ? '\u00a0' : first ? `Welcome back, ${first}` : APP_NAME;
  const boards = homeApps(local, 'homeBoard');
  // Whether the page is scrolled to its top, which a marker at the top of the page tells, whatever element scrolls.
  const top = useRef<HTMLSpanElement>(null);
  const [atTop, setAtTop] = useState(true);
  useEffect(() => {
    const el = top.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => entry && setAtTop(entry.isIntersecting), {
      rootMargin: '-40px 0px 0px 0px',
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [boards.length]);
  useEffect(() => {
    if (boards.length) void loadSearch();
  }, [boards.length]);
  // The search opens the ⌘K palette, the search every page has, put where a first-time visitor will see it.
  // Custom on purpose: the stock Button and Kbd looked like a control placed in the panel.
  const search = (className: string) => (
    <button
      type='button'
      onClick={openPalette}
      className={cn(
        'flex h-11 w-full items-center gap-2.5 px-4 text-left text-sm text-muted-foreground transition-colors outline-none hover:bg-muted/50 focus-visible:bg-muted/50',
        className,
      )}
    >
      <HugeiconsIcon icon={Search01Icon} size={16} />
      <span className='flex-1'>Search the studio</span>
      <kbd className='rounded border border-border px-1.5 py-0.5 font-sans text-[11px] leading-none'>⌘K</kbd>
    </button>
  );
  // With a board, the front page is a welcome first and a gallery second, like an assistant's home. The first screen is
  // the greeting, one large search that works in place, and under it a row of ways in (each section on the rail), all
  // centred a little above the middle over a faint dot field. The board starts just below, its first row showing under a
  // fade so the page asks to be scrolled. The fade lifts once you do.
  if (boards.length) {
    const field =
      'h-14 rounded-2xl bg-background px-5 text-[15px] ring-1 ring-border shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_24px_-12px_rgb(0_0_0/0.12)] transition-shadow focus-within:ring-2 focus-within:ring-ring hover:ring-foreground/20';
    const places = moduleApps.filter(({ app }) => app.rail === 'top');
    return (
      <div className='relative w-full'>
        <section className='relative isolate z-10 flex min-h-[56svh] flex-col items-center justify-center px-5 pt-12 pb-10'>
          <div
            aria-hidden
            className='pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(var(--border)_1px,transparent_1.5px)] bg-[size:22px_22px] [mask-image:radial-gradient(ellipse_50%_58%_at_50%_46%,black_15%,transparent_72%)]'
          />
          <span ref={top} aria-hidden className='absolute top-0 h-20 w-px' />
          <h1 className='text-center text-[30px] leading-tight font-semibold tracking-tight text-balance text-foreground sm:text-[38px]'>
            {heading}
          </h1>
          {!local && TAGLINE && <p className='mt-2 text-center text-[15px] text-muted-foreground'>{TAGLINE}</p>}
          <div className='mt-8 w-full max-w-[600px]'>
            <Suspense
              fallback={
                <div className={cn('flex items-center gap-2.5 text-muted-foreground', field)}>
                  <HugeiconsIcon icon={Search01Icon} size={16} />
                  Search the studio
                </div>
              }
            >
              <InlineSearch className={field} placeholder='Search the studio' />
            </Suspense>
          </div>
          <nav aria-label='Sections' className='mt-4 flex flex-wrap justify-center gap-2'>
            {places.map(({ spec, app }) => (
              <Link
                key={spec.id}
                to={sectionPath(spec) as never}
                className='flex h-8 items-center gap-1.5 rounded-full bg-background px-3 text-[13px] text-muted-foreground ring-1 ring-border transition-colors outline-none hover:text-foreground hover:ring-foreground/20 focus-visible:ring-2 focus-visible:ring-ring'
              >
                <HugeiconsIcon icon={app.icon} size={14} />
                {app.navLabel ?? spec.label}
              </Link>
            ))}
          </nav>
        </section>
        {boards.map(({ spec, app }) => app.homeBoard && <app.homeBoard key={spec.id} manifest={manifest} />)}
        <div
          aria-hidden
          className={cn(
            'pointer-events-none sticky bottom-0 -mt-40 h-40 bg-[linear-gradient(to_top,var(--background),transparent)] transition-opacity duration-500',
            atTop ? 'opacity-100' : 'opacity-0',
          )}
        />
      </div>
    );
  }
  return (
    <main className='mx-auto w-full max-w-xl px-4 pt-[12vh] pb-10'>
      <header className='mb-6'>
        <h1 className='text-center text-2xl font-semibold tracking-tight text-foreground'>{heading}</h1>
        {!local && TAGLINE && <p className='mt-1.5 text-center text-sm text-muted-foreground'>{TAGLINE}</p>}
      </header>
      <Card className='gap-0 py-0 pb-1'>
        {/* The panel's first row is its search: one piece of the panel, flush with its edges and divided from the sections by a line,
            not a field set inside it. */}
        {search('border-b border-border')}
        {/* A little more space under the search than between sections, so the top of the list is as far from the line as the bottom is from the edge. */}
        <div className='pt-1.5'>
          {homeApps(local, 'overview').map(
            ({ spec, app }) => app.overview && <app.overview key={spec.id} manifest={manifest} />,
          )}
        </div>
      </Card>
    </main>
  );
}
