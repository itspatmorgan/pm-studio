// A visual's own page (/visuals/<id>), beside its navigation: where you look at its versions, compare them, and decide.
//
// - The stage shows one version large, playing, at its true shape. ← and → step through the versions.
// - The strip under it is every version in order, v01 first, held still, with its status, so the history reads at a
//   glance and any version is one click away.
// - Compare pins the version on stage and puts a second beside it; the strip and the arrow keys then change the second,
//   so you can cycle candidates against the one you like.
// - The panel on the right is the decision: the version's status and your note on it, saved to _iterations.json through
//   the module's route (server.ts), and a prompt to make the next version from it, for the agent.
//
// Performance: only the stage plays. The strip's versions draw once and hold still, and only while on screen.
import { useEffect, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { HugeiconsIcon } from '@hugeicons/react';
import { ArrowLeft01Icon, ArrowRight01Icon, Copy01Icon, LinkSquare02Icon } from '@hugeicons/core-free-icons';
import type { Prototype } from '#studio/data';
import { callModule, canChangePrototype, useManifest, useMe } from '#studio/data';
import { cn } from '#studio/runtime';
import { Button, Textarea, toast } from '#studio/components';
import { FORMATS } from './lib/formats.ts';
import { Live, data, useNear, useSize, versionHref, versionName } from './shared.tsx';
import { type Status, type VisualEntry, type VisualVersion } from './visuals.ts';

const LABEL: Record<Status, string> = {
  exploring: 'Exploring',
  shortlisted: 'Shortlisted',
  selected: 'Selected',
  rejected: 'Rejected',
};
// The status choices in the order a version moves through them.
const ORDER: Status[] = ['exploring', 'shortlisted', 'selected', 'rejected'];
const DOT: Record<Status, string> = {
  exploring: 'bg-muted-foreground/40',
  shortlisted: 'bg-foreground/70',
  selected: 'bg-primary',
  rejected: 'bg-transparent ring-1 ring-muted-foreground/50',
};

// Changes one version's status or note through the module's own route (server.ts), which edits only that version's entry
// in _iterations.json, so whatever an agent wrote to the others stays.
const saveRecord = (visual: string, version: string, change: { status?: Status; note?: string }) =>
  callModule('visuals', 'record', { visual, version, ...change });

function useSave(proto: Prototype) {
  const [saving, setSaving] = useState(false);
  return {
    saving,
    save: async (studioId: string, change: { status?: Status; note?: string }) => {
      setSaving(true);
      try {
        await saveRecord(proto.id, studioId, change);
      } catch (error) {
        toast.add({ title: `Couldn't save: ${(error as Error).message}` });
      } finally {
        setSaving(false);
      }
    },
  };
}

// One version drawn to fit a box at its true shape.
function Fitted({
  visual,
  version,
  proto,
  box,
  still,
  className,
}: {
  visual: VisualEntry;
  version: VisualVersion;
  proto: Prototype;
  box: { width: number; height: number };
  still: boolean;
  className?: string;
}) {
  const format = FORMATS[version.format];
  const scale = Math.min(box.width / format.width, box.height / format.height);
  const item = proto.artifacts.find(a => a.studioId === version.studioId);
  const width = Math.max(0, format.width * scale);
  const height = Math.max(0, format.height * scale);
  return (
    <div
      className={cn('shrink-0 overflow-hidden rounded-[10px] bg-muted/50 ring-1 ring-foreground/[0.07]', className)}
      style={{ width, height }}
    >
      {item && width > 0 && (
        <Live visual={visual} version={version} origin={{ proto, item }} width={width} height={height} still={still} />
      )}
    </div>
  );
}

function StripItem({
  visual,
  version,
  proto,
  active,
  pinned,
  onPick,
}: {
  visual: VisualEntry;
  version: VisualVersion;
  proto: Prototype;
  active: boolean;
  pinned: boolean;
  onPick: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const near = useNear(ref, { release: true });
  const format = FORMATS[version.format];
  const height = 56;
  const width = (height * format.width) / format.height;
  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [active]);
  return (
    <button
      ref={ref}
      type='button'
      onClick={onPick}
      aria-pressed={active}
      aria-label={`${versionName(version)}, ${LABEL[version.status]}`}
      className='group flex shrink-0 flex-col items-start gap-1.5 rounded-lg p-1 outline-none focus-visible:ring-2 focus-visible:ring-ring'
    >
      <span
        className={cn(
          'block overflow-hidden rounded-md ring-1 ring-foreground/[0.07] transition-[box-shadow,opacity] duration-150',
          active ? 'ring-2 ring-foreground' : pinned ? 'ring-2 ring-foreground/30' : 'group-hover:ring-foreground/25',
          version.status === 'rejected' && !active && 'opacity-50',
        )}
        style={{ width, height }}
      >
        {near && (
          <Fitted visual={visual} version={version} proto={proto} box={{ width, height }} still className='rounded-none ring-0' />
        )}
      </span>
      <span className='flex items-center gap-1.5 px-0.5 text-xs text-muted-foreground tabular-nums'>
        <span aria-hidden className={cn('size-1.5 rounded-full', DOT[version.status])} />
        <span className={cn(active && 'font-medium text-foreground')}>{versionName(version)}</span>
      </span>
    </button>
  );
}

function Decision({
  visual,
  version,
  proto,
  editable,
}: {
  visual: VisualEntry;
  version: VisualVersion;
  proto: Prototype;
  editable: boolean;
}) {
  const { save, saving } = useSave(proto);
  const [note, setNote] = useState(version.note ?? '');
  useEffect(() => setNote(version.note ?? ''), [version.studioId, version.note]);
  const dirty = note.trim() !== (version.note ?? '');
  const next = `v${String(visual.versions.length + 1).padStart(2, '0')}`;
  const prompt = `Make ${next} of the visual "${visual.title}" (src/visuals/${visual.id}) from ${versionName(version)}${
    note.trim() ? `: ${note.trim()}` : '.'
  }`;
  return (
    <aside className='flex w-full shrink-0 flex-col gap-6 border-t border-border p-6 lg:w-[320px] lg:border-t-0 lg:border-l'>
      <div>
        <div className='flex items-baseline justify-between'>
          <h2 className='text-base font-semibold text-foreground tabular-nums'>{versionName(version)}</h2>
          <Link
            to={versionHref(visual, version) as never}
            className='flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground'
          >
            Open on its own
            <HugeiconsIcon icon={LinkSquare02Icon} size={12} aria-hidden />
          </Link>
        </div>
        <p className='mt-0.5 text-xs text-muted-foreground'>{FORMATS[version.format].label}</p>
      </div>
      <div>
        <div className='mb-2 text-xs font-medium text-muted-foreground'>Status</div>
        <div role='radiogroup' aria-label='Status' className='grid grid-cols-2 gap-1 rounded-lg bg-muted p-1'>
          {ORDER.map(status => (
            <button
              key={status}
              type='button'
              role='radio'
              aria-checked={version.status === status}
              disabled={!editable || saving}
              onClick={() => version.status !== status && void save(version.studioId, { status })}
              className={cn(
                'flex h-7 items-center justify-center gap-1.5 rounded-md text-xs transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default',
                version.status === status
                  ? 'bg-background font-medium text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.06)]'
                  : 'text-muted-foreground enabled:hover:text-foreground',
              )}
            >
              <span aria-hidden className={cn('size-1.5 rounded-full', DOT[status])} />
              {LABEL[status]}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label htmlFor='version-note' className='mb-2 block text-xs font-medium text-muted-foreground'>
          Note
        </label>
        {editable ? (
          <>
            <Textarea
              id='version-note'
              value={note}
              onChange={e => setNote(e.target.value)}
              onBlur={() => dirty && void save(version.studioId, { note: note.trim() })}
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && dirty) void save(version.studioId, { note: note.trim() });
              }}
              placeholder='What works, what to change next'
              className='min-h-24 text-sm'
            />
            <p className='mt-1.5 text-xs text-muted-foreground'>{saving ? 'Saving…' : dirty ? 'Saves when you leave the field' : ' '}</p>
          </>
        ) : (
          <p className='text-sm text-pretty text-foreground'>{version.note || <span className='text-muted-foreground'>No note</span>}</p>
        )}
      </div>
      {editable && (
        <div className='mt-auto'>
          <Button
            variant='outline'
            className='w-full justify-center gap-2'
            onClick={() =>
              void navigator.clipboard.writeText(prompt).then(() => toast.add({ title: `Prompt for ${next} copied` }))
            }
          >
            <HugeiconsIcon icon={Copy01Icon} aria-hidden />
            Iterate: copy prompt for {next}
          </Button>
          <p className='mt-2 text-xs text-pretty text-muted-foreground'>Paste it to your agent; the new version appears here.</p>
        </div>
      )}
    </aside>
  );
}

export function VisualPage({ proto }: { proto: Prototype }) {
  const index = data(useManifest());
  const me = useMe();
  const visual = index?.visuals.find(v => v.id === proto.id);
  const versions = visual?.versions ?? [];
  const lead = visual?.selected ?? versions.at(-1);
  const [currentId, setCurrentId] = useState(lead?.studioId);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [stage, size] = useSize<HTMLDivElement>();
  const at = Math.max(0, versions.findIndex(v => v.studioId === currentId));
  const current = versions[at];
  const pinned = versions.find(v => v.studioId === pinnedId);
  // ← and → step through the versions, unless you're typing.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('input, textarea, [contenteditable]') || event.metaKey || event.ctrlKey || event.altKey) return;
      const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
      if (step && versions.length > 1) {
        event.preventDefault();
        setCurrentId(versions[(at + step + versions.length) % versions.length]!.studioId);
      }
      if (event.key === 'Escape') setPinnedId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [versions, at]);
  if (!index || !visual || !current) return null;
  const family = index.families.find(f => f.id === visual.family);
  const collections = visual.collections.map(id => index.collections.find(c => c.id === id)?.label ?? id);
  const editable = import.meta.env.DEV && canChangePrototype(proto, me);
  const comparing = Boolean(pinned && pinned.studioId !== current.studioId);
  const shown = comparing ? [pinned!, current] : [current];
  const pad = 40;
  const gap = 24;
  const cell = {
    width: (size.width - pad * 2 - gap * (shown.length - 1)) / shown.length,
    height: size.height - pad * 2 - (comparing ? 28 : 0),
  };
  const step = (by: number) => setCurrentId(versions[(at + by + versions.length) % versions.length]!.studioId);
  return (
    <main className='flex min-w-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden'>
      <div className='flex min-h-0 min-w-0 flex-1 flex-col'>
        <header className='flex flex-wrap items-start justify-between gap-3 px-6 pt-6'>
          <div className='min-w-0'>
            <h1 className='truncate text-xl font-semibold tracking-tight text-foreground'>{visual.title}</h1>
            <p className='mt-0.5 truncate text-sm text-muted-foreground'>
              {[family?.label, ...collections].filter(Boolean).join(' · ')}
            </p>
          </div>
          {versions.length > 1 && (
            <Button
              variant={comparing ? 'secondary' : 'outline'}
              size='sm'
              aria-pressed={comparing}
              onClick={() => {
                if (comparing) return setPinnedId(null);
                // Pin the version on stage, and start the comparison with its neighbour.
                setPinnedId(current.studioId);
                step(at > 0 ? -1 : 1);
              }}
            >
              {comparing ? 'Done comparing' : 'Compare'}
            </Button>
          )}
        </header>
        <div ref={stage} className='relative flex min-h-[320px] flex-1 items-center justify-center lg:min-h-0' style={{ gap }}>
          {cell.width > 0 &&
            cell.height > 0 &&
            shown.map(version => (
              <figure key={version.studioId} className='flex flex-col items-center gap-2'>
                {comparing && (
                  <figcaption className='text-xs text-muted-foreground tabular-nums'>
                    <span className='font-medium text-foreground'>{versionName(version)}</span>
                    {version === pinned ? ' · pinned' : ''} · {LABEL[version.status]}
                  </figcaption>
                )}
                <Fitted visual={visual} version={version} proto={proto} box={cell} still={false} />
              </figure>
            ))}
          {versions.length > 1 && !comparing && (
            <>
              <button
                type='button'
                aria-label='Previous version'
                onClick={() => step(-1)}
                className='absolute top-1/2 left-3 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring'
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
              </button>
              <button
                type='button'
                aria-label='Next version'
                onClick={() => step(1)}
                className='absolute top-1/2 right-3 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring'
              >
                <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
              </button>
            </>
          )}
        </div>
        <div className='border-t border-border px-5 pt-3 pb-4'>
          <div className='mb-1.5 flex items-baseline justify-between px-1 text-xs text-muted-foreground'>
            <span>
              {versions.length} {versions.length === 1 ? 'version' : 'versions'}
            </span>
            {versions.length > 1 && <span>{comparing ? 'Pick a version to compare' : '← → to step through'}</span>}
          </div>
          <div className='flex gap-1 overflow-x-auto'>
            {versions.map(version => (
              <StripItem
                key={version.studioId}
                visual={visual}
                version={version}
                proto={proto}
                active={version.studioId === current.studioId}
                pinned={version.studioId === pinned?.studioId}
                onPick={() => setCurrentId(version.studioId)}
              />
            ))}
          </div>
        </div>
      </div>
      <Decision visual={visual} version={current} proto={proto} editable={editable} />
    </main>
  );
}
