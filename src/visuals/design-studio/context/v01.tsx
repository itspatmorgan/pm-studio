/** @studio-id ft34pahddcy1fkb8 */
import { Stage, defineVisual } from '@module/visuals';
import { StudioDocs } from '@/systems/website/components/design-studio';

// The product page's context slide. Its title is the slide's own headline.
export const visual = defineVisual({ format: 'board-square' });

export default function View() {
  return (
    <Stage format='board-square' className='cs-page sc ds-landing bg-background' inner='ds-square w-full'>
      <StudioDocs />
    </Stage>
  );
}
