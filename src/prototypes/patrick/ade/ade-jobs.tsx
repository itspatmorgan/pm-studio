/** @studio-id kke2z7z1nseatfwn */
import { defineVisual } from '@module/visuals';
import { AdeJobs } from '@/systems/website/components/sublime';
import { Scene } from './_components/Scene';

// The case study's outcome slide, as a visual; its title is the slide's own headline.
export const visual = defineVisual({ format: 'scene', title: 'Missed threats now get a rule in under 2 hours' });

export default function View() {
  return <Scene><AdeJobs /></Scene>;
}
