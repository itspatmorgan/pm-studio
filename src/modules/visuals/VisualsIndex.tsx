// The /visuals index. It keeps the Prototypes gallery's frame (title, a line of what it is, search on the right) so the
// two read as one product, but it is a picture library, so it has one view: the visuals themselves, in justified rows
// that keep every format's true shape, grouped by collection. Nothing sits around a visual but its name.
//
// Performance: a visual is drawn only while its tile is near the screen, and held still a moment after it draws, so a
// page of many visuals costs about as much as a page of pictures. Pointing at one plays it.
import { useState } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowDown01Icon, Cancel01Icon, Search01Icon } from '@hugeicons/core-free-icons';
import { useManifest, type ArtifactContext } from '#studio/data';
import { cn } from '#studio/runtime';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '#studio/components';
import { Live, data, justify, sizeOf, useNear, useOrigins, useSize, useStable, visualHref } from './shared.tsx';
import type { VisualEntry, VisualsContribution } from './visuals.ts';

export type IndexSearch = { q?: string; collection?: string };
export const validateIndexSearch = (search: Record<string, unknown>): IndexSearch =>
  Object.fromEntries(
    (['q', 'collection'] as const).flatMap(key =>
      typeof search[key] === 'string' && search[key] ? [[key, search[key]]] : [],
    ),
  );

const GAP = 16;
const ROW = 230;

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

// One control for narrowing the library: which collection. The rest (family, status) waits until the library is big
// enough to need it.
function CollectionMenu({ index, value, visuals }: { index: VisualsContribution; value?: string; visuals: VisualEntry[] }) {
  const set = useSetSearch();
  const options = index.collections.filter(c => visuals.some(v => v.collections.includes(c.id)));
  const current = options.find(c => c.id === value);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant='outline' className='gap-1.5' />}>
        {current?.label ?? 'All collections'}
        <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden className='text-muted-foreground' />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-56'>
        <DropdownMenuRadioGroup value={value ?? ''} onValueChange={next => set({ collection: next as string })}>
          <DropdownMenuRadioItem value=''>All collections</DropdownMenuRadioItem>
          {options.map(c => (
            <DropdownMenuRadioItem key={c.id} value={c.id}>
              {c.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// One visual: the picture at its own shape, and its name under it. It plays while pointed at or focused.
function Tile({
  visual,
  origin,
  width,
  height,
  family,
}: {
  visual: VisualEntry;
  origin?: ArtifactContext;
  width: number;
  height: number;
  family?: string;
}) {
  const [box] = useSize<HTMLDivElement>();
  const near = useNear(box, { release: true });
  const [playing, setPlaying] = useState(false);
  const versions = visual.versions.length;
  return (
    <Link
      to={visualHref(visual) as never}
      onPointerEnter={() => setPlaying(true)}
      onPointerLeave={() => setPlaying(false)}
      onFocus={() => setPlaying(true)}
      onBlur={() => setPlaying(false)}
      className='group block shrink-0 outline-none'
      style={{ width }}
    >
      <div
        ref={box}
        className='overflow-hidden rounded-[10px] bg-muted/50 ring-1 ring-foreground/[0.07] transition-[box-shadow] duration-200 group-hover:ring-foreground/20 group-focus-visible:ring-2 group-focus-visible:ring-ring'
        style={{ height }}
      >
        {near && <Live visual={visual} origin={origin} width={width} height={height} still={!playing} />}
      </div>
      <div className='mt-2 min-w-0 px-0.5'>
        <div className='truncate text-[13px] leading-5 font-medium text-foreground'>{visual.title}</div>
        <div className='truncate text-xs leading-5 text-muted-foreground'>
          {family}
          {versions > 1 && ` · ${versions} versions`}
          {!visual.selected && ' · Needs a decision'}
        </div>
      </div>
    </Link>
  );
}

function Rows({
  visuals,
  origins,
  width,
  familyOf,
}: {
  visuals: VisualEntry[];
  origins: Record<string, ArtifactContext>;
  width: number;
  familyOf: (v: VisualEntry) => string | undefined;
}) {
  if (!width) return null;
  const aspect = (v: VisualEntry) => sizeOf(v).width / sizeOf(v).height;
  return (
    <div className='flex flex-col gap-6'>
      {justify(visuals, aspect, width, GAP, ROW).map(row => (
        <div key={row.items[0]!.id} className='flex' style={{ gap: GAP }}>
          {row.items.map(v => (
            <Tile
              key={v.id}
              visual={v}
              origin={origins[v.id]}
              width={row.height * aspect(v)}
              height={row.height}
              family={familyOf(v)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function VisualsIndex() {
  const manifest = useManifest();
  const index = data(manifest);
  const search = validateIndexSearch(useSearch({ strict: false }) as Record<string, unknown>);
  const all = useStable(index?.visuals.filter(v => v.versions.length) ?? []);
  const origins = useOrigins(manifest, all);
  const [area, { width }] = useSize<HTMLDivElement>();
  if (!index) return null;
  const familyOf = (v: VisualEntry) => index.families.find(f => f.id === v.family)?.label;
  const q = (search.q ?? '').trim().toLowerCase();
  const matches = (v: VisualEntry) =>
    !q ||
    [v.title, v.id, familyOf(v), ...v.collections.map(id => index.collections.find(c => c.id === id)?.label)].some(f =>
      f?.toLowerCase().includes(q),
    );
  const shown = all.filter(v => matches(v) && (!search.collection || v.collections.includes(search.collection)));
  // By collection, each in its own story order.
  const groups = [
    ...index.collections.map(c => ({
      key: c.id,
      label: c.label,
      line: c.line,
      visuals: shown
        .filter(v => v.collections.includes(c.id))
        .sort((a, b) => (c.order?.indexOf(a.id) ?? 0) - (c.order?.indexOf(b.id) ?? 0)),
    })),
    { key: 'other', label: 'Other visuals', line: undefined, visuals: shown.filter(v => !v.collections.length) },
  ].filter(g => g.visuals.length && (!search.collection || g.key === search.collection));
  return (
    <main className='mx-auto w-full max-w-5xl px-6 pt-12 pb-16'>
      <header className='mb-8'>
        <h1 className='text-2xl font-semibold tracking-tight text-foreground'>Visuals</h1>
        <div className='mt-0.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3'>
          <p className='min-w-0 truncate text-sm leading-8 text-muted-foreground'>
            {all.length} visuals for the work, each with its versions.
          </p>
          <div className='flex flex-wrap items-center gap-2'>
            <SearchBox value={search.q ?? ''} />
            <CollectionMenu index={index} value={search.collection} visuals={all} />
          </div>
        </div>
      </header>
      <div ref={area}>
        {!groups.length ? (
          <div className='py-16 text-center'>
            <p className='mb-2 text-lg font-semibold text-foreground'>No matches</p>
            <p className='mb-4 text-sm text-muted-foreground'>Try a different search.</p>
            <Link to={'/visuals' as never} className='text-sm text-primary hover:underline'>
              View all visuals
            </Link>
          </div>
        ) : (
          groups.map((g, i) => (
            <section key={g.key} className={i ? 'mt-12' : ''}>
              <h2 className='mb-4 flex items-baseline gap-2 text-sm font-semibold text-foreground'>
                {g.label}
                {g.line && <span className='font-normal text-muted-foreground'>{g.line}</span>}
              </h2>
              <Rows visuals={g.visuals} origins={origins} width={width} familyOf={familyOf} />
            </section>
          ))
        )}
      </div>
    </main>
  );
}
