/** @studio-id pgr4q1fzn0j1d43x */
import { defineVisual } from '@module/visuals';
import { MessageDetail } from '@/systems/website/components/sublime';
import { Scene } from './_components/Scene';

// The case study's problem slide, as a visual; its title is the slide's own headline.
export const visual = defineVisual({ format: 'scene', title: 'Each missed threat needed a new rule' });

export default function View() {
  return <Scene><MessageDetail variant="gap" /></Scene>;
}
