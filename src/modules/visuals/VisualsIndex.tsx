// The /visuals index. It keeps the Prototypes gallery's frame (title, a line of what it is, search on the right) so the
// two read as one product, and lists what Prototypes lists: projects. A visual project is the work a set of pieces is for
// (a case study, a product, a series), and each tile is one project, drawn as its lead piece at that piece's true shape,
// in justified rows. Opening one opens the project, with its pieces and their versions in its navigation.
//
// Performance: a tile is drawn only while near the screen, and held still a moment after it draws, so a page of many
// projects costs about as much as a page of pictures. Pointing at one plays it.
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon, Search01Icon } from '@hugeicons/core-free-icons';
import { useManifest } from '#studio/data';
import { cn } from '#studio/runtime';
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '#studio/components';
import { Tiles, data, piecesOf, projectHref, useOrigins, useSize, useStable, type TileItem } from './shared.tsx';

export type IndexSearch = { q?: string };
export const validateIndexSearch = (search: Record<string, unknown>): IndexSearch =>
  typeof search.q === 'string' && search.q ? { q: search.q } : {};

function useSetSearch() {
  const navigate = useNavigate();
  return (next: IndexSearch, replace = false) =>
    void navigate({
      to: '/visuals' as never,
      search: ((current: IndexSearch) => validateIndexSearch({ ...current, ...next })) as never,
      replace,
    });
}

// The search box, as on the Prototypes gallery: short until used, wider while focused or holding a search.
function SearchBox({ value }: { value: string }) {
  const set = useSetSearch();
  return (
    <form
      role='search'
      onSubmit={e => e.preventDefault()}
      className={cn(
        'shrink-0 transition-[width] duration-200 ease-out motion-reduce:transition-none',
        value ? 'w-56' : 'w-36 focus-within:w-56',
      )}
    >
      <InputGroup>
        <InputGroupAddon>
          <HugeiconsIcon icon={Search01Icon} />
        </InputGroupAddon>
        <InputGroupInput
          name='q'
          inputMode='search'
          aria-label='Search visuals'
          placeholder='Search'
          value={value}
          onChange={e => set({ q: e.target.value }, true)}
        />
        {value && (
          <InputGroupAddon align='inline-end'>
            <InputGroupButton size='icon-xs' aria-label='Clear search' onClick={() => set({ q: '' }, true)}>
              <HugeiconsIcon icon={Cancel01Icon} />
            </InputGroupButton>
          </InputGroupAddon>
        )}
      </InputGroup>
    </form>
  );
}

export function VisualsIndex() {
  const manifest = useManifest();
  const index = data(manifest);
  const search = validateIndexSearch(useSearch({ strict: false }) as Record<string, unknown>);
  // Each project with its lead piece, the first in its order that has a version.
  const projects = (index?.projects ?? [])
    .map(project => ({ project, pieces: index ? piecesOf(index, project).filter(p => p.versions.length) : [] }))
    .filter(p => p.pieces.length)
    .sort((a, b) => a.project.title.localeCompare(b.project.title));
  const covers = useStable(projects.map(p => p.pieces[0]!));
  const origins = useOrigins(manifest, covers);
  const [area, { width }] = useSize<HTMLDivElement>();
  if (!index) return null;
  const q = (search.q ?? '').trim().toLowerCase();
  const shown = projects.filter(
    ({ project, pieces }) =>
      !q ||
      [project.title, project.id, project.line, ...pieces.map(p => p.title)].some(f => f.toLowerCase().includes(q)),
  );
  const pieceCount = projects.reduce((n, p) => n + p.pieces.length, 0);
  const items: TileItem[] = shown.map(({ project, pieces }) => {
    const open = pieces.filter(p => !p.selected).length;
    return {
      key: project.id,
      visual: pieces[0]!,
      href: projectHref(project.id),
      title: project.title,
      line: [
        project.line,
        `${pieces.length} ${pieces.length === 1 ? 'piece' : 'pieces'}`,
        open ? `${open} to decide` : '',
      ]
        .filter(Boolean)
        .join(' · '),
    };
  });
  return (
    <main className='mx-auto w-full max-w-5xl px-6 pt-12 pb-16'>
      <header className='mb-8'>
        <h1 className='text-2xl font-semibold tracking-tight text-foreground'>Visuals</h1>
        <div className='mt-0.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3'>
          <p className='min-w-0 truncate text-sm leading-8 text-muted-foreground'>
            {projects.length} projects, {pieceCount} pieces, each made better version by version.
          </p>
          <SearchBox value={search.q ?? ''} />
        </div>
      </header>
      <div ref={area}>
        {!items.length ? (
          <div className='py-16 text-center'>
            <p className='mb-2 text-lg font-semibold text-foreground'>No matches</p>
            <p className='mb-4 text-sm text-muted-foreground'>Try a different search.</p>
            <Link to={'/visuals' as never} className='text-sm text-primary hover:underline'>
              View all visuals
            </Link>
          </div>
        ) : (
          <Tiles items={items} origins={origins} width={width} row={260} />
        )}
      </div>
    </main>
  );
}
