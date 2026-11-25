/** @studio-id 6bxternk4dfakd0r */
import { Frame, defineVisual } from '@module/visuals';
import { ExpansionCard } from '@/systems/website/components/expansion';

// The case study's Work card visual, its snapshot on the board.
export const visual = defineVisual({ format: 'board-card', title: 'Bot signals at a glance' });

export default function Card() {
  return (
    <Frame format={visual.format} className="texture-bg">
      <ExpansionCard />
    </Frame>
  );
}
