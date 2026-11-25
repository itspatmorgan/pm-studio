// A visual project's own page, beside its navigation, which lists the project's pieces, each with its versions
// (nav.tsx: status, selected first).
//
// - At the project's address (/visuals/<project>) it shows the project: its pieces in the project's order, each at its
//   lead version. A project of one piece opens that piece.
// - At a version's address (/visuals/<project>/<piece>/v03) it shows that piece: the version large, playing, at its true
//   shape. ← and → step through the piece's versions. Compare pins the version on stage and puts the next one you pick
//   beside it, from the navigation or with the arrow keys, so you can cycle candidates against the one you like.
// - The panel on the right, which folds away from the header, is the decision: the version's status and your note on
//   it, saved to _iterations.json through the module's route (server.ts), DialKit's dials when the version has them, and
//   a prompt to make the next version from it, for the agent.
//
// Performance: only the stage plays; the project's tiles play while pointed at.
import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Copy01Icon,
  PanelRightCloseIcon,
  PanelRightOpenIcon,
  SlidersHorizontalIcon,
} from '@hugeicons/core-free-icons';
import type { Artifact, Prototype } from '#studio/data';
import { callModule, canChangePrototype, contribution, useManifest, useMe } from '#studio/data';
import { cn } from '#studio/runtime';
import { Button, Textarea, toast } from '#studio/components';
import { FORMATS } from './lib/formats.ts';
import { Live, Tiles, data, piecesOf, useOrigins, useSize, useStable, versionHref, versionName } from './shared.tsx';
import type { Status, VisualEntry, VisualProject, VisualVersion } from './visuals.ts';

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
const saveRecord = (project: string, version: string, change: { status?: Status; note?: string }) =>
  callModule('visuals', 'record', { project, version, ...change });

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

function Decision({
  project,
  visual,
  version,
  proto,
  editable,
  tunable,
}: {
  project: VisualProject;
  visual: VisualEntry;
  version: VisualVersion;
  proto: Prototype;
  editable: boolean;
  // Whether DialKit is on, and whether this version has dials: null while DialKit is off.
  tunable: boolean | null;
}) {
  const { save, saving } = useSave(proto);
  const navigate = useNavigate();
  const [note, setNote] = useState(version.note ?? '');
  useEffect(() => setNote(version.note ?? ''), [version.studioId, version.note]);
  const dirty = note.trim() !== (version.note ?? '');
  const next = `v${String(visual.versions.length + 1).padStart(2, '0')}`;
  const prompt = `Make ${next} of "${visual.title}", a piece of the visual project ${project.title} (src/visuals/${visual.id}/), from ${versionName(version)}${
    note.trim() ? `: ${note.trim()}` : '.'
  }`;
  return (
    <aside
      aria-label={`${versionName(version)} details`}
      className='flex w-full shrink-0 flex-col gap-5 overflow-y-auto border-t border-border p-5 lg:w-[280px] lg:border-t-0 lg:border-l'
    >
      <div>
        <h2 className='text-sm font-semibold text-foreground tabular-nums'>{versionName(version)}</h2>
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
      {editable && tunable !== null && (
        <div>
          <div className='mb-2 text-xs font-medium text-muted-foreground'>Tune</div>
          {tunable ? (
            <>
              <Button
                variant='outline'
                size='sm'
                className='w-full justify-center gap-2'
                onClick={() =>
                  void navigate({ to: versionHref(visual, version) as never, search: { mode: 'viewer' } as never })
                }
              >
                <HugeiconsIcon icon={SlidersHorizontalIcon} aria-hidden />
                Tune {versionName(version)} with DialKit
              </Button>
              <p className='mt-2 text-xs text-pretty text-muted-foreground'>
                Opens it with its dials. Save to code changes {versionName(version)} itself, so iterate first to keep this
                one as it is.
              </p>
            </>
          ) : (
            <p className='text-xs text-pretty text-muted-foreground'>
              No dials yet. Ask your agent to add DialKit dials to {versionName(version)} for what you want to tune.
            </p>
          )}
        </div>
      )}
      {editable && (
        <div className='mt-auto'>
          <Button
            variant='outline'
            size='sm'
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
  return <ProjectPage project={project} pieces={pieces} />;
}

// The project: its pieces in its order, each at its lead version, under the project's name.
function ProjectPage({ project, pieces }: { project: VisualProject; pieces: VisualEntry[] }) {
  const manifest = useManifest();
  const index = data(manifest)!;
  const stable = useStable(pieces);
  const origins = useOrigins(manifest, stable);
  const [area, { width }] = useSize<HTMLDivElement>();
  const versions = pieces.reduce((n, p) => n + p.versions.length, 0);
  return (
    <main className='min-w-0 flex-1 overflow-y-auto'>
      <div className='mx-auto w-full max-w-5xl px-6 pt-8 pb-16'>
        <header className='mb-6'>
          <h1 className='text-lg font-semibold tracking-tight text-foreground'>{project.title}</h1>
          <p className='mt-0.5 text-sm text-muted-foreground'>
            {[project.line, `${pieces.length} pieces`, `${versions} ${versions === 1 ? 'version' : 'versions'}`].join(' · ')}
          </p>
        </header>
        <div ref={area}>
          <Tiles
            items={pieces.map(p => ({
              key: p.id,
              visual: p,
              href: versionHref(p),
              title: p.title,
              line: [
                index.families.find(f => f.id === p.family)?.label,
                p.versions.length > 1 ? `${p.versions.length} versions` : '',
                p.selected ? '' : 'Needs a decision',
              ]
                .filter(Boolean)
                .join(' · '),
            }))}
            origins={origins}
            width={width}
            row={200}
          />
        </div>
      </div>
    </main>
  );
}

// Whether the details panel is open, remembered in this browser: Studio often runs beside a coding harness, so the stage
// can take the whole width.
const PANEL = 'visuals:details';
const readPanel = () => {
  try {
    return localStorage.getItem(PANEL) !== 'closed';
  } catch {
    return true;
  }
};

// The piece's versions, oldest to newest, along the bottom of the stage: the nav says which piece you're on, the strip
// says which version. Each is a still of the version at its shape; picking one puts it on stage (or beside the pinned
// one while comparing).
function Strip({
  visual,
  proto,
  current,
  pinned,
  hint,
  onPick,
}: {
  visual: VisualEntry;
  proto: Prototype;
  current: VisualVersion;
  pinned?: VisualVersion;
  hint: string;
  onPick: (version: VisualVersion) => void;
}) {
  const H = 56;
  return (
    <nav aria-label='Versions' className='flex shrink-0 items-end gap-4 border-t border-border px-5 py-3'>
      <ol className='flex min-w-0 flex-1 items-end gap-2 overflow-x-auto pb-0.5 [scrollbar-width:thin]'>
        {visual.versions.map(version => {
          const format = FORMATS[version.format];
          const on = version.studioId === current.studioId;
          const held = version.studioId === pinned?.studioId;
          return (
            <li key={version.studioId} className='shrink-0'>
              <button
                type='button'
                aria-current={on ? 'true' : undefined}
                aria-label={`${versionName(version)}, ${LABEL[version.status]}`}
                onClick={() => !on && onPick(version)}
                className='group flex flex-col items-start gap-1 rounded-md outline-none'
              >
                <Fitted
                  visual={visual}
                  version={version}
                  proto={proto}
                  box={{ width: (H * format.width) / format.height, height: H }}
                  still
                  className={cn(
                    'rounded-md transition-shadow',
                    on || held
                      ? 'ring-2 ring-foreground'
                      : 'group-hover:ring-foreground/30 group-focus-visible:ring-2 group-focus-visible:ring-ring',
                  )}
                />
                <span className='flex items-center gap-1.5 text-[11px] leading-4 text-muted-foreground tabular-nums'>
                  <span aria-hidden className={cn('size-1.5 rounded-full', DOT[version.status])} />
                  <span className={cn(on && 'font-medium text-foreground')}>{versionName(version)}</span>
                  {held && <span>pinned</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      {hint && <p className='hidden shrink-0 pb-5 text-xs text-muted-foreground sm:block'>{hint}</p>}
    </nav>
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
  const [panel, setPanel] = useState(readPanel);
  const togglePanel = () =>
    setPanel(open => {
      try {
        localStorage.setItem(PANEL, open ? 'closed' : 'open');
      } catch {}
      return !open;
    });
  const me = useMe();
  const navigate = useNavigate();
  const versions = visual.versions;
  const current = versions.find(v => v.path === item.path)!;
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [stage, size] = useSize<HTMLDivElement>();
  const at = versions.indexOf(current);
  const pinned = versions.find(v => v.studioId === pinnedId);
  const open = (version: VisualVersion) => void navigate({ to: versionHref(visual, version) as never });
  // ← and → step through the piece's versions, unless you're typing.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('input, textarea, [contenteditable]') || event.metaKey || event.ctrlKey || event.altKey) return;
      const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
      if (step && versions.length > 1) {
        event.preventDefault();
        open(versions[(at + step + versions.length) % versions.length]!);
      }
      if (event.key === 'Escape') setPinnedId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  const family = index.families.find(f => f.id === visual.family);
  const editable = import.meta.env.DEV && canChangePrototype(proto, me);
  // DialKit's build lists the views that use it; null while DialKit is off.
  const dials = contribution<{ views: string[] }>(manifest, 'dialkit');
  const tunable = dials ? dials.views.includes(`src/visuals/${project.id}/${current.path}`) : null;
  const comparing = Boolean(pinned && pinned.studioId !== current.studioId);
  const shown = comparing ? [pinned!, current] : [current];
  const pad = 32;
  const gap = 24;
  const cell = {
    width: (size.width - pad * 2 - gap * (shown.length - 1)) / shown.length,
    height: size.height - pad - 28,
  };
  const step = (by: number) => open(versions[(at + by + versions.length) % versions.length]!);
  const hint = pinned
    ? comparing
      ? 'Pick another version to compare, or press Esc'
      : 'Pick a version to compare'
    : versions.length > 1
      ? '← → to step through versions'
      : '';
  return (
    <main className='flex min-w-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden'>
      <div className='flex min-w-0 shrink-0 flex-col lg:min-h-0 lg:flex-1 lg:shrink'>
        <header className='flex items-start justify-between gap-3 px-5 pt-5'>
          <div className='min-w-0'>
            <h1 className='truncate text-lg font-semibold tracking-tight text-foreground'>{visual.title}</h1>
            <p className='mt-0.5 truncate text-sm text-muted-foreground'>
              {[project.title, family?.label, `${versions.length} ${versions.length === 1 ? 'version' : 'versions'}`]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
          <div className='flex items-center gap-1.5'>
            {versions.length > 1 && (
              <Button
                variant={pinned ? 'secondary' : 'outline'}
                size='sm'
                aria-pressed={Boolean(pinned)}
                onClick={() => setPinnedId(pinned ? null : current.studioId)}
              >
                {pinned ? 'Done comparing' : 'Compare'}
              </Button>
            )}
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label={panel ? 'Hide details' : 'Show details'}
              title={panel ? 'Hide details' : 'Show details'}
              aria-pressed={panel}
              onClick={togglePanel}
            >
              <HugeiconsIcon icon={panel ? PanelRightCloseIcon : PanelRightOpenIcon} />
            </Button>
          </div>
        </header>
        <div
          ref={stage}
          className='relative flex min-h-[360px] flex-1 items-center justify-center lg:min-h-0'
          style={{ gap }}
        >
          {cell.width > 0 &&
            cell.height > 0 &&
            shown.map(version => (
              <figure key={version.studioId} className='flex flex-col items-center gap-2'>
                <figcaption className='text-xs text-muted-foreground tabular-nums'>
                  <span className='font-medium text-foreground'>{versionName(version)}</span>
                  {comparing && version === pinned ? ' · pinned' : ''} · {LABEL[version.status]}
                </figcaption>
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
        <Strip
          visual={visual}
          proto={proto}
          current={current}
          pinned={comparing ? pinned : undefined}
          hint={hint}
          onPick={open}
        />
      </div>
      {panel && <Decision project={project} visual={visual} version={current} proto={proto} editable={editable} tunable={tunable} />}
    </main>
  );
}
