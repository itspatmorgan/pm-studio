/** @studio-id wwp6gvvzdx2rtb41 */
import { Stage, defineVisual } from '@module/visuals';
import { JobReview } from '@/systems/website/components/sublime';

// The case study's bet slide, as a visual; its title is the slide's own headline.
export const visual = defineVisual({ format: 'scene' });

export default function View() {
  return (
    <Stage format='scene' className='cs-page sb bg-background'>
      <JobReview />
    </Stage>
  );
}
