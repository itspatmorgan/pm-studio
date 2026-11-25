import type { ReactNode } from 'react';
import { Frame } from './Frame';
import type { FormatId } from './formats';

// A composition centred on a format's canvas, with a margin: how a scene made for a page (a case study slide, a product
// screen) becomes a visual. `className` sets the canvas's own look, such as a product's stylesheet namespace and
// background; `inner` styles the block that holds the children.
export function Stage({
  format,
  className,
  inner = 'w-full',
  children,
}: {
  format: FormatId;
  className?: string;
  inner?: string;
  children: ReactNode;
}) {
  return (
    <Frame format={format} className={className}>
      <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <div className={inner}>{children}</div>
      </div>
    </Frame>
  );
}
