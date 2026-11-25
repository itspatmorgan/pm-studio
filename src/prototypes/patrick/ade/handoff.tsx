/** @studio-id 58gsfzx4wepf2qqa */
import { defineVisual } from '@module/visuals';
import { MessageDetail } from '@/systems/website/components/sublime';
import { Scene } from './_components/Scene';

// The case study's handoff slide, as a visual; its title is the slide's own headline.
export const visual = defineVisual({ format: 'scene', title: 'The agent starts where the team finds the threat' });

export default function View() {
  return <Scene><MessageDetail variant="handoff" /></Scene>;
}
