/** @studio-id sw57r7msz8xh6b1d */
import { Stage, defineVisual } from '@module/visuals';
import { StudioAsk } from '@/systems/website/components/design-studio';

// The product page's hero visual, under its headline.
export const visual = defineVisual({ format: 'scene' });

export default function View() {
  return (
    <Stage format='scene' className='cs-page sc ds-landing bg-background'>
      <StudioAsk />
    </Stage>
  );
}
