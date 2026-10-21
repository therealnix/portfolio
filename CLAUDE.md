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
and this file, committed 2026-10-02. Two versions of everything after the
fly-by were built on that base on 2026-10-02: `claude/mountain-flight-rework`
(navy and amber print, particle figures, text on the left) and, on top of it,
`claude/mountain-flight-paper` (muted paper print as a landscape strip along the
bottom, centred text on plain paper, line drawings, much lighter to run).
`claude/mountain-flight-paper-options` only holds the four prototypes the strip
was chosen from. `claude/mountain-flight-haze` (2026-10-15, on top of the paper
branch) drops the strip: the print stays full screen and softens behind the
text. `claude/mountain-flight-horizon` (2026-10-15, on top of the haze branch)
replaces the blur with a low horizon: mountains on the bottom sixth, text rising
from behind them. `claude/mountain-flight-loop` (on top of it) reverts the hiker
cutout and reworks the end of the loop: the contact stage shows while the camera
rests, then fades as the camera slowly sets off again.
`claude/mountain-flight-return` (on top of it) makes the return flight retrace
the fly-by backwards instead of the old curvy route through the valley. Branch new flight work from whichever one is accepted. The
finished
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
  session, 13 after the rework and 14 on the paper version.

## Rework of 2026-10-02

- Art direction after the fly-by: one navy and amber print with cream type.
  Display type matches the opening greeting ("WELCOME :)" since 2026-10-20) (system heavy sans, no web font, so
  the opening frame is untouched). The photograph's five ridgelines
  (`src/flight/ridges.ts`) are the recurring line motif. Details are in
  `docs/mountain-flight.md`.
- The opening frame, the fly-by path and all article wording are unchanged on
  purpose. The intro button typo ("get to kow me") was fixed on 2026-10-20 in a
  spelling and grammar pass the user asked for.
- The Browser pane crops screenshots when it is hidden. Full-size checks were
  done with headless Edge over the DevTools protocol instead.

## Paper version of 2026-10-02

- Requested after the rework: text centred and in focus, a less vibrant,
  paper-like colour scheme that still fits the opening photo, drawings instead
  of particles, and much better performance (the particle version lagged
  badly). The user had tried a paper look before and could not make it work
  with the home screen, so the print keeps the photo's two colour families
  (slate and ochre) on warm paper.
- Keep it subtle and clean: nothing in the article animates per frame, and the
  engine loop sleeps when the camera is at rest. Do not reintroduce particles,
  SVG filters or continuous animations here without measuring.
- The remaining slow frames come from the two SoundCloud widgets loading. A
  click-to-load placeholder would remove them but changes the embeds, which the
  user has ruled out so far; ask before doing that.
- The first paper layout (paper under the column, print fading out on both
  sides) was rejected: the user does not want the mountains "just on the sides"
  behind a gradient. Out of four prototypes they chose the landscape strip:
  plain paper for the text, the live print as a full-width strip along the
  bottom, text scrolling away behind it. Do not bring back side gradients.

## Haze version of 2026-10-15

- The user did not like the background scrolling down into the landscape strip.
  They want to stay with the print the fly-by ends on and have the text appear
  on top of it, readable through blur and contrast, matching the scheme, with
  no hard cuts and smooth transitions everywhere.
- Done in the print shader only: a reading `haze` (from `journeyAt`, eased by
  the engine) blurs the frame and lifts its dark tones toward the paper. No
  overlays, panels, blinds or gradients over the scene.

## Horizon version of 2026-10-15

- No blur. The horizon glides down until the mountains fill the bottom sixth
  of the screen, the sky clears toward the paper for contrast, and the text
  passes behind the mountains along a hard edge with a short fade above it
  (the user explicitly wants the edge hard, not rounded or soft).
- A hiker cutout computed from photo minus clean plate looked worse to the
  user and was reverted; the hikers use the hand-measured mask again. The
  camera must stay exactly still while the photograph crossfades in and out
  (test in `tests/flight-path.test.ts`).
- Copy changes the user asked for: the contact stage links Substack
  (`https://substack.com/@projectnik`) instead of SoundCloud, and the Music
  paragraph ends "Check it out :)" without the inline SoundCloud link.
- 2026-10-20: spelling and grammar pass over all article and intro copy at the
  user's request, keeping their wording and only fixing errors. Leave the
  casual tone alone; the galaxy view (`src/App.tsx`) was not part of it.
- Loop ending (2026-10-15, user request): "Let's connect." appears only once
  the camera has stopped; scrolling on fades it out while the camera slowly
  starts moving and completes the loop. `journeyMetrics` has a `contact`
  segment for this.

## Smoothness pass of 2026-10-20

- The owner's laptop (Radeon 780M, 1920 × 1200 at 150%) runs Edge at about 30
  frames per second whenever Windows energy saver is on; an empty page does
  too. Check the power state before blaming the site for lag.
- The page holds five loops of scroll and recentres to the middle one when the
  scroll settles; the scene is sized to `100lvh` so phone address bars do not
  resize it. Details and measurements are in `docs/mountain-flight.md`.
- The biggest remaining hitches come from the browser creating the two
  SoundCloud players while the article scrolls in. Fixing that changes the
  embeds; ask the owner first.
