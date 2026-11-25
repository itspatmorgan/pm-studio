// A visual's own page (/visuals/<id>): what its address shows before a version is opened, beside the visual's navigation.
// Every version at once, drawn live at its format, the selected one first, with its status and note, so you can see where the
// visual stands and open the one to look at closely. Opening one shows it in the viewer, like any prototype's view.
import { Link } from '@tanstack/react-router';
import type { Prototype } from '#studio/data';
import { useManifest } from '#studio/data';
import { cn } from '#studio/runtime';
import { FORMATS } from './lib/formats.ts';
import { Live, data, useNear, useSize, versionHref, versionName } from './shared.tsx';
import type { VisualEntry, VisualVersion } from './visuals.ts';

const STATUS_LABEL = { selected: 'Selected', shortlisted: 'Shortlisted', rejected: 'Rejected', exploring: 'Exploring' };

function VersionCard({ visual, version, proto }: { visual: VisualEntry; version: VisualVersion; proto: Prototype }) {
  const [box, { width }] = useSize<HTMLDivElement>();
  const near = useNear(box, { release: true });
  const format = FORMATS[version.format];
  const item = proto.artifacts.find(a => a.studioId === version.studioId);
  return (
    <li>
      <Link to={versionHref(visual, version) as never} className='group block outline-none'>
        <div
          ref={box}
          className={cn(
            'overflow-hidden rounded-xl bg-card ring-1 ring-border transition-shadow duration-200 group-hover:ring-foreground/25 group-focus-visible:ring-2 group-focus-visible:ring-ring',
            version.status === 'rejected' && 'opacity-50',
          )}
          style={{ aspectRatio: `${format.width} / ${format.height}` }}
        >
          {near && item && (
            <Live
              visual={visual}
              version={version}
              origin={{ proto, item }}
              width={width}
              height={(width * format.height) / format.width}
            />
          )}
        </div>
        <div className='mt-2.5 flex items-center gap-2 px-0.5'>
          <span className='text-sm font-medium text-foreground tabular-nums'>{versionName(version)}</span>
          {version.status !== 'exploring' && (
            <span
              className={cn(
                'rounded-full px-1.5 text-[11px] leading-[18px] font-medium',
                version.status === 'selected' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
              )}
            >
              {STATUS_LABEL[version.status]}
            </span>
          )}
          <span className='ml-auto text-xs text-muted-foreground'>{format.label}</span>
        </div>
        {version.note && <p className='mt-1 px-0.5 text-xs leading-relaxed text-pretty text-muted-foreground'>{version.note}</p>}
      </Link>
    </li>
  );
}

export function VisualPage({ proto }: { proto: Prototype }) {
  const index = data(useManifest());
  const visual = index?.visuals.find(v => v.id === proto.id);
  if (!index || !visual) return null;
  const family = index.families.find(f => f.id === visual.family);
  const collections = visual.collections.map(id => index.collections.find(c => c.id === id)?.label ?? id);
  const formats = [...new Set(visual.versions.map(v => FORMATS[v.format].label))];
  // In the same order as the navigation (nav.tsx): the selected one first, then the newest, the rejected ones last.
  const rank = { selected: 0, shortlisted: 1, exploring: 1, rejected: 2 };
  const versions = [...visual.versions].reverse().sort((a, b) => rank[a.status] - rank[b.status]);
  const count = `${versions.length} ${versions.length === 1 ? 'version' : 'versions'}`;
  return (
    <main className='min-w-0 flex-1 overflow-y-auto'>
      <div className='mx-auto w-full max-w-5xl px-6 pt-10 pb-16'>
        <header className='mb-8'>
          <h1 className='text-2xl font-semibold tracking-tight text-foreground'>{visual.title}</h1>
          <p className='mt-1 flex flex-wrap items-center gap-x-1.5 text-sm text-muted-foreground'>
            {[family?.label, ...collections, formats.join(', '), count].filter(Boolean).map((part, i) => (
              <span key={i} className='flex items-center gap-1.5'>
                {i > 0 && <span aria-hidden>·</span>}
                {part}
              </span>
            ))}
          </p>
          {!visual.selected && (
            <p className='mt-3 text-sm text-foreground'>No version is selected yet, so this visual has nothing to show elsewhere.</p>
          )}
        </header>
        <h2 className='mb-3 text-sm font-semibold text-foreground'>Versions</h2>
        <ul className='grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 xl:grid-cols-3'>
          {versions.map(version => (
            <VersionCard key={version.studioId} visual={visual} version={version} proto={proto} />
          ))}
        </ul>
      </div>
    </main>
  );
}
