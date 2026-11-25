/** @studio-id pgr4q1fzn0j1d43x */
import { Stage, defineVisual } from '@module/visuals';
import { MessageDetail } from '@/systems/website/components/sublime';

// The case study's problem slide, as a visual; its title is the slide's own headline.
export const visual = defineVisual({ format: 'scene' });

export default function View() {
  return (
    <Stage format='scene' className='cs-page sb bg-background'>
      <MessageDetail variant='gap' />
    </Stage>
  );
}
