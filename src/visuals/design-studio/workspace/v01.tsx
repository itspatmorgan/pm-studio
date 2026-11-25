/** @studio-id 4e50epk1he0bcv9s */
import { Stage, defineVisual } from '@module/visuals';
import { StudioHero } from '@/systems/website/components/design-studio';

// The product page's first slide. Its title is the slide's own headline.
export const visual = defineVisual({ format: 'scene' });

export default function View() {
  return (
    <Stage format='scene' className='cs-page sc ds-landing bg-background'>
      <StudioHero />
    </Stage>
  );
}
