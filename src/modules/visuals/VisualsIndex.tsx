// The /visuals index, built like the Prototypes gallery so the two read as one product: the same header with search,
// filters and the cards or list switch, and the same grid and rows. A card shows the visual on a mat at a fixed shape, so
// visuals of any format line up; until the render service draws posters, the picture is the visual itself, drawn live
// only while its card is on screen. Filters and grouping live in the address, so a filtered index is a link.
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { HugeiconsIcon } from '@hugeicons/react';
import { Cancel01Icon, FilterIcon, Image02Icon, Search01Icon } from '@hugeicons/core-free-icons';
import { useManifest, type ArtifactContext } from '#studio/data';
import { cn } from '#studio/runtime';
import { Collection, ItemRow, ViewToggle } from '#studio/ui';
import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '#studio/components';
import { Live, data, sizeOf, useNear, useOrigins, useSize, useStable, visualHref } from './shared.tsx';
import type { VisualEntry, VisualsContribution } from './visuals.ts';

export type IndexSearch = { q?: string; family?: string; collection?: string; status?: string; group?: string };
export const validateIndexSearch = (search: Record<string, unknown>): IndexSearch =>
  Object.fromEntries(
    (['q', 'family', 'collection', 'status', 'group'] as const).flatMap(key =>
      typeof search[key] === 'string' && search[key] ? [[key, search[key]]] : [],
    ),
  );

// Where a visual stands, for the status filter: it has a selected version, or it is waiting on a decision.
const STATUS_FILTERS = [
  { id: 'selected', label: 'Selected', test: (v: VisualEntry) => Boolean(v.selected) },
  { id: 'open', label: 'Needs a decision', test: (v: VisualEntry) => !v.selected },
] as const;

const countOf = (v: VisualEntry) => `${v.versions.length} ${v.versions.length === 1 ? 'version' : 'versions'}`;

function useSetSearch() {
  const navigate = useNavigate();
  return (next: IndexSearch, replace = false) =>
    void navigate({ to: '/visuals' as never, search: (current: IndexSearch) => validateIndexSearch({ ...current, ...next }) as never, replace } as never);
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
        value ? 'w-64' : 'w-36 focus-within:w-64',
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

function Filters({ index, search }: { index: VisualsContribution; search: IndexSearch }) {
  const set = useSetSearch();
  const active = [search.family, search.collection, search.status].filter(Boolean).length;
  const radio = (key: 'family' | 'collection' | 'status', label: string, options: readonly { id: string; label: string }[]) => (
    <DropdownMenuGroup>
      <DropdownMenuLabel>{label}</DropdownMenuLabel>
      <DropdownMenuRadioGroup value={search[key] ?? ''} onValueChange={value => set({ [key]: value as string })}>
        <DropdownMenuRadioItem value=''>All</DropdownMenuRadioItem>
        {options.map(o => (
          <DropdownMenuRadioItem key={o.id} value={o.id}>
            {o.label}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </DropdownMenuGroup>
  );
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant='outline' size='icon' className='relative' />}
        aria-label={active ? `Filters, ${active} active` : 'Filters'}
        title='Filters'
      >
        <HugeiconsIcon icon={FilterIcon} aria-hidden />
        {active > 0 && <span aria-hidden className='absolute top-1 right-1 size-1.5 rounded-full bg-primary' />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-56'>
        {radio('collection', 'Collection', index.collections)}
        <DropdownMenuSeparator />
        {radio('family', 'Family', index.families)}
        <DropdownMenuSeparator />
        {radio('status', 'Status', STATUS_FILTERS)}
        <DropdownMenuSeparator />
        <DropdownMenuCheckboxItem
          checked={search.group === 'collection'}
          onCheckedChange={on => set({ group: on ? 'collection' : '' })}
        >
          Group by collection
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// A visual's card: the visual on a mat at one shape (16:10), so every format sits in the same grid, then its name, family
// and how many versions it has.
function VisualCard({ visual, origin, family }: { visual: VisualEntry; origin?: ArtifactContext; family?: string }) {
  const [mat, { width: W, height: H }] = useSize<HTMLDivElement>();
  const near = useNear(mat, { release: true });
  const { width: w, height: h } = sizeOf(visual);
  const inset = 20;
  const scale = W && H ? Math.min((W - inset * 2) / w, (H - inset * 2) / h) : 0;
  return (
    <Link
      to={visualHref(visual) as never}
      className='group block h-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
    >
      <div className='h-full overflow-hidden rounded-xl bg-card ring-1 ring-border transition-colors group-hover:bg-muted/40'>
        <div ref={mat} className='relative grid aspect-[16/10] place-items-center bg-muted/50'>
          <div
            className='overflow-hidden rounded-md bg-background shadow-sm ring-1 ring-foreground/5 transition-transform duration-300 ease-out group-hover:scale-[1.02] motion-reduce:transition-none'
            style={{ width: w * scale, height: h * scale }}
          >
            {near && scale > 0 && <Live visual={visual} origin={origin} width={w * scale} height={h * scale} />}
          </div>
          {!visual.selected && (
            <span className='absolute top-2.5 left-2.5 rounded-full bg-background/90 px-2 text-[11px] leading-5 font-medium text-foreground ring-1 ring-border'>
              Needs a decision
            </span>
          )}
        </div>
        <div className='grid gap-0.5 px-4 pt-3 pb-3.5'>
          <span className='truncate text-sm font-semibold text-foreground'>{visual.title}</span>
          <span className='truncate text-xs text-muted-foreground'>
            {family} · {countOf(visual)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function VisualsIndex() {
  const manifest = useManifest();
  const index = data(manifest);
  const search = validateIndexSearch(useSearch({ strict: false }) as Record<string, unknown>);
  const all = useStable(index?.visuals.filter(v => v.versions.length) ?? []);
  const origins = useOrigins(manifest, all);
  if (!index) return null;
  const familyOf = (v: VisualEntry) => index.families.find(f => f.id === v.family)?.label;
  const collectionLabels = (v: VisualEntry) => v.collections.map(id => index.collections.find(c => c.id === id)?.label ?? id);
  const q = (search.q ?? '').trim().toLowerCase();
  const status = STATUS_FILTERS.find(s => s.id === search.status);
  // Each collection's own order, then collections in the order they're declared, so related visuals sit together.
  const rank = (v: VisualEntry) => {
    const at = index.collections.findIndex(c => v.collections.includes(c.id));
    const collection = index.collections[at];
    const within = collection?.order?.indexOf(v.id) ?? -1;
    return (at < 0 ? index.collections.length : at) * 1000 + (within < 0 ? 999 : within);
  };
  const shown = all
    .filter(
      v =>
        (!search.family || v.family === search.family) &&
        (!search.collection || v.collections.includes(search.collection)) &&
        (!status || status.test(v)) &&
        (!q || [v.title, v.id, familyOf(v), ...collectionLabels(v)].some(f => f?.toLowerCase().includes(q))),
    )
    .sort((a, b) => rank(a) - rank(b));
  const list = (visuals: VisualEntry[]) => (
    <Collection
      items={visuals}
      keyOf={v => v.id}
      card={v => <VisualCard visual={v} origin={origins[v.id]} family={familyOf(v)} />}
      row={v => (
        <ItemRow
          link={{ to: visualHref(v) }}
          icon={Image02Icon}
          title={v.title}
          meta={`${familyOf(v)} · ${countOf(v)}${v.selected ? '' : ' · Needs a decision'}`}
        />
      )}
    />
  );
  const groups =
    search.group === 'collection'
      ? [
          ...index.collections.map(c => ({ key: c.id, label: c.label, line: c.line, visuals: shown.filter(v => v.collections.includes(c.id)) })),
          { key: 'other', label: 'Other visuals', line: undefined, visuals: shown.filter(v => !v.collections.length) },
        ].filter(g => g.visuals.length)
      : null;
  return (
    <main className='mx-auto w-full max-w-5xl px-6 pt-12 pb-8'>
      <header className='mb-6'>
        <h1 className='text-2xl font-semibold tracking-tight text-foreground'>Visuals</h1>
        <div className='mt-0.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3'>
          <p className='min-w-0 truncate text-sm leading-8 text-muted-foreground'>
            Visual assets made in the studio, each with its versions.
          </p>
          <div className='flex flex-wrap items-center gap-2'>
            <SearchBox value={search.q ?? ''} />
            <Filters index={index} search={search} />
            <ViewToggle />
          </div>
        </div>
      </header>
      {!shown.length ? (
        <div className='py-16 text-center'>
          <p className='mb-2 text-lg font-semibold text-foreground'>No matches</p>
          <p className='mb-4 text-sm text-muted-foreground'>Try a different search or filter.</p>
          <Link to={'/visuals' as never} className='text-sm text-primary hover:underline'>
            View all visuals
          </Link>
        </div>
      ) : groups ? (
        groups.map((g, i) => (
          <section key={g.key} className={i ? 'mt-10' : ''}>
            <h2 className='mb-3 flex items-baseline gap-2 text-sm font-semibold text-foreground'>
              {g.label}
              {g.line && <span className='font-normal text-muted-foreground'>{g.line}</span>}
            </h2>
            {list(g.visuals)}
          </section>
        ))
      ) : (
        list(shown)
      )}
    </main>
  );
}
