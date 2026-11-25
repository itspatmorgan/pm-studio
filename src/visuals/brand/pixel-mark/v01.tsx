/** @studio-id egxhnxp9k7qpmsts */
import { Frame, defineVisual } from '@module/visuals';
import { Logo } from '@/systems/website/components/logo';

// Pixel Mark's snapshot: the four-pixel braille P at three sizes. Its pixels cycle under the pointer.
export const visual = defineVisual({ format: 'board-card' });

export default function Mark() {
  return (
    <Frame format={visual.format} className='bg-card'>
      <div className='flex h-full items-center justify-center gap-10' data-logo-cycle-trigger>
        <Logo trigger='container' className='size-[200px]' />
        <Logo trigger='container' className='size-[96px] opacity-80' />
        <Logo trigger='container' className='size-[48px] opacity-60' />
      </div>
    </Frame>
  );
}
