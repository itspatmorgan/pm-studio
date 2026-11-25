/** @studio-id wrsm8zqmc2r0xk6m */
import { Stage, defineVisual } from '@module/visuals';
import { AutomationConfig } from '@/systems/website/components/sublime';

// The case study's limits slide, as a visual; its title is the slide's own headline.
export const visual = defineVisual({ format: 'scene' });

export default function View() {
  return (
    <Stage format='scene' className='cs-page sb bg-background'>
      <AutomationConfig />
    </Stage>
  );
}
