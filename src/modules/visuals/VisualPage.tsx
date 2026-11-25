// A visual project's own page, beside its navigation, which lists All pieces and then the project's pieces (nav.tsx).
//
// - At the project's address (/visuals/<project>) it shows All pieces: a contact sheet, every piece in an equal cell at
//   its pick (or, with none yet, its newest version, marked), in the project's order, to judge the set together. A
//   project of one piece opens that piece.
// - At a version's address (/visuals/<project>/<piece>/v03) it shows that piece in three layers, each with one job. The
//   header names the piece. The stage plays the version at its true shape, with Compare and Tune in its corner. The
//   versions panel runs the round: a chain of the piece's versions, where each version's note, its direction for the
//   next one, sits on the arrow between them, and an inspector for the version on stage with its flag (Pick,
//   Shortlist, Reject) and that direction. The panel keeps one small height however many versions there are: the chain
//   scrolls sideways and rejected versions fold to stubs. Keys do the routine: ← → step, P S X U flag, C compare, D
//   direction. Flags and notes save to _iterations.json through the module's route (server.ts).
//
// Performance: only the stage plays; thumbnails are still; contact sheet cells play while pointed at.
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactElement } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import { HugeiconsIcon, type IconSvgElement } from '@hugeicons/react';
import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Bookmark02Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  SlidersHorizontalIcon,
} from '@hugeicons/core-free-icons';
import type { Artifact, Prototype } from '#studio/data';
import { callModule, canChangePrototype, contribution, useManifest, useMe } from '#studio/data';
import { cn } from '#studio/runtime';
import { Button, Textarea, Tooltip, TooltipContent, TooltipTrigger, toast } from '#studio/components';
import { FORMATS } from './lib/formats.ts';
import { Live, data, leadOf, piecesOf, useSize, versionHref, versionName } from './shared.tsx';
import type { Status, VisualEntry, VisualProject, VisualVersion } from './visuals.ts';

// The flags a creative director sets while reviewing, with their keys. A version with none is still being explored.
const FLAGS: { status: Exclude<Status, 'exploring'>; label: string; key: string; icon: IconSvgElement; on: string }[] = [
  { status: 'selected', label: 'Pick', key: 'P', icon: CheckmarkCircle02Icon, on: 'bg-info text-info-foreground ring-1 ring-info-border' },
  { status: 'shortlisted', label: 'Shortlist', key: 'S', icon: Bookmark02Icon, on: 'bg-foreground text-background' },
  { status: 'rejected', label: 'Reject', key: 'X', icon: Cancel01Icon, on: 'bg-muted-foreground/25 text-foreground' },
];
const LABEL: Record<Status, string> = {
  exploring: 'Unflagged',
  shortlisted: 'Shortlisted',
  selected: 'Picked',
  rejected: 'Rejected',
};
const DOT: Record<Status, string> = {
  exploring: 'bg-muted-foreground/40',
  shortlisted: 'bg-foreground/70',
  selected: 'bg-info-foreground',
  rejected: 'bg-transparent ring-1 ring-muted-foreground/50',
};

// Changes one version's status or note through the module's own route (server.ts), which edits only that version's entry
// in _iterations.json, so whatever an agent wrote to the others stays.
const saveRecord = (project: string, version: string, change: { status?: Status; note?: string }) =>
  callModule('visuals', 'record', { project, version, ...change });

function useSave(proto: Prototype) {
  return async (studioId: string, change: { status?: Status; note?: string }) => {
    try {
      await saveRecord(proto.id, studioId, change);
    } catch (error) {
      toast.add({ title: `Couldn't save: ${(error as Error).message}` });
    }
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

export function VisualPage({ proto, item }: { proto: Prototype; item?: Artifact }) {
  const manifest = useManifest();
  const index = data(manifest);
  const navigate = useNavigate();
  const project = index?.projects.find(p => p.id === proto.id);
  const pieces = index && project ? piecesOf(index, project).filter(p => p.versions.length) : [];
  const piece = item && pieces.find(p => p.versions.some(v => v.path === item.path));
  // A project of one piece is that piece, so its address opens the piece.
  const only = !item && pieces.length === 1 ? pieces[0] : undefined;
  useEffect(() => {
    if (only) void navigate({ to: versionHref(only) as never, replace: true });
  }, [only, navigate]);
  if (!index || !project || only) return null;
  if (piece) return <PiecePage key={piece.id} project={project} visual={piece} item={item!} proto={proto} />;
  return <ProjectPage project={project} pieces={pieces} proto={proto} />;
}

// ─── All pieces ──────────────────────────────────────────────────────────────────────────────────────────────────────

// Cells are all one size, so the eye compares the pieces, not their tiles. Each piece fits inside its cell at its true
// shape, on a quiet ground.
const CELL_MIN = 260;
const CELL_GAP = 20;
const CELL_RATIO = 3 / 4;

function Cell({ visual, proto, width }: { visual: VisualEntry; proto: Prototype; width: number }) {
  const [playing, setPlaying] = useState(false);
  const version = leadOf(visual);
  const height = width * CELL_RATIO;
  const format = FORMATS[version.format];
  return (
    <Link
      to={versionHref(visual) as never}
      onPointerEnter={() => setPlaying(true)}
      onPointerLeave={() => setPlaying(false)}
      onFocus={() => setPlaying(true)}
      onBlur={() => setPlaying(false)}
      className='group block min-w-0 rounded-xl outline-none'
      data-cell
    >
      <div
        className='grid place-items-center rounded-xl bg-muted/40 ring-1 ring-foreground/[0.04] transition-[box-shadow] group-hover:ring-foreground/15 group-focus-visible:ring-2 group-focus-visible:ring-ring'
        style={{ height }}
      >
        <Fitted
          visual={visual}
          version={version}
          proto={proto}
          box={{ width: width - 40, height: height - 40 }}
          still={!playing}
          className='rounded-md shadow-sm'
        />
      </div>
      <div className='mt-2 flex items-baseline gap-2 px-0.5'>
        <span className='min-w-0 flex-1 truncate text-[13px] leading-5 font-medium text-foreground'>{visual.title}</span>
        <span className='shrink-0 text-xs text-muted-foreground tabular-nums'>
          {visual.selected ? versionName(version) : 'No pick yet'}
        </span>
      </div>
      <div className='truncate px-0.5 text-xs leading-5 text-muted-foreground tabular-nums'>
        {format.label} · {format.width}×{format.height}
      </div>
    </Link>
  );
}

function ProjectPage({ project, pieces, proto }: { project: VisualProject; pieces: VisualEntry[]; proto: Prototype }) {
  const [area, { width }] = useSize<HTMLDivElement>();
  const columns = Math.max(1, Math.floor((width + CELL_GAP) / (CELL_MIN + CELL_GAP)));
  const cell = (width - CELL_GAP * (columns - 1)) / columns;
  const open = pieces.filter(p => !p.selected).length;
  // Arrow keys move across the sheet as they would in a grid of photos.
  const move = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const step = ({ ArrowRight: 1, ArrowLeft: -1, ArrowDown: columns, ArrowUp: -columns } as Record<string, number>)[event.key];
    if (!step) return;
    const cells = [...event.currentTarget.querySelectorAll<HTMLElement>('[data-cell]')];
    const at = cells.indexOf(document.activeElement as HTMLElement);
    const next = cells[at < 0 ? 0 : at + step];
    if (!next) return;
    event.preventDefault();
    next.focus();
  };
  return (
    <main className='min-w-0 flex-1 overflow-y-auto'>
      <div className='mx-auto w-full max-w-[1152px] px-6 pt-8 pb-16'>
        <header className='mb-6'>
          <h1 className='text-lg font-semibold tracking-tight text-foreground'>All pieces</h1>
          <p className='mt-0.5 text-sm text-muted-foreground'>
            {[project.title, `${pieces.length} pieces`, open ? `${open} without a pick` : 'every piece picked'].join(' · ')}
          </p>
        </header>
        <div
          ref={area}
          onKeyDown={move}
          className='grid'
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`, columnGap: CELL_GAP, rowGap: CELL_GAP + 8 }}
        >
          {width > 0 && pieces.map(p => <Cell key={p.id} visual={p} proto={proto} width={cell} />)}
        </div>
      </div>
    </main>
  );
}

// ─── A piece ─────────────────────────────────────────────────────────────────────────────────────────────────────────

// A choice remembered in this browser, such as whether the versions panel is open.
function useRemembered(key: string, initial: boolean) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored === null ? initial : stored === 'true';
    } catch {
      return initial;
    }
  });
  const change = (next: boolean) => {
    setValue(next);
    try {
      localStorage.setItem(key, String(next));
    } catch {}
  };
  return [value, change] as const;
}

const quiet =
  'grid shrink-0 place-items-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none';

function Tip({ label, children }: { label: string; children: ReactElement }) {
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent side='top'>{label}</TooltipContent>
    </Tooltip>
  );
}

// The note on a version is its direction for the next one. Writing it opens a small sheet above the panel; saving with
// ⌘↵ also copies a prompt for the agent to make the next version from it.
function Direction({
  project,
  visual,
  current,
  editable,
  open,
  onOpenChange,
  onSave,
}: {
  project: VisualProject;
  visual: VisualEntry;
  current: VisualVersion;
  editable: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (note: string) => Promise<void>;
}) {
  const [note, setNote] = useState(current.note ?? '');
  useEffect(() => setNote(current.note ?? ''), [current.studioId, current.note]);
  const next = `v${String(visual.versions.length + 1).padStart(2, '0')}`;
  const name = versionName(current);
  const prompt = (text: string) =>
    `Make ${next} of "${visual.title}", a piece of the visual project ${project.title} (src/visuals/${visual.id}/), from ${name}${
      text ? `: ${text}` : '.'
    }`;
  const save = async (copy: boolean) => {
    const text = note.trim();
    if (text !== (current.note ?? '')) await onSave(text);
    if (copy) await navigator.clipboard.writeText(prompt(text)).then(() => toast.add({ title: `Prompt for ${next} copied` }));
    onOpenChange(false);
  };
  return (
    <>
      <button
        type='button'
        disabled={!editable}
        onClick={() => onOpenChange(!open)}
        title={current.note || undefined}
        className='flex h-6 min-w-0 items-center gap-1.5 rounded-md px-1.5 text-left text-xs outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:hover:bg-transparent'
      >
        <span className='shrink-0 text-muted-foreground'>Next:</span>
        <span className={cn('min-w-0 truncate', current.note ? 'text-foreground' : 'text-muted-foreground/70')}>
          {current.note || (editable ? 'Add direction (D)' : 'No direction')}
        </span>
      </button>
      {open && editable && (
        <div className='absolute bottom-full left-2 z-20 mb-2 w-[min(420px,calc(100%-16px))] rounded-xl border border-border bg-popover p-3 shadow-lg'>
          <p className='mb-2 text-xs text-muted-foreground'>
            Direction from {name}. Copying the prompt asks the agent for {next}.
          </p>
          <Textarea
            autoFocus
            aria-label={`Direction from ${name}`}
            value={note}
            onChange={e => setNote(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Escape') {
                e.stopPropagation();
                onOpenChange(false);
              }
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void save(true);
            }}
            placeholder='What works, and what to change next'
            className='min-h-[72px] resize-none text-sm'
            rows={3}
          />
          <div className='mt-2 flex items-center justify-end gap-2'>
            <Button variant='ghost' size='sm' onClick={() => void save(false)}>
              Save
            </Button>
            <Button size='sm' onClick={() => void save(true)}>
              Save and copy prompt <span className='opacity-60'>⌘↵</span>
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

// The versions panel: an inspector for the version on stage, then the chain of versions.
function Versions({
  project,
  visual,
  proto,
  current,
  pinned,
  editable,
  showRejected,
  onShowRejected,
  directing,
  onDirecting,
  onFlag,
  onPick,
}: {
  project: VisualProject;
  visual: VisualEntry;
  proto: Prototype;
  current: VisualVersion;
  pinned?: VisualVersion;
  editable: boolean;
  showRejected: boolean;
  onShowRejected: (show: boolean) => void;
  directing: boolean;
  onDirecting: (open: boolean) => void;
  onFlag: (status: Status) => void;
  onPick: (version: VisualVersion) => void;
}) {
  const [open, setOpen] = useRemembered('visuals:versions', true);
  const save = useSave(proto);
  const versions = visual.versions;
  const rejected = versions.filter(v => v.status === 'rejected').length;
  const chain = useRef<HTMLOListElement>(null);
  // Keep the version on stage in view as you step.
  useLayoutEffect(() => {
    chain.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [current.studioId, open]);
  const H = 40;
  const name = versionName(current);
  return (
    <section aria-label='Versions' className='relative shrink-0 border-t border-border'>
      {!open ? (
        <div className='flex h-8 items-center gap-2 px-2'>
          <Tip label='Show versions'>
            <button type='button' aria-expanded={false} aria-label='Show versions' onClick={() => setOpen(true)} className={cn(quiet, 'size-6')}>
              <HugeiconsIcon icon={ArrowDown01Icon} size={14} className='rotate-180' />
            </button>
          </Tip>
          <span className='text-xs font-semibold text-foreground tabular-nums'>{name}</span>
          <span className='mr-2 text-xs text-muted-foreground'>{LABEL[current.status]}</span>
          <ol aria-label='Versions' className='flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden'>
            {versions.map(v => (
              <li key={v.studioId} className='flex'>
                <button
                  type='button'
                  aria-label={`${versionName(v)}, ${LABEL[v.status]}`}
                  onClick={() => onPick(v)}
                  className={cn(
                    'size-2 rounded-full',
                    DOT[v.status],
                    v.studioId === current.studioId && 'ring-2 ring-foreground ring-offset-1 ring-offset-background',
                  )}
                />
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <div className='flex h-[76px] items-stretch'>
          <div className='flex w-[232px] shrink-0 flex-col justify-center gap-1 border-r border-border px-2'>
            <div className='flex items-center gap-1'>
              <Tip label='Hide versions'>
                <button type='button' aria-expanded aria-label='Hide versions' onClick={() => setOpen(false)} className={cn(quiet, 'size-6')}>
                  <HugeiconsIcon icon={ArrowDown01Icon} size={14} />
                </button>
              </Tip>
              <span className='mr-auto text-sm font-semibold text-foreground tabular-nums'>{name}</span>
              <div className='flex items-center gap-0.5' role='group' aria-label={`Flag ${name}`}>
                {FLAGS.map(flag => {
                  const on = current.status === flag.status;
                  return (
                    <Tip key={flag.status} label={`${flag.label} (${flag.key})`}>
                      <button
                        type='button'
                        aria-pressed={on}
                        aria-label={flag.label}
                        disabled={!editable}
                        onClick={() => onFlag(on ? 'exploring' : flag.status)}
                        className={cn(quiet, 'size-6', on && flag.on, on && 'hover:bg-[inherit] hover:text-[inherit]')}
                      >
                        <HugeiconsIcon icon={flag.icon} size={14} />
                      </button>
                    </Tip>
                  );
                })}
              </div>
            </div>
            <Direction
              project={project}
              visual={visual}
              current={current}
              editable={editable}
              open={directing}
              onOpenChange={onDirecting}
              onSave={note => save(current.studioId, { note })}
            />
          </div>
          <ol
            ref={chain}
            aria-label='Versions'
            onWheel={e => {
              if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) e.currentTarget.scrollLeft += e.deltaY;
            }}
            className='flex min-w-0 flex-1 items-center overflow-x-auto px-3 [scrollbar-width:thin]'
          >
            {versions.map((version, i) => {
              const format = FORMATS[version.format];
              const on = version.studioId === current.studioId;
              const held = version.studioId === pinned?.studioId;
              const before = versions[i - 1];
              const folded = version.status === 'rejected' && !showRejected && !on && !held;
              const label = `${versionName(version)}, ${LABEL[version.status]}`;
              return (
                <li key={version.studioId} className='flex shrink-0 items-center'>
                  {before &&
                    (before.note ? (
                      <Tip label={`${versionName(before)} → ${versionName(version)}: ${before.note}`}>
                        <span tabIndex={0} aria-label={`Direction from ${versionName(before)}: ${before.note}`} className='flex h-4 w-5 items-center outline-none focus-visible:ring-2 focus-visible:ring-ring'>
                          <span className='h-px flex-1 bg-border' />
                          <span className='size-1.5 rounded-full bg-foreground/60' />
                          <span className='h-px flex-1 bg-border' />
                        </span>
                      </Tip>
                    ) : (
                      <span aria-hidden className='h-px w-5 bg-border' />
                    ))}
                  {folded ? (
                    <Tip label={label}>
                      <button
                        type='button'
                        aria-label={label}
                        onClick={() => onPick(version)}
                        className='mb-4 h-10 w-2 rounded-sm bg-muted-foreground/20 outline-none hover:bg-muted-foreground/40 focus-visible:ring-2 focus-visible:ring-ring'
                      />
                    </Tip>
                  ) : (
                    <button
                      type='button'
                      aria-current={on ? 'true' : undefined}
                      aria-label={label}
                      onClick={() => !on && onPick(version)}
                      className='group flex flex-col items-center gap-1 rounded-md outline-none'
                    >
                      <Fitted
                        visual={visual}
                        version={version}
                        proto={proto}
                        box={{ width: (H * format.width) / format.height, height: H }}
                        still
                        className={cn(
                          'rounded-[5px] transition-shadow',
                          on || held ? 'ring-2 ring-foreground' : 'group-hover:ring-foreground/30 group-focus-visible:ring-2 group-focus-visible:ring-ring',
                          version.status === 'rejected' && 'opacity-50',
                        )}
                      />
                      <span className='flex items-center gap-1 text-[10px] leading-3 text-muted-foreground tabular-nums'>
                        <span aria-hidden className={cn('size-1.5 rounded-full', DOT[version.status])} />
                        <span className={cn(on && 'font-medium text-foreground')}>{versionName(version)}</span>
                      </span>
                    </button>
                  )}
                </li>
              );
            })}
            {rejected > 0 && (
              <li className='ml-auto shrink-0 pl-4'>
                <button
                  type='button'
                  onClick={() => onShowRejected(!showRejected)}
                  className='rounded-md px-1.5 py-1 text-[11px] whitespace-nowrap text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring'
                >
                  {showRejected ? 'Fold rejected' : `${rejected} rejected`}
                </button>
              </li>
            )}
          </ol>
        </div>
      )}
    </section>
  );
}

function PiecePage({
  project,
  visual,
  item,
  proto,
}: {
  project: VisualProject;
  visual: VisualEntry;
  item: Artifact;
  proto: Prototype;
}) {
  const manifest = useManifest();
  const index = data(manifest)!;
  const me = useMe();
  const navigate = useNavigate();
  const save = useSave(proto);
  const versions = visual.versions;
  const current = versions.find(v => v.path === item.path)!;
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [directing, setDirecting] = useState(false);
  const [showRejected, setShowRejected] = useRemembered('visuals:rejected', false);
  const [stage, size] = useSize<HTMLDivElement>();
  const pinned = versions.find(v => v.studioId === pinnedId);
  const editable = import.meta.env.DEV && canChangePrototype(proto, me);
  const open = (version: VisualVersion) => void navigate({ to: versionHref(visual, version) as never });
  // Stepping skips folded (rejected) versions, as the chain does.
  const stops = versions.filter(v => showRejected || v.status !== 'rejected' || v === current);
  const step = (by: number) => {
    const at = stops.indexOf(current);
    if (stops.length > 1) open(stops[(at + by + stops.length) % stops.length]!);
  };
  const flag = (status: Status) => {
    if (editable && status !== current.status) void save(current.studioId, { status });
  };
  const compare = () => setPinnedId(pinned ? null : current.studioId);
  // The routine is on keys, unless you're typing.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('input, textarea, [contenteditable]') || event.metaKey || event.ctrlKey || event.altKey) return;
      const key = event.key.toLowerCase();
      const flagged = FLAGS.find(f => f.key.toLowerCase() === key);
      if (key === 'arrowright') step(1);
      else if (key === 'arrowleft') step(-1);
      else if (flagged) flag(current.status === flagged.status ? 'exploring' : flagged.status);
      else if (key === 'u') flag('exploring');
      else if (key === 'c' && versions.length > 1) compare();
      else if (key === 'd' && editable) setDirecting(true);
      else if (key === 'escape') {
        setPinnedId(null);
        setDirecting(false);
      } else return;
      event.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  const family = index.families.find(f => f.id === visual.family);
  const format = FORMATS[current.format];
  // DialKit's build lists the views that use it; Tune shows only for a version that has dials.
  const dials = contribution<{ views: string[] }>(manifest, 'dialkit');
  const tunable = Boolean(editable && dials?.views.includes(`src/visuals/${project.id}/${current.path}`));
  const comparing = Boolean(pinned && pinned.studioId !== current.studioId);
  const shown = comparing ? [pinned!, current] : [current];
  // Room for the ← → buttons beside the visual.
  const padX = stops.length > 1 ? 52 : 24;
  const padY = 28;
  const gap = 24;
  const cell = {
    width: (size.width - padX * 2 - gap * (shown.length - 1)) / shown.length,
    height: size.height - padY * 2 - (comparing ? 24 : 0),
  };
  return (
    <main className='flex min-h-0 min-w-0 flex-1 flex-col'>
      <header className='flex shrink-0 items-center gap-3 px-5 pt-3'>
        <div className='min-w-0'>
          <h1 className='truncate text-base font-semibold tracking-tight text-foreground'>{visual.title}</h1>
          <p className='truncate text-xs text-muted-foreground tabular-nums'>
            {[family?.label, `${format.label} ${format.width}×${format.height}`].filter(Boolean).join(' · ')}
          </p>
        </div>
        <div className='ml-auto flex shrink-0 items-center gap-1'>
          {tunable && (
            <Tip label={`Tune ${versionName(current)} with DialKit`}>
              <button
                type='button'
                aria-label={`Tune ${versionName(current)} with DialKit`}
                onClick={() => void navigate({ to: versionHref(visual, current) as never, search: { mode: 'viewer' } as never })}
                className={cn(quiet, 'size-7')}
              >
                <HugeiconsIcon icon={SlidersHorizontalIcon} size={16} />
              </button>
            </Tip>
          )}
          {versions.length > 1 && (
            <Tip label={pinned ? 'Stop comparing (Esc)' : 'Compare (C)'}>
              <Button variant={pinned ? 'secondary' : 'ghost'} size='sm' aria-pressed={Boolean(pinned)} onClick={compare}>
                {pinned ? 'Done comparing' : 'Compare'}
              </Button>
            </Tip>
          )}
        </div>
      </header>
      <div ref={stage} className='relative flex min-h-[280px] flex-1 items-center justify-center' style={{ gap }}>
        {pinned && !comparing && (
          <p className='absolute top-1 left-1/2 -translate-x-1/2 text-xs text-muted-foreground'>
            {versionName(pinned)} is pinned. Pick another version to compare.
          </p>
        )}
        {cell.width > 0 &&
          cell.height > 0 &&
          shown.map(version => (
            <figure key={version.studioId} className='flex flex-col items-center gap-2'>
              {comparing && (
                <figcaption className='text-xs text-muted-foreground tabular-nums'>
                  <span className='font-medium text-foreground'>{versionName(version)}</span>
                  {version === pinned ? ' · pinned' : ''}
                </figcaption>
              )}
              <Fitted visual={visual} version={version} proto={proto} box={cell} still={false} />
            </figure>
          ))}
        {stops.length > 1 && !comparing && (
          <>
            <button
              type='button'
              aria-label='Previous version'
              onClick={() => step(-1)}
              className='absolute top-1/2 left-2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring'
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
            </button>
            <button
              type='button'
              aria-label='Next version'
              onClick={() => step(1)}
              className='absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring'
            >
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
            </button>
          </>
        )}
      </div>
      <Versions
        project={project}
        visual={visual}
        proto={proto}
        current={current}
        pinned={pinned}
        editable={editable}
        showRejected={showRejected}
        onShowRejected={setShowRejected}
        directing={directing}
        onDirecting={setDirecting}
        onFlag={flag}
        onPick={open}
      />
    </main>
  );
}
