import type { ReactNode } from 'react';
import { Frame } from '@module/visuals';

// A case study scene as a visual: the scene drawn on the product's own stylesheet namespace (`sb`), centred on the scene
// format's canvas, as it plays on the case study page.
export function Scene({ children }: { children: ReactNode }) {
  return (
    <Frame format="scene" className="cs-page sb bg-background">
      <div className="flex h-full w-full items-center justify-center px-6 py-6">
        <div className="w-full">{children}</div>
      </div>
    </Frame>
  );
}
