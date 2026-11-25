---
name: sync-from-site
description: "Refresh the Website system and the itspatmorgan.com prototype from the live site's repository: content, the shared kit pin, and page styles. Use when the site has changed and the workspace should catch up."
---

# Sync from the site

The source is the itspatmorgan.com checkout beside this studio (`../itspatmorgan.com`). Set `SITE=<path>` to use another. The scripts live in `scripts/sync-from-site/` at the repository root, because Studio treats every script inside a system folder as browser code. Read [Library](../../context/library.md) for what was ported and how before changing anything.

## Content

Run `node scripts/sync-from-site/snapshot.mjs`. It rewrites `src/prototypes/patrick/itspatmorgan-com/_data/` from the site's content collections and `src/data/`: projects and case study copy, articles (every listing, with bodies rendered by remark-gfm only for the `ARTICLE_SAMPLE` list in the script), Lab entries, community, commendations, media, the Design Studio agent guide, and the images they use, copied into the prototype's `assets/site/`.

The `_data/` modules are generated; edit the script, not its output. Words a page writes inline (About, Colophon, Design Studio) are not synced: compare them with the site's page by hand.

## Case study demos

The scene player, every case study and Design Studio demo, and the theme hooks come from `@itspatmorgan/kit`: move the kit's pinned commit in `package.json` and run `pnpm install` (see the Shared kit section in [Library](../../context/library.md)). Nothing is copied by hand. If a demo needs a change for Studio, make it in the site's `packages/kit`, where the tests check the kit's TypeScript and imports.

The pieces still ported by hand are the site's Astro components rewritten in React (`StudioQuote`, `StudioPress`, `StudioLesson`, the shared site pieces) and the page styles the site writes in `<style>` blocks, kept in `styles/site/`. Copy a changed `<style>` block into its file as written: Studio fits it to the Website theme (`cssFitting: 'fit'` in `system.ts`), mapping `:root` and `.dark` to the theme boundary, scoping every selector and prefixing keyframes. Then run `pnpm check` and `pnpm build`, which report anything that can't be fitted.

## Tokens

Nothing to copy: `styles/theme.css` imports the kit's `tokens.css`, so moving the kit pin brings the site's colors, radius, and motion with it.

## Verify

Open the changed pages in the itspatmorgan.com prototype in light and dark and at 390px. Compare them with the live site, and record new adaptations in the library record.
