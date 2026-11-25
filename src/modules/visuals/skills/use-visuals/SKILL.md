---
name: use-visuals
description: Make a visual (a view drawn at a named format), add a format, or draw a view at a format, when Visuals is enabled.
---

# Use Visuals

1. Read [the module README](../../README.md).
2. A visual is a view in its prototype. Export `visual = defineVisual({ format, title })` beside the default export, and
   wrap the view in `<Frame format={visual.format}>`.
3. Compose at the format's pixel size (`FORMATS[id].width` × `height`). Never size a visual to its container: the frame
   scales it.
4. Pick an existing format. Add one to `lib/formats.ts` only for a new channel or board shape, with its real pixel size.
5. Use the prototype's system components for everything drawn. Show real product and real words; never stand-ins.
6. Check the view at two sizes (its tile and full screen), in light and dark, and with reduced motion.
