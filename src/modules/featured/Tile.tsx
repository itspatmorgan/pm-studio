import { useRef } from 'react';
import { Link } from '@tanstack/react-router';
import { cn } from '#studio/runtime';
import type { FeaturedEntry } from './featured.ts';

const SPAN: Record<FeaturedEntry['size'], string> = {
  large: 'sm:col-span-2 sm:row-span-2',
  wide: 'sm:col-span-2',
  tall: 'sm:row-span-2',
  small: '',
};

const still = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// One piece of featured work: its recorded snapshot, which plays while the tile is hovered or focused (the poster
// stays under reduced motion), then its title and line. The whole tile opens the piece.
export function Tile({ entry, compact = false }: { entry: FeaturedEntry; compact?: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const play = () => {
    if (!still()) void video.current?.play().catch(() => {});
  };
  const stop = () => {
    const v = video.current;
    if (!v) return;
    v.pause();
    v.currentTime = 0;
  };
  return (
    <Link
      to={entry.href as never}
      onMouseEnter={play}
      onMouseLeave={stop}
      onFocus={play}
      onBlur={stop}
      className={cn(
        'group flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card outline-none transition-colors hover:border-foreground/20 focus-visible:ring-2 focus-visible:ring-ring',
        !compact && SPAN[entry.size],
      )}
    >
      <div
        className={cn('relative overflow-hidden bg-muted', !compact && 'min-h-40 flex-1')}
        style={compact ? { aspectRatio: '16 / 9' } : undefined}
      >
        <video
          ref={video}
          src={entry.snapshot.clip}
          poster={entry.snapshot.poster}
          muted
          loop
          playsInline
          preload='none'
          aria-hidden
          className='absolute inset-0 size-full object-contain'
        />
      </div>
      <div className='grid gap-0.5 px-4 py-3'>
        <span className='text-sm font-semibold text-foreground'>{entry.title}</span>
        <span className={cn('text-xs leading-relaxed text-muted-foreground', compact && 'line-clamp-1')}>{entry.line}</span>
      </div>
    </Link>
  );
}
