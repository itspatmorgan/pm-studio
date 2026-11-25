/** @studio-id 09y11yzzmk0tfcdy */
import { defineVisual } from '@module/visuals';
import { StudioShare } from '@/systems/website/components/design-studio';
import { Scene } from './_components/Scene';

// The product page's sharing slide. Its title is the slide's own headline.
export const visual = defineVisual({ format: 'scene', title: 'Share a lasting link with your team' });

export default function View() {
  return <Scene><StudioShare /></Scene>;
}
