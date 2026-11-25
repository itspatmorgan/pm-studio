// A visual project's own page, beside its navigation, which lists the project's pieces, one row each (nav.tsx).
//
// - At the project's address (/visuals/<project>) it shows Selected, the version picked for each piece, with the pieces
//   still to decide after them; the navigation's top row (nav.tsx) is this page. A project of one piece opens that piece.
// - At a version's address (/visuals/<project>/<piece>/v03) it shows that piece: the version large, playing, at its true
//   shape. ← and → step through the piece's versions. Compare pins the version on stage and puts the next one you pick
//   beside it, from the film strip or with the arrow keys, so you can cycle candidates against the one you like.
// - It is one column, for the narrow pane Studio often gets beside a coding harness, in three layers that each answer one
//   question. The header says which piece (and its project and format). The stage shows the version. The versions
//   panel under it holds everything about versions: the film strip that picks one, Compare, and, beside the strip, the
//   version on stage with its status, Tune when it has DialKit dials, your note, and "Ask for vNN", which copies a prompt
//   with that note for the agent. The panel folds down to one line that still names the version and its status. Status
//   and note save to _iterations.json through the module's route (server.ts).
//
// Performance: only the stage plays; the project's tiles play while pointed at.
import { useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowDown01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Copy01Icon,
  SlidersHorizontalIcon,
} from '@hugeicons/core-free-icons';
import type { Artifact, Prototype } from '#studio/data';
import { callModule, canChangePrototype, contribution, useManifest, useMe } from '#studio/data';
import { cn } from '#studio/runtime';
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  Textarea,
  toast,
} from '#studio/components';
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

// The project's page, Selected, which has its own row at the top of the navigation: the version picked for each piece, in
// the project's order, as the set the project has settled on. Pieces with no pick yet follow under "To decide", each at
// its newest version, so the page also says what's left.
function ProjectPage({ project, pieces }: { project: VisualProject; pieces: VisualEntry[] }) {
  const manifest = useManifest();
  const index = data(manifest)!;
  const stable = useStable(pieces);
  const origins = useOrigins(manifest, stable);
  const [area, { width }] = useSize<HTMLDivElement>();
  const decided = pieces.filter(p => p.selected);
  const open = pieces.filter(p => !p.selected);
  const family = (p: VisualEntry) => index.families.find(f => f.id === p.family)?.label;
  const count = (n: number) => `${n} ${n === 1 ? 'version' : 'versions'}`;
  return (
    <main className='min-w-0 flex-1 overflow-y-auto'>
      <div ref={area} className='mx-auto w-full max-w-5xl px-6 pt-8 pb-16'>
        <header className='mb-6'>
          <h1 className='text-lg font-semibold tracking-tight text-foreground'>Selected</h1>
          <p className='mt-0.5 text-sm text-muted-foreground'>
            {open.length
              ? `The version picked for each piece of ${project.title}. ${decided.length} of ${pieces.length} pieces decided.`
              : `The version picked for each piece of ${project.title}.`}
          </p>
        </header>
        {decided.length > 0 && (
          <Tiles
            items={decided.map(p => ({
              key: p.id,
              visual: p,
              href: versionHref(p),
              title: p.title,
              line: [versionName(p.selected!), family(p)].filter(Boolean).join(' · '),
            }))}
            origins={origins}
            width={width}
            row={200}
          />
        )}
        {open.length > 0 && (
          <section className={cn(decided.length > 0 && 'mt-12')}>
            <h2 className='mb-1 text-sm font-semibold text-foreground'>To decide</h2>
            <p className='mb-4 text-sm text-muted-foreground'>No version picked yet. Each shows its newest.</p>
            <Tiles
              items={open.map(p => ({
                key: p.id,
                visual: p,
                href: versionHref(p),
                title: p.title,
                line: [count(p.versions.length), family(p)].filter(Boolean).join(' · '),
              }))}
              origins={origins}
              width={width}
              row={160}
            />
          </section>
        )}
      </div>
    </main>
  );
}

// The version's status, as a compact menu in the header: the dot and word say where it stands, and the menu moves it.
function StatusMenu({
  version,
  editable,
  saving,
  onChange,
}: {
  version: VisualVersion;
  editable: boolean;
  saving: boolean;
  onChange: (status: Status) => void;
}) {
  const face = (
    <>
      <span aria-hidden className={cn('size-1.5 rounded-full', DOT[version.status])} />
      {LABEL[version.status]}
    </>
  );
  if (!editable)
    return <span className='flex h-7 items-center gap-1.5 px-2 text-xs text-muted-foreground'>{face}</span>;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={saving}
        render={<Button variant='ghost' size='sm' className='gap-1.5 text-xs' aria-label={`Status: ${LABEL[version.status]}`} />}
      >
        {face}
        <HugeiconsIcon icon={ArrowDown01Icon} aria-hidden className='text-muted-foreground' />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='start' className='w-44'>
        <DropdownMenuRadioGroup value={version.status} onValueChange={next => onChange(next as Status)}>
          {ORDER.map(status => (
            <DropdownMenuRadioItem key={status} value={status} className='gap-2'>
              <span aria-hidden className={cn('size-1.5 rounded-full', DOT[status])} />
              {LABEL[status]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Whether the versions panel is open, remembered in this browser, so the stage can take the whole height when you want.
const PANEL = 'visuals:versions';
const readPanel = () => {
  try {
    return localStorage.getItem(PANEL) !== 'closed';
  } catch {
    return true;
  }
};

const iconButton =
  'grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring';

// The one panel under the stage, and the only place versions are handled. Its first line names it ("Versions"), with
// Compare and the fold. Open, the film strip picks a version, and beside it the version on stage carries its status,
// Tune, your note and "Ask for vNN". Folded, the line still says which version is on stage and where it stands.
function Versions({
  project,
  visual,
  proto,
  current,
  pinned,
  comparing,
  editable,
  tunable,
  onPick,
  onCompare,
  onTune,
}: {
  project: VisualProject;
  visual: VisualEntry;
  proto: Prototype;
  current: VisualVersion;
  pinned?: VisualVersion;
  comparing: boolean;
  editable: boolean;
  tunable: boolean;
  onPick: (version: VisualVersion) => void;
  onCompare: () => void;
  onTune: () => void;
}) {
  const [open, setOpen] = useState(readPanel);
  const toggle = () =>
    setOpen(was => {
      try {
        localStorage.setItem(PANEL, was ? 'closed' : 'open');
      } catch {}
      return !was;
    });
  const { save, saving } = useSave(proto);
  const [note, setNote] = useState(current.note ?? '');
  useEffect(() => setNote(current.note ?? ''), [current.studioId, current.note]);
  const dirty = note.trim() !== (current.note ?? '');
  const commit = () => dirty && void save(current.studioId, { note: note.trim() });
  const versions = visual.versions;
  const name = versionName(current);
  const next = `v${String(versions.length + 1).padStart(2, '0')}`;
  const prompt = `Make ${next} of "${visual.title}", a piece of the visual project ${project.title} (src/visuals/${visual.id}/), from ${name}${
    note.trim() ? `: ${note.trim()}` : '.'
  }`;
  const H = 56;
  const hint = pinned
    ? comparing
      ? 'Pick another to compare with the pinned one · Esc to stop'
      : `${versionName(pinned)} is pinned · pick a version to compare`
    : versions.length > 1
      ? '← → steps through versions'
      : '';
  return (
    <section aria-label='Versions' className='@container shrink-0 border-t border-border'>
      <div className='flex h-10 items-center gap-2 px-4'>
        <button
          type='button'
          onClick={toggle}
          aria-expanded={open}
          className='-ml-1 flex h-7 shrink-0 items-center gap-1.5 rounded-md px-1.5 text-xs outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring'
        >
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            size={14}
            className={cn('text-muted-foreground transition-transform', !open && 'rotate-180')}
          />
          <span className='font-medium text-foreground'>Versions</span>
          <span className='text-muted-foreground tabular-nums'>{versions.length}</span>
        </button>
        {!open && (
          <p className='flex min-w-0 flex-1 items-center gap-1.5 truncate text-xs text-muted-foreground'>
            <span aria-hidden>·</span>
            <span className='font-medium text-foreground tabular-nums'>{name}</span>
            <span aria-hidden className={cn('size-1.5 shrink-0 rounded-full', DOT[current.status])} />
            {LABEL[current.status]}
            {current.note && <span className='truncate'>· {current.note}</span>}
          </p>
        )}
        <div className='ml-auto flex shrink-0 items-center gap-3'>
          {open && hint && <p className='hidden text-xs text-muted-foreground md:block'>{hint}</p>}
          {versions.length > 1 && (
            <Button variant={pinned ? 'secondary' : 'ghost'} size='sm' aria-pressed={Boolean(pinned)} onClick={onCompare}>
              {pinned ? 'Done comparing' : 'Compare'}
            </Button>
          )}
        </div>
      </div>
      {open && (
        <div className='flex flex-col gap-3 px-4 pb-4 @3xl:flex-row @3xl:items-stretch @3xl:gap-5'>
          <ol aria-label='Pick a version' className='flex min-w-0 shrink-0 items-start gap-2 overflow-x-auto pt-0.5 pb-0.5 @3xl:max-w-[50%]'>
            {versions.map(version => {
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
          <div className='flex min-w-0 flex-1 flex-col gap-2 @3xl:border-l @3xl:border-border @3xl:pl-5'>
            <div className='flex items-center gap-1'>
              <span className='mr-1 text-sm font-semibold text-foreground tabular-nums'>{name}</span>
              <StatusMenu
                version={current}
                editable={editable}
                saving={saving}
                onChange={status => status !== current.status && void save(current.studioId, { status })}
              />
              {tunable && (
                <button
                  type='button'
                  className={iconButton}
                  aria-label={`Tune ${name} with DialKit`}
                  title={`Tune ${name} with DialKit (Save to code changes this version)`}
                  onClick={onTune}
                >
                  <HugeiconsIcon icon={SlidersHorizontalIcon} size={16} />
                </button>
              )}
              {editable && (
                <Button
                  variant='outline'
                  size='sm'
                  className='ml-auto shrink-0 gap-2'
                  disabled={saving}
                  title={`Copies a prompt for ${next}, with your note, to give your agent`}
                  onClick={() => {
                    commit();
                    void navigator.clipboard.writeText(prompt).then(() => toast.add({ title: `Prompt for ${next} copied` }));
                  }}
                >
                  <HugeiconsIcon icon={Copy01Icon} aria-hidden />
                  Ask for {next}
                </Button>
              )}
            </div>
            {editable ? (
              <div className='flex'>
                <Textarea
                  aria-label={`Note on ${name}`}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  onBlur={commit}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) commit();
                  }}
                  placeholder='Note: what works, what to change next'
                  className='min-h-[44px] flex-1 resize-none text-sm'
                  rows={2}
                />

              </div>
            ) : (
              <p className='text-sm text-pretty text-foreground'>
                {current.note || <span className='text-muted-foreground'>No note</span>}
              </p>
            )}
          </div>
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
  const versions = visual.versions;
  const current = versions.find(v => v.path === item.path)!;
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [stage, size] = useSize<HTMLDivElement>();
  const at = versions.indexOf(current);
  const pinned = versions.find(v => v.studioId === pinnedId);
  const open = (version: VisualVersion) => void navigate({ to: versionHref(visual, version) as never });
  const step = (by: number) => open(versions[(at + by + versions.length) % versions.length]!);
  // ← and → step through the piece's versions, unless you're typing.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('input, textarea, [contenteditable]') || event.metaKey || event.ctrlKey || event.altKey) return;
      const by = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
      if (by && versions.length > 1) {
        event.preventDefault();
        step(by);
      }
      if (event.key === 'Escape') setPinnedId(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
  const family = index.families.find(f => f.id === visual.family);
  const editable = import.meta.env.DEV && canChangePrototype(proto, me);
  // DialKit's build lists the views that use it; Tune shows only for a version that has dials.
  const dials = contribution<{ views: string[] }>(manifest, 'dialkit');
  const tunable = Boolean(editable && dials?.views.includes(`src/visuals/${project.id}/${current.path}`));
  const comparing = Boolean(pinned && pinned.studioId !== current.studioId);
  const shown = comparing ? [pinned!, current] : [current];
  // Room for the ← → buttons beside the visual.
  const padX = versions.length > 1 ? 52 : 24;
  const padY = 24;
  const gap = 24;
  const cell = {
    width: (size.width - padX * 2 - gap * (shown.length - 1)) / shown.length,
    height: size.height - padY * 2 - (comparing ? 24 : 0),
  };
  return (
    <main className='flex min-h-0 min-w-0 flex-1 flex-col'>
      <header className='shrink-0 px-5 pt-4'>
        <h1 className='truncate text-base font-semibold tracking-tight text-foreground'>{visual.title}</h1>
        <p className='truncate text-xs text-muted-foreground'>
          {[project.title, family?.label, FORMATS[current.format].label].filter(Boolean).join(' · ')}
        </p>
      </header>
      <div ref={stage} className='relative flex min-h-[280px] flex-1 items-center justify-center' style={{ gap }}>
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
        {versions.length > 1 && !comparing && (
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
        comparing={comparing}
        editable={editable}
        tunable={tunable}
        onPick={open}
        onCompare={() => setPinnedId(pinned ? null : current.studioId)}
        onTune={() => void navigate({ to: versionHref(visual, current) as never, search: { mode: 'viewer' } as never })}
      />
    </main>
  );
}
