import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { FORMATS, type FormatId } from './formats';

// Draws a visual at its format. The children are laid out on a canvas of the format's exact pixel size, and the canvas
// is scaled to fill the frame's width (or to fit inside it with `fit="contain"`). So a visual composed once looks the same
// in a 300 px tile, a full-screen peek, and a 1200 × 630 export, which renders it at scale 1.
export function Frame({
  format,
  children,
  fit = 'width',
  className,
  style,
}: {
  format: FormatId;
  children: ReactNode;
  /** width: the frame is as wide as its container and as tall as the format's shape. contain: the canvas fits inside a sized frame. */
  fit?: 'width' | 'contain';
  className?: string;
  style?: CSSProperties;
}) {
  const { width, height } = FORMATS[format];
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    const measure = () => {
      const { width: w, height: h } = el.getBoundingClientRect();
      setScale(fit === 'contain' && h > 0 ? Math.min(w / width, h / height) : w / width);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [fit, width, height]);
  return (
    <div
      ref={box}
      data-visual-format={format}
      className={className}
      style={{ position: 'relative', overflow: 'hidden', ...(fit === 'width' && { aspectRatio: `${width} / ${height}` }), ...style }}
    >
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width,
          height,
          transform: `translate(-50%, -50%) scale(${scale})`,
          visibility: scale ? 'visible' : 'hidden',
        }}
      >
        {children}
      </div>
    </div>
  );
}
