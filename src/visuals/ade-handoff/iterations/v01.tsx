/** @studio-id 58gsfzx4wepf2qqa */
import { Stage, defineVisual } from '@module/visuals';
import { MessageDetail } from '@/systems/website/components/sublime';

// The case study's handoff slide, as a visual; its title is the slide's own headline.
export const visual = defineVisual({ format: 'scene' });

export default function View() {
  return (
    <Stage format='scene' className='cs-page sb bg-background'>
      <MessageDetail variant='handoff' />
    </Stage>
  );
}
