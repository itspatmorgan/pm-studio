/** @studio-id gk7aafyjzhzrnc39 */
import { defineVisual } from '@module/visuals';
import { StudioRange } from '@/systems/website/components/design-studio';
import { Scene } from './_components/Scene';

// The product page's second slide. Its title is the slide's own headline.
export const visual = defineVisual({ format: 'scene', title: 'The flexibility of a one-off, the truth of production' });

export default function View() {
  return <Scene><StudioRange /></Scene>;
}
