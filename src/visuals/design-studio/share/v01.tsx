/** @studio-id 09y11yzzmk0tfcdy */
import { Stage, defineVisual } from '@module/visuals';
import { StudioShare } from '@/systems/website/components/design-studio';

// The product page's sharing slide. Its title is the slide's own headline.
export const visual = defineVisual({ format: 'scene' });

export default function View() {
  return (
    <Stage format='scene' className='cs-page sc ds-landing bg-background'>
      <StudioShare />
    </Stage>
  );
}
