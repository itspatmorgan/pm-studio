/** @studio-id kqsfhhasrj68d8bx */
import { Stage, defineVisual } from '@module/visuals';
import { AutoAccepted } from '@/systems/website/components/sublime';

// The case study's evidence slide, as a visual; its title is the slide's own headline.
export const visual = defineVisual({ format: 'scene' });

export default function View() {
  return (
    <Stage format='scene' className='cs-page sb bg-background'>
      <AutoAccepted />
    </Stage>
  );
}
