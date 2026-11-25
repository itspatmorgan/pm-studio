/** @studio-id kr6jxa701c70653w */
import { useEffect, useRef } from 'react';
import { Frame, defineVisual } from '@module/visuals';
import {
  PixelWaveText,
  enablePixelHover,
  pixelWave,
  resetPixelWave,
  resolvePixelWave,
} from '@/systems/website/components/pixel-wave-text';
import { useReduced } from '@/systems/website/components/theme-hooks';

// Pixel Wave's snapshot: the split-flap reveal on a loop. Between plays the words pixelate under the pointer.
export const visual = defineVisual({ format: 'board-companion', loop: { seconds: 11 }, still: 6 });

export default function Wave() {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReduced();
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduced) {
      resolvePixelWave(el);
      return;
    }
    let cancel = () => {};
    let stopHover = () => {};
    let timer: ReturnType<typeof setTimeout>;
    const play = (delay: number) => {
      stopHover();
      resetPixelWave(el);
      cancel = pixelWave(el, delay);
      timer = setTimeout(() => {
        stopHover = enablePixelHover(el);
        timer = setTimeout(() => play(0), 6000);
      }, delay + 5000);
    };
    play(300);
    return () => {
      cancel();
      stopHover();
      clearTimeout(timer);
    };
  }, [reduced]);
  return (
    <Frame format={visual.format} className='texture-bg'>
      <div className='flex h-full items-center px-12'>
        <PixelWaveText
          ref={ref}
          as='p'
          text='Designer who builds.'
          className='text-[88px] leading-[1.02] font-medium tracking-tight text-foreground'
        />
      </div>
    </Frame>
  );
}
