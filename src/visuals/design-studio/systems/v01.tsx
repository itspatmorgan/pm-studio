/** @studio-id mkq0thtg17g7bwaa */
import { Stage, defineVisual } from '@module/visuals';
import { StudioSystems } from '@/systems/website/components/design-studio';

// The product page's systems slide. Its title is the slide's own headline.
export const visual = defineVisual({ format: 'board-square' });

export default function View() {
  return (
    <Stage format='board-square' className='cs-page sc ds-landing bg-background' inner='ds-square w-full'>
      <StudioSystems />
    </Stage>
  );
}
