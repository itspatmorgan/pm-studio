import { useEffect, useRef, useState } from 'react';
import { PixelWaveText, enablePixelHover, pixelWave, resetPixelWave, resolvePixelWave } from './pixel-wave-text';
export const Pixel = () => <PixelWaveText text="Pixel type" className="text-4xl font-medium tracking-tight" />;
export const HoverToPixelate = () => {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => (ref.current ? enablePixelHover(ref.current) : undefined), []);
  return <PixelWaveText ref={ref} as="p" text="Hover near these words." initialSans className="text-4xl font-medium tracking-tight" />;
};
// The demo from the retired Pixel Wave lab: the split-flap entrance, then hover, with a replay button.
export const SplitFlapEntrance = () => {
  const ref = useRef<HTMLElement>(null);
  const [run, setRun] = useState(0);
  const [playing, setPlaying] = useState(true);
  useEffect(() => {
    const container = ref.current;
    if (!container) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      resolvePixelWave(container);
      setPlaying(false);
      return;
    }
    const delay = run === 0 ? 250 : 0;
    setPlaying(true);
    resetPixelWave(container);
    const cancel = pixelWave(container, delay);
    let stopHover = () => {};
    const done = setTimeout(() => {
      stopHover = enablePixelHover(container);
      setPlaying(false);
    }, delay + 5000);
    return () => { cancel(); clearTimeout(done); stopHover(); };
  }, [run]);
  return (
    <div className="relative flex min-h-[22rem] w-full items-center justify-center rounded-lg border border-border bg-card px-6 py-16 text-center">
      <PixelWaveText ref={ref} as="p" text="A tactile text reveal for crafted interfaces." className="max-w-3xl text-4xl font-medium leading-tight tracking-tight sm:text-6xl" />
      <button
        type="button"
        aria-label="Play"
        disabled={playing}
        onClick={() => setRun(r => r + 1)}
        className="absolute right-3 bottom-3 flex h-7 w-7 items-center justify-center rounded border border-border text-muted-foreground transition-colors hover:border-foreground hover:text-foreground disabled:opacity-40"
      >
        <svg width="8" height="10" viewBox="0 0 8 10" fill="currentColor" aria-hidden><path d="M0 0l8 5-8 5V0z" /></svg>
      </button>
    </div>
  );
};
