/** @studio-id gk7aafyjzhzrnc39 */
import { Stage, defineVisual } from '@module/visuals';
import { StudioRange } from '@/systems/website/components/design-studio';

// The product page's second slide. Its title is the slide's own headline.
export const visual = defineVisual({ format: 'scene' });

export default function View() {
  return (
    <Stage format='scene' className='cs-page sc ds-landing bg-background'>
      <StudioRange />
    </Stage>
  );
}
