---
title: Logo
description: The four-pixel mark, a braille P, with its hover interactions.
source: Ported from itspatmorgan.com's src/components/layout/Logo.astro.
---

## When to use

Use the mark in site chrome, such as the sidebar and mobile header. Size it with `className` (it draws at 28px by default).

`interaction="cycle"` pulses the pixels on hover. Set `trigger="container"` and put `data-logo-cycle-trigger` on a surrounding card to start the cycle when that card is hovered. `interaction="sidebar-toggle"` previews the rail collapsing or expanding; choose the preview with `toggleDirection`.

Motion stops under reduced motion.

## Why this mark

Originally, I wanted to use a blocky version of my first initial, P, but [Pandora Radio](https://www.google.com/search?q=pandora+radio+logo) already has that territory pretty well covered.

So I started looking for a mark that could still carry the initial while fitting the site's emerging visual language: lightly pixelated, generative, and a little abstract. I landed on this four-pixel pattern, which maps to the braille letter P.

It felt like the right bridge: personal without being literal, simple enough to work at small sizes, and flexible enough to animate, shift, or become part of more interactive moments over time.

## Studies

The scale, variant, and interaction examples below come from the mark's original exploration. The sidebar uses the mark as a compact control, and its hover state previews whether the rail will collapse or expand.
