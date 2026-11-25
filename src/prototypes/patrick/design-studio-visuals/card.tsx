/** @studio-id 7fz9b433wn57aqnj */
import { Frame, defineVisual } from '@module/visuals';
import { StudioCard } from '@/systems/website/components/design-studio';

// Design Studio's Work card visual, the snapshot on the board.
export const visual = defineVisual({ format: 'board-card', title: 'Design Studio at a glance' });

export default function DesignStudioCard() {
  return (
    <Frame format={visual.format} className="texture-bg">
      <StudioCard size="card" />
    </Frame>
  );
}
