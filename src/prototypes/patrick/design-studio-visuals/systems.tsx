/** @studio-id mkq0thtg17g7bwaa */
import { defineVisual } from '@module/visuals';
import { StudioSystems } from '@/systems/website/components/design-studio';
import { Scene } from './_components/Scene';

// The product page's systems slide. Its title is the slide's own headline.
export const visual = defineVisual({ format: 'board-square', title: 'Define a system, then build with it' });

export default function View() {
  return <Scene square><StudioSystems /></Scene>;
}
