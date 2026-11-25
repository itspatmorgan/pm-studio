/** @studio-id kqsfhhasrj68d8bx */
import { defineVisual } from '@module/visuals';
import { AutoAccepted } from '@/systems/website/components/sublime';
import { Scene } from './_components/Scene';

// The case study's evidence slide, as a visual; its title is the slide's own headline.
export const visual = defineVisual({ format: 'scene', title: 'Each rule shows what it would catch before it goes live' });

export default function View() {
  return <Scene><AutoAccepted /></Scene>;
}
