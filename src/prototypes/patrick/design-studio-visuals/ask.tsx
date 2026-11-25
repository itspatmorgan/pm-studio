/** @studio-id sw57r7msz8xh6b1d */
import { defineVisual } from '@module/visuals';
import { StudioAsk } from '@/systems/website/components/design-studio';
import { Scene } from './_components/Scene';

// The product page's hero visual, under its headline.
export const visual = defineVisual({ format: 'scene', title: 'The product page hero' });

export default function View() {
  return <Scene><StudioAsk /></Scene>;
}
