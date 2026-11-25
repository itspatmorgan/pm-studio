/** @studio-id kke2z7z1nseatfwn */
import { Stage, defineVisual } from '@module/visuals';
import { AdeJobs } from '@/systems/website/components/sublime';

// The case study's outcome slide, as a visual; its title is the slide's own headline.
export const visual = defineVisual({ format: 'scene' });

export default function View() {
  return (
    <Stage format='scene' className='cs-page sb bg-background'>
      <AdeJobs />
    </Stage>
  );
}
