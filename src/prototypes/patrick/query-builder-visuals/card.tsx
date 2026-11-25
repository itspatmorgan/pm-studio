/** @studio-id rg0wej5qt0abax6e */
import { Frame, defineVisual } from '@module/visuals';
import { QueryCard } from '@/systems/website/components/query-builder';

// The case study's Work card visual, its snapshot on the board.
export const visual = defineVisual({ format: 'board-card', title: 'A query, built visually' });

export default function Card() {
  return (
    <Frame format={visual.format} className="texture-bg">
      <QueryCard />
    </Frame>
  );
}
