/** @studio-id 4e50epk1he0bcv9s */
import { defineVisual } from '@module/visuals';
import { StudioHero } from '@/systems/website/components/design-studio';
import { Scene } from './_components/Scene';

// The product page's first slide. Its title is the slide's own headline.
export const visual = defineVisual({ format: 'scene', title: 'One workspace for you and your agent' });

export default function View() {
  return <Scene><StudioHero /></Scene>;
}
