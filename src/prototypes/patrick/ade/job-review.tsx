/** @studio-id wwp6gvvzdx2rtb41 */
import { defineVisual } from '@module/visuals';
import { JobReview } from '@/systems/website/components/sublime';
import { Scene } from './_components/Scene';

// The case study's bet slide, as a visual; its title is the slide's own headline.
export const visual = defineVisual({ format: 'scene', title: 'The agent writes rules that people can read and change' });

export default function View() {
  return <Scene><JobReview /></Scene>;
}
