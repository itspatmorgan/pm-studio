import { useEffect, useRef } from 'react';
import { Link } from '@tanstack/react-router';
import type { Snapshot } from './snapshots.ts';

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// One piece in the feed: its clip, playing whenever it's on screen (the poster stays under reduced motion), then its
// title and line. The whole tile opens the piece.
export function SnapshotTile({ entry }: { entry: Snapshot }) {
  const video = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const element = video.current;
    if (!element || reduced()) return;
    const observer = new IntersectionObserver(
      ([seen]) => (seen?.isIntersecting ? void element.play().catch(() => {}) : element.pause()),
      { threshold: 0.3 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <Link
      to={entry.href as never}
      className='group relative mb-4 block break-inside-avoid overflow-hidden rounded-xl bg-card outline-none ring-1 ring-foreground/10 focus-visible:ring-2 focus-visible:ring-ring'
    >
      <video
        ref={video}
        src={entry.clip.video}
        poster={entry.clip.poster}
        muted
        loop
        playsInline
        preload='metadata'
        aria-hidden
        className='block h-auto w-full bg-muted transition-transform duration-500 ease-out group-hover:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover:scale-100'
      />
      <div className='px-3 pt-2.5 pb-3'>
        <div className='text-sm font-semibold text-foreground'>{entry.title}</div>
        <p className='mt-0.5 text-xs leading-relaxed text-muted-foreground'>{entry.line}</p>
      </div>
    </Link>
  );
}
