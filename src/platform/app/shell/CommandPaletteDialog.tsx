// The ⌘K palette's dialog, and the same search in place for the front page (InlineSearch). It loads shortly after the app
// starts (CommandPalette.tsx), so cmdk isn't in the main bundle.
import { Fragment, useEffect, useRef, useState, type RefObject } from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { HugeiconsIcon } from '@hugeicons/react';
import { Search01Icon } from '@hugeicons/core-free-icons';
import { cn } from '#studio/runtime';
import { getRouteApi, useMatches, useMatchRoute, useNavigate, type NavigateOptions } from '@tanstack/react-router';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/platform/systems/studio/components/command';
import { moduleApps, type PaletteContext } from '@/platform/app/modules';
import type { Artifact, Prototype } from '@/platform/app/data/types';

const rootApi = getRouteApi('__root__');

// What the palette lists, for whichever surface shows it: the places, then each module's groups.
function usePaletteContext(go: (to: NavigateOptions) => void): PaletteContext & { onHome: boolean } {
  const manifest = rootApi.useLoaderData();
  const matchRoute = useMatchRoute();
  // What's open is what the routes loaded (router.tsx), so the palette never resolves an address itself.
  const loaded = useMatches().map(
    match => match.loaderData as { proto?: Prototype; artifactId?: string; artifactPath?: string } | undefined,
  );
  const openProto = loaded.find(data => data?.proto)?.proto;
  const current =
    openProto &&
    (manifest.prototypes.find(p => p.contributorKey === openProto.contributorKey && p.id === openProto.id) as
      | Prototype
      | undefined);
  const openItem = loaded.find(data => data?.artifactPath);
  const isOpen = (item: Artifact) =>
    openItem?.artifactId ? item.studioId === openItem.artifactId : item.path === openItem?.artifactPath;
  const onHome = Boolean(matchRoute({ to: '/' }));
  return { manifest, current, isOpen, go, onHome };
}

function PaletteGroups({ onHome, ...context }: PaletteContext & { onHome: boolean }) {
  const { go } = context;
  return (
    <>
      <CommandEmpty>No results found.</CommandEmpty>

      <CommandGroup heading='Places'>
        <CommandItem value='home overview' disabled={onHome} onSelect={() => go({ to: '/' })}>
          Home
        </CommandItem>
        {import.meta.env.DEV && (
          <CommandItem
            value='studio settings configuration modules contributors admins'
            onSelect={() => go({ to: '/settings' } as never)}
          >
            Studio settings
          </CommandItem>
        )}
        {moduleApps.map(({ spec, app }) => app.places && <app.places key={spec.id} {...context} />)}
      </CommandGroup>

      {[...moduleApps]
        .sort((a, b) => (a.app.paletteOrder ?? a.app.order) - (b.app.paletteOrder ?? b.app.order))
        .map(
          ({ spec, app }) =>
            app.palette && (
              <Fragment key={spec.id}>
                <app.palette {...context} />
              </Fragment>
            ),
        )}
    </>
  );
}

export default function CommandPaletteDialog({
  open,
  setOpen,
  returnFocus,
}: {
  open: boolean;
  setOpen: (open: boolean) => void;
  returnFocus: RefObject<HTMLElement | null>;
}) {
  const navigate = useNavigate();
  const context = usePaletteContext(to => {
    returnFocus.current = null;
    setOpen(false);
    navigate(to);
  });

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      finalFocus={() => {
        const target = returnFocus.current;
        // Restore this opening's origin after the modal releases focus containment.
        // Never fall back to the dialog library's older focus history.
        queueMicrotask(() => {
          const active = document.activeElement;
          // A pointer dismissal that already focused another control keeps that focus.
          if (target?.isConnected && (active === document.body || active?.closest('[data-slot="dialog-content"]'))) {
            target.focus({ preventScroll: true });
          }
        });
        return false;
      }}
    >
      <Command>
        <CommandInput placeholder='Search the studio' />
        <CommandList>
          <PaletteGroups {...context} />
        </CommandList>
      </Command>
    </CommandDialog>
  );
}

// The same search in place, for a page that puts a search field in front of you (the front page): you type in the
// field itself, and what matches opens in a panel under it, over the page rather than in a dialog. Arrow keys move,
// Enter opens, Esc clears. The field's look is the page's; the panel is the palette's list.
export function InlineSearch({ className, placeholder }: { className: string; placeholder: string }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const context = usePaletteContext(to => {
    setOpen(false);
    setQuery('');
    navigate(to);
  });
  // A press anywhere else closes the results; typing again opens them.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);
  const shown = open && query.trim().length > 0;
  return (
    <div ref={box} className='relative'>
      <CommandPrimitive label='Search the studio' className='relative'>
        <div className={cn('flex items-center gap-2.5', className)}>
          <HugeiconsIcon icon={Search01Icon} size={16} className='shrink-0 text-muted-foreground' />
          <CommandPrimitive.Input
            value={query}
            onValueChange={value => {
              setQuery(value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={e => {
              if (e.key !== 'Escape') return;
              if (shown) setOpen(false);
              else setQuery('');
            }}
            placeholder={placeholder}
            className='h-full min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground'
          />
        </div>
        <div
          className={cn(
            'absolute inset-x-0 top-full z-30 mt-2 overflow-hidden rounded-xl bg-popover p-1 text-left text-popover-foreground shadow-lg ring-1 ring-foreground/10',
            !shown && 'hidden',
          )}
        >
          <CommandList className='max-h-[320px]'>
            <PaletteGroups {...context} />
          </CommandList>
        </div>
      </CommandPrimitive>
    </div>
  );
}
