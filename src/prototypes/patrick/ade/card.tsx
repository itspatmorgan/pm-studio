/** @studio-id txcgzk5n4kcghqpv */
import { Frame, defineVisual } from '@module/visuals';
import { SublimeCard } from '@/systems/website/components/sublime';

// ADÉ's Work card visual, the snapshot on the board: the agent's detection rule auto-accepted after a 14-day hunt.
export const visual = defineVisual({ format: 'board-card', title: 'ADÉ, auto-accepted' });

export default function AdeCard() {
  return (
    <Frame format={visual.format} className="texture-bg">
      <SublimeCard />
    </Frame>
  );
}
