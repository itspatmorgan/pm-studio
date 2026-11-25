import type { ReactNode } from 'react';
import { Frame } from '@module/visuals';

// A Design Studio scene as a visual: drawn on the product page's stylesheet namespace (`sc`), centred on the scene
// format's canvas, as it plays on itspatmorgan.com/design-studio.
export function Scene({ children, square }: { children: ReactNode; square?: boolean }) {
  return (
    <Frame format={square ? 'board-square' : 'scene'} className="cs-page sc ds-landing bg-background">
      <div className="flex h-full w-full items-center justify-center px-6 py-6">
        <div className={square ? 'ds-square w-full' : 'w-full'}>{children}</div>
      </div>
    </Frame>
  );
}
