---
title: Pixel wave text
description: Text that dissolves between Geist Pixel and Geist Sans.
source: Ported from itspatmorgan.com's src/components/PixelWaveText.astro and src/scripts/pixel-wave.ts.
---

## When to use

Use it for the home hero and the closing tagline, and nowhere else. The site reserves Geist Pixel for this effect.

`PixelWaveText` renders each character as stacked pixel and sans layers. Animate it with the exported helpers on its element: `pixelWave` for the split-flap entrance, `dissolvePixelWave` for the quick dissolve, and `enablePixelHover` to flip characters near the cursor back to pixel type. `resetPixelWave` and `resolvePixelWave` put every character back in pixel or sans type, for replaying the entrance. `pixelWave` and `enablePixelHover` return cleanup functions for React effects.

All three respect reduced motion.

## Why it exists

Pixel Wave explores text interactions built from Geist Pixel and Geist Sans. Each character starts in a pixel typeface, cycles through a few glyphs, then settles into Geist Sans.

The effect is intentionally small: a tactile moment that gives the interface a little craft without turning the page into an animation showcase.

On the home page, the headline and closing tagline appear immediately in Geist Sans. Hovering brings the nearby characters back into their pixel form, keeping the effect interactive without replaying an introduction as you navigate.
