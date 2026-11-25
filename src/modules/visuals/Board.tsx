// Snapshots: the board of the visuals the studio leads with, across the front page. Every tile is the visual's selected
// version, live. The board is laid out in justified rows: each tile grows by its format's aspect ratio, so a row's tiles
// share one height exactly, whatever their shapes. Hovering a tile lights it and dims the rest, with its name following
// the pointer; opening it grows the peek out of the tile.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link } from '@tanstack/react-router';
import type { ArtifactContext, Manifest } from '#studio/data';
import { cn } from '#studio/runtime';
import { Go, Live, data, sizeOf, useNear, useOrigins, useSize, useStable } from './shared.tsx';
import type { Snapshot } from './snapshots.ts';
import type { VisualEntry } from './visuals.ts';

type Piece = { snapshot: Snapshot; visual: VisualEntry };
const SPAN = { wide: 8, third: 4, half: 6 } as const;
const EASE = 'cubic-bezier(0.2, 0.8, 0.2, 1)';
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// The board's rows: snapshots in order, a row closing when its tiles fill the twelve columns.
function rowsOf(pieces: Piece[]) {
  const rows: { piece: Piece; index: number }[][] = [];
  let row: { piece: Piece; index: number }[] = [];
  let used = 0;
  pieces.forEach((piece, index) => {
    row.push({ piece, index });
    used += SPAN[piece.snapshot.tile];
    if (used >= 12) {
      rows.push(row);
      row = [];
      used = 0;
    }
  });
  if (row.length) rows.push(row);
  return rows;
}

function Tile({
  piece,
  origin,
  dimmed,
  paused,
  onHover,
  onOpen,
  tileRef,
}: {
  piece: Piece;
  origin?: ArtifactContext;
  dimmed: boolean;
  paused: boolean;
  onHover: (on: boolean) => void;
  onOpen: (from: DOMRect) => void;
  tileRef: (el: HTMLButtonElement | null) => void;
}) {
  const [box, { width }] = useSize<HTMLDivElement>();
  // The board is the showcase, so its tiles play, but only while on screen, and not while a peek covers them.
  const visible = useNear(box, { release: true });
  const label = useRef<HTMLSpanElement>(null);
  const { width: w, height: h } = sizeOf(piece.visual);
  const { snapshot } = piece;
  // The name rides just below and right of the pointer, kept inside the tile.
  const follow = (event: React.PointerEvent<HTMLButtonElement>) => {
    const el = label.current;
    if (!el || event.pointerType !== 'mouse') return;
    const r = event.currentTarget.getBoundingClientRect();
    const x = Math.min(event.clientX - r.left + 16, r.width - el.offsetWidth - 12);
    const y = Math.min(event.clientY - r.top + 18, r.height - el.offsetHeight - 12);
    el.style.transform = `translate(${Math.max(12, x)}px, ${Math.max(12, y)}px)`;
  };
  return (
    <button
      ref={tileRef}
      type='button'
      onClick={event => onOpen(event.currentTarget.getBoundingClientRect())}
      onPointerEnter={() => onHover(true)}
      onPointerLeave={() => onHover(false)}
      onPointerMove={follow}
      onFocus={() => onHover(true)}
      onBlur={() => onHover(false)}
      aria-label={`${snapshot.title}. ${snapshot.line}`}
      style={{ '--grow': w / h, aspectRatio: `${w} / ${h}` } as React.CSSProperties}
      className={cn(
        'group relative block w-full min-w-0 cursor-zoom-in lg:[flex:var(--grow)_1_0%] overflow-hidden rounded-[18px] bg-card text-left outline-none ring-1 ring-border transition-[opacity,box-shadow,transform] duration-500 ease-out hover:-translate-y-[2px] hover:shadow-[0_18px_40px_-18px_rgb(0_0_0/0.35)] hover:ring-foreground/20 focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none motion-reduce:hover:translate-y-0',
        dimmed && 'opacity-55',
      )}
    >
      <div ref={box} className='absolute inset-0'>
        <Live visual={piece.visual} origin={origin} width={width} height={(width * h) / w} still={!visible || paused} />
      </div>
      {/* Pointer devices: the name follows the pointer. Touch: it sits in the corner. */}
      <span
        ref={label}
        className='pointer-events-none absolute top-0 left-0 hidden items-center gap-2 rounded-full bg-foreground py-1.5 pr-3.5 pl-3 text-xs font-medium whitespace-nowrap text-background opacity-0 shadow-sm transition-opacity duration-200 group-hover:opacity-100 [@media(hover:hover)]:flex'
      >
        {snapshot.title.length > 42 ? snapshot.line : snapshot.title}
        <span aria-hidden className='opacity-60'>
          Open
        </span>
      </span>
      <span className='pointer-events-none absolute bottom-3 left-3 max-w-[calc(100%-24px)] truncate rounded-full bg-background/85 px-3 py-1.5 text-xs font-medium text-foreground ring-1 ring-border backdrop-blur-[8px] [@media(hover:hover)]:hidden'>
        {snapshot.line}
      </span>
    </button>
  );
}

function Peek({
  pieces,
  index,
  origins,
  from,
  tileRect,
  onIndex,
  onClosed,
}: {
  pieces: Piece[];
  index: number;
  origins: Record<string, ArtifactContext>;
  from: DOMRect;
  tileRect: (i: number) => DOMRect | undefined;
  onIndex: (i: number) => void;
  onClosed: () => void;
}) {
  const { snapshot, visual } = pieces[index]!;
  const { width: w, height: h } = sizeOf(visual);
  const [stage, size] = useSize<HTMLDivElement>();
  const art = useRef<HTMLDivElement>(null);
  const scrim = useRef<HTMLDivElement>(null);
  const aside = useRef<HTMLElement>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const opened = useRef(false);
  const [ready, setReady] = useState(false);
  const closing = useRef(false);
  const scale = size.width && size.height ? Math.min(size.width / w, size.height / h) : 0;

  // The transform that puts the visual where a tile is.
  const toward = (rect: DOMRect) => {
    const target = art.current!.getBoundingClientRect();
    return `translate(${rect.left - target.left}px, ${rect.top - target.top}px) scale(${rect.width / target.width}, ${rect.height / target.height})`;
  };
  // Opening: the scrim and the words fade in at once; the visual waits until its live view has drawn (so a blank frame
  // never grows), then grows out of the tile. A view that takes too long simply appears.
  useEffect(() => {
    if (reducedMotion()) {
      setReady(true);
      return;
    }
    scrim.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320, easing: 'ease-out' });
    aside.current?.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], {
      duration: 420,
      delay: 120,
      easing: EASE,
      fill: 'backwards',
    });
  }, []);
  useEffect(() => {
    if (ready || !scale) return;
    const started = Date.now();
    const timer = setInterval(() => {
      const frame = art.current?.querySelector('iframe');
      let drawn = false;
      try {
        drawn = Boolean(frame?.contentDocument?.querySelector('[data-visual-format]'));
      } catch {
        drawn = true; // a preview served from elsewhere can't be looked into; show it
      }
      if (drawn || Date.now() - started > 2500) {
        clearInterval(timer);
        // One more frame, so the view has painted before it moves.
        setTimeout(() => setReady(true), 80);
      }
    }, 50);
    return () => clearInterval(timer);
  }, [scale, ready]);
  useLayoutEffect(() => {
    if (!ready || opened.current || !art.current) return;
    opened.current = true;
    if (reducedMotion()) return;
    art.current.animate([{ transform: toward(from), borderRadius: '18px' }, { transform: 'none' }], { duration: 560, easing: EASE });
  }, [ready]);
  // Moving between snapshots: the next one settles in place.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (!reducedMotion())
      art.current?.animate([{ opacity: 0, transform: 'scale(0.985)' }, { opacity: 1, transform: 'none' }], { duration: 360, easing: EASE });
  }, [index]);

  // Closing: back into its tile, when the tile is on screen; otherwise a fade.
  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    const rect = tileRect(index);
    if (reducedMotion() || !art.current) return onClosed();
    const visible = rect && rect.bottom > 0 && rect.top < window.innerHeight;
    const done = visible
      ? art.current.animate([{ transform: 'none' }, { transform: toward(rect) }], { duration: 420, easing: EASE, fill: 'forwards' })
      : art.current.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' });
    scrim.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, easing: 'ease-in', fill: 'forwards' });
    aside.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: 'forwards' });
    done.finished.then(onClosed, onClosed);
  }, [index, tileRect, onClosed]);

  const step = useCallback((by: number) => onIndex((index + by + pieces.length) % pieces.length), [index, onIndex, pieces.length]);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
      else if (event.key === 'ArrowRight') step(1);
      else if (event.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [close, step]);
  useEffect(() => dialog.current?.focus(), []);

  const arrow =
    'flex size-11 items-center justify-center rounded-full bg-background/70 text-foreground ring-1 ring-border backdrop-blur-[8px] transition-colors hover:bg-background focus-visible:ring-2 focus-visible:ring-ring outline-none';
  return (
    <div ref={dialog} role='dialog' aria-modal='true' aria-label={snapshot.title} tabIndex={-1} className='fixed inset-0 z-50 outline-none'>
      <div ref={scrim} className='absolute inset-0 bg-background/92 backdrop-blur-[16px]' onClick={close} />
      <div className='pointer-events-none relative grid h-full grid-cols-1 grid-rows-[minmax(0,1fr)_auto] gap-6 p-4 sm:p-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:grid-rows-1 lg:gap-12 lg:p-12 lg:pl-20'>
        <div ref={stage} className='flex min-h-0 items-center justify-center'>
          {scale > 0 && (
            <div
              ref={art}
              key={visual.id}
              className='pointer-events-auto origin-top-left overflow-hidden rounded-[22px] shadow-[0_40px_80px_-30px_rgb(0_0_0/0.45)] ring-1 ring-border'
              style={{ width: w * scale, height: h * scale, opacity: ready ? 1 : 0 }}
            >
              <Live visual={visual} origin={origins[visual.id]} width={w * scale} height={h * scale} interactive />
            </div>
          )}
        </div>
        <aside ref={aside} className='pointer-events-auto flex flex-col justify-center pb-2 lg:pb-0'>
          <div className='text-sm text-muted-foreground'>{snapshot.line}</div>
          <h2 className='mt-1.5 text-[26px] leading-[1.15] font-semibold tracking-tight text-balance text-foreground'>{snapshot.title}</h2>
          <p className='mt-4 text-[15px] leading-relaxed text-pretty text-muted-foreground'>{snapshot.summary}</p>
          <div className='mt-7 flex flex-col gap-2'>
            {snapshot.links.map((link, i) => (
              <Go
                key={link.href}
                href={link.href}
                className={cn(
                  'inline-flex h-11 items-center justify-between gap-3 rounded-full px-5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  i === 0 ? 'bg-foreground text-background hover:bg-foreground/90' : 'text-foreground ring-1 ring-border hover:bg-muted',
                )}
              >
                {link.label}
              </Go>
            ))}
          </div>
          <div className='mt-8 flex items-center gap-1.5' aria-hidden>
            {pieces.map((p, i) => (
              <span key={p.visual.id} className={cn('h-1 rounded-full transition-all duration-500', i === index ? 'w-6 bg-foreground' : 'w-1.5 bg-foreground/20')} />
            ))}
            <span className='ml-2 text-xs text-muted-foreground tabular-nums'>
              {index + 1} of {pieces.length}
            </span>
          </div>
        </aside>
      </div>
      <button type='button' onClick={close} aria-label='Close' className={cn(arrow, 'absolute top-4 right-4 sm:top-6 sm:right-6')}>
        <span aria-hidden className='text-lg leading-none'>
          ×
        </span>
      </button>
      <div className='absolute inset-x-4 bottom-4 flex justify-between sm:inset-x-6 lg:inset-x-auto lg:top-1/2 lg:bottom-auto lg:left-6 lg:-translate-y-1/2 lg:flex-col lg:gap-3'>
        <button type='button' onClick={() => step(-1)} aria-label='Previous snapshot' className={arrow}>
          <span aria-hidden>←</span>
        </button>
        <button type='button' onClick={() => step(1)} aria-label='Next snapshot' className={arrow}>
          <span aria-hidden>→</span>
        </button>
      </div>
    </div>
  );
}

export function Board({ manifest }: { manifest: Manifest }) {
  const index = data(manifest);
  const pieces: Piece[] = [];
  for (const snapshot of index?.snapshots ?? []) {
    const visual = index!.visuals.find(v => v.id === snapshot.visual);
    if (visual?.selected) pieces.push({ snapshot, visual });
  }
  const visuals = useStable(pieces.map(p => p.visual));
  const origins = useOrigins(manifest, visuals);
  const [open, setOpen] = useState<{ index: number; from: DOMRect } | null>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const tiles = useRef<(HTMLButtonElement | null)[]>([]);
  const tileRect = useCallback((i: number) => tiles.current[i]?.getBoundingClientRect(), []);
  const closed = useCallback(() => {
    setOpen(current => {
      if (current) tiles.current[current.index]?.focus({ preventScroll: true });
      return null;
    });
  }, []);
  // The tiles rise in, one after another, the first time the board appears.
  const entered = useRef(false);
  useEffect(() => {
    if (entered.current || !pieces.length || reducedMotion()) return;
    entered.current = true;
    tiles.current.forEach((el, i) =>
      el?.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], {
        duration: 700,
        delay: 120 + i * 70,
        easing: EASE,
        fill: 'backwards',
      }),
    );
  }, [pieces.length]);
  if (!pieces.length) return null;
  return (
    <section aria-label='Snapshots' className='mx-auto w-full max-w-[1600px] px-4 pb-20 sm:px-6'>
      <div className='mb-4 flex items-baseline justify-between px-1'>
        <h2 className='text-sm font-medium text-foreground'>Snapshots</h2>
        <Link to={'/visuals' as never} className='text-sm text-muted-foreground transition-colors hover:text-foreground'>
          All visuals →
        </Link>
      </div>
      <div className='flex flex-col gap-3 sm:gap-4'>
        {rowsOf(pieces).map(row => (
          <div key={row[0]!.piece.visual.id} className='flex flex-col gap-3 sm:gap-4 lg:flex-row'>
            {row.map(({ piece, index: i }) => (
              <Tile
                key={piece.visual.id}
                piece={piece}
                origin={origins[piece.visual.id]}
                dimmed={hovered !== null && hovered !== i}
                paused={open !== null}
                onHover={on => setHovered(current => (on ? i : current === i ? null : current))}
                onOpen={from => setOpen({ index: i, from })}
                tileRef={el => {
                  tiles.current[i] = el;
                }}
              />
            ))}
          </div>
        ))}
      </div>
      {open && (
        <Peek
          pieces={pieces}
          index={open.index}
          from={open.from}
          origins={origins}
          tileRect={tileRect}
          onIndex={i => setOpen(current => current && { ...current, index: i })}
          onClosed={closed}
        />
      )}
    </section>
  );
}
