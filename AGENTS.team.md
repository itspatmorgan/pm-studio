# Team guidance

This is Patrick's personal studio, and it doubles as the lab for Design Studio ([itspatmorgan/design-studio](https://github.com/itspatmorgan/design-studio)).

- Bigger or more experimental Design Studio features start here, built and used with Patrick's real content, especially when testing them needs new content of his own.
- Prefer team-owned paths (`src/modules/`, `src/systems/`) for experiments so taking a new Design Studio release stays clean. Change upstream-owned paths only when the experiment needs it, and say so in the PR.
- Once an experiment holds up on real work, package it and propose it upstream as a Design Studio PR, generalized for the range of people and teams who use the open-source version: no Patrick-specific content, names, or settings.
- Not everything goes through the lab. Higher-certainty features are built directly in Design Studio, and platform bugs are fixed there first, then arrive here with the next release.

## Lab changes to the platform

Changes to upstream-owned paths that this studio carries. Review each one when merging a Design Studio release.

- **CSS fitting** (TASK-169): `cssFitting` in `system.ts` (`src/platform/modules/systems/spec.ts`, the system template, Studio's own `system.ts`), `src/platform/node/lib/css-fit.js` and its test, and the calls to it in `src/platform/node/build/vite-css-plugin.js` and `src/platform/node/build/build-manifest.js`. Documented in `src/platform/modules/systems/README.md`.
