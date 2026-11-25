/** @studio-id ft34pahddcy1fkb8 */
import { defineVisual } from '@module/visuals';
import { StudioDocs } from '@/systems/website/components/design-studio';
import { Scene } from './_components/Scene';

// The product page's context slide. Its title is the slide's own headline.
export const visual = defineVisual({ format: 'board-square', title: 'Keep the thinking with the work' });

export default function View() {
  return <Scene square><StudioDocs /></Scene>;
}
