# Personal portfolio (Niklas Kornev)

Portfolio site that accompanies the CV: Findus, Jost-Shop, Mondono, music
(SoundCloud) and personal interests. React 19 + TypeScript + Vite 8, Tailwind
CSS v4, three.js / @react-three/fiber, framer-motion. The README is the untouched
Vite template; this file is the real project description.

## Commands

```sh
npm run dev           # http://localhost:5173
npm run build         # tsc -b && vite build
npm run lint          # oxlint (one known fast-refresh warning in ui/button)
npm run test:flight   # node --test tests/flight-path.test.ts
```

## Two views

`src/PortfolioView.tsx` lazy-loads one of two experiences:

- `/` (default): "The Long Way Home" mountain flight in `src/flight/`. A 2.5D
  photographic scene with a scroll-driven camera, sketch shader, particle
  outlines and a continuous article. Read `docs/mountain-flight.md` before
  changing it.
- `/?view=galaxy`: the earlier particle-galaxy portfolio in `src/App.tsx` and
  `src/components/ParticleGalaxy.tsx`. See `docs/artwork.md`.

Article text, project links and SoundCloud track IDs are in
`src/flight/article-content.ts`; intro and closing copy are in
`src/flight/FlightApp.tsx`. The article should read like one continuous piece
of writing (Substack style) with players and buttons placed in the flow.

## Branches

The flight experiment lives on `codex/mountain-flight-experiment`.
`claude/mountain-flight-base` is that branch plus the last Codex session's work
and this file, committed 2026-10-02. `claude/mountain-flight-rework` (also
2026-10-02) is the visual rework of everything after the fly-by, built on that
base; branch new flight work from the rework once it is accepted. The finished
galaxy version is preserved at commit `b53ef22` on `feature/ui-improvements`.
Keep experiments on their own branch.

## Constraints

- Keep SoundCloud iframe markup and URLs unchanged; the canvas never takes
  pointer events.
- Respect `prefers-reduced-motion` and the no-WebGL fallback (static, normally
  scrolling article). Mobile stays particle-free.
- Watch performance: capped pixel density, pause when hidden, no new runtime
  dependencies without a reason. Three.js is already the largest bundle.
- Asset scripts: `scripts/prepare-flight-assets.mjs` and
  `scripts/prepare-photo-layers.mjs` (Sharp), `scripts/sample-mascot.ps1`
  (samples the Findus mascot from `../Findus_hub/public/brand/`).
- After visual changes, check the page in a browser (desktop and mobile width),
  not only the build.

## Copy

Plain, confident and professional. No buzzwords ("developing an AI product"
style phrasing) and no em dashes.

## Notes from Codex sessions

Added 2026-10-02 from Codex sessions of 2026-09-09 and 2026-09-10.

- The flight work from these sessions (seven files plus
  `public/flight/mountain-amber-screenprint.png`) is committed on
  `claude/mountain-flight-base`. The main checkout on
  `codex/mountain-flight-experiment` may still show the same changes as
  uncommitted. The PNG is the colour reference only; no code loads it.
- 2026-09-10: The reading section keeps the same moving 3D scene and applies an
  amber-and-navy colour filter modelled on the "amber screenprint" reference.
  Swapping in a static filtered image and the earlier grey sketch look were
  both rejected.
- 2026-09-10: Both SoundCloud players sit inside the Music section of the
  article, and the text column is left-aligned. Reading-section particles are
  flat orange with no glow. `docs/mountain-flight.md` was brought up to date
  with the rework on 2026-10-02.
- 2026-09-09: Hidden duplicate SoundCloud players caused sizing errors and were
  removed. Changes to visibility or click handling around the embeds broke
  browsing in the players once and were reverted.
- `npm run test:flight` had 11 passing tests at the end of the last Codex
  session and has 13 after the rework.

## Rework of 2026-10-02

- Art direction after the fly-by: one navy and amber print with cream type.
  Display type matches the opening "HI!" (system heavy sans, no web font, so
  the opening frame is untouched). The photograph's five ridgelines
  (`src/flight/ridges.ts`) are the recurring line motif. Details are in
  `docs/mountain-flight.md`.
- The opening frame, the fly-by path and all article wording are unchanged on
  purpose. The intro button still reads "get to kow me" (typo left as written).
- The Browser pane crops screenshots when it is hidden. Full-size checks were
  done with headless Edge over the DevTools protocol instead.
