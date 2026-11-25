/** @studio-id wrsm8zqmc2r0xk6m */
import { defineVisual } from '@module/visuals';
import { AutomationConfig } from '@/systems/website/components/sublime';
import { Scene } from './_components/Scene';

// The case study's limits slide, as a visual; its title is the slide's own headline.
export const visual = defineVisual({ format: 'scene', title: 'Each team decides how much the agent does alone' });

export default function View() {
  return <Scene><AutomationConfig /></Scene>;
}
