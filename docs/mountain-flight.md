# The Long Way Home — mountain flight experiment

Branch: `claude/mountain-flight-return` (the horizon version plus the reworked ending of the loop and a direct return flight). It is the paper version of the flight: the muted paper print of the valley stays as the background all the way through; while reading, its horizon settles low, the mountains fill the bottom sixth of the screen and the centred text rises from behind them. `claude/mountain-flight-haze` (soft focus behind the text) and `claude/mountain-flight-paper` (paper blind and landscape strip) hold earlier layouts. The earlier navy and amber version with particle figures is kept on `claude/mountain-flight-rework`; both are based on `claude/mountain-flight-base` (`codex/mountain-flight-experiment` plus the last Codex session). The completed galaxy portfolio is preserved at commit `b53ef22` on `feature/ui-improvements`, and remains accessible in this branch at `/?view=galaxy`. The experimental flight is the default `/` view.

The opening uses Niklas's latest supplied photograph, AI enhanced and extended into a wide frame. Only a small “HI!” in the upper-left sky and a scroll cue are visible. The greeting is one third of the previous size and uses the original portfolio’s sans-serif font stack with negative blending. The camera moves beside the hikers toward the next mountain on the left, rests there for the article, and then retraces the same path straight back to the opening. Until 2026-10-15 the return swung deeper into the valley and panned past the opening direction before curving back; the user found that path too curvy, and a plain straight line was tried and dropped because it looked at the hikers from close up.

The opening frame and the fly-by are the reference for everything else and were not redesigned in the rework.

The image is divided into a distant photographic back plate, three connected depth bands for the ridges/valley/foreground, and a separate silhouette of the hikers. The hiker layer samples original hero pixels, preserving the face and clothing; AI only restores the landscape hidden behind them. Both shoulder masks are expanded to retain sunlit rims, with a five-pixel stroke and two-pixel feather on a 2048 × 1152 runtime mask drawn from the hand-measured `HIKER_OUTLINE`. A matte computed from the difference to the clean plate was tried on 2026-10-15 and reverted the same day because it looked worse. Photo coordinates are projected into perspective depth, reproducing the original image at the home camera. Mirrored texture overscan covers the outer edges during the bank.

The camera is held perfectly still on the opening view while the photograph crossfades into the scene and back (`restsAt` in `src/flight/path.ts`: a keyframe that begins or ends a hold has zero velocity). Before, the spline still carried the speed of the next segment through the hold, so the near hikers slid against the background and showed up twice during the crossfade.

This is a constrained 2.5D photographic reconstruction with authored depth, not recovered photogrammetry or a freely navigable world. Small viewpoint changes create parallax while larger translations can stretch the single-view texture. The camera path is deliberately bounded to preserve the photographic appearance.

The approach lasts 3.5 viewport heights. The color transition starts around the midpoint of the approach and fades the live render into a print on paper. The print is a live shader over the moving scene in `src/flight/sketch-pass.ts`; no extra image assets are needed. It reads brightness (weighted toward the strongest colour channel, which separates the open sky from the ridges) and warmth from each frame and maps them onto two muted inks on warm paper: slate for the ridges (`#1c2733` ink, `#566c82` slate, `#a9b7bf` mist) and ochre for the sunrise (`#7b5c3a`, `#cfa15f`, `#f0deb6`), with the lightest tones left as paper (`#efe7d6`). A fixed grain gives the paper its tooth. The result is deliberately less vibrant than the photograph but keeps its two colour families, so the opening frame turns into the print without a break. Swapping the scene for a static filtered image and the earlier grey sketch look were both rejected and should not come back. `public/flight/mountain-amber-screenprint.png` is an older colour reference; no code loads it.

## Art direction after the fly-by

Everything after the fly-by stays in the print the fly-by ends on. Nothing slides in over it and nothing is blurred: the horizon glides down until the mountains fill the bottom sixth of the screen, the sky above clears toward the paper, and the text rises from behind the ridges.

- **Type.** Display type uses the same heavy sans as the opening greeting (`--font-sans` at weight 900, tight tracking), so "Hi! I'm Nik.", the section titles and "Let's connect." read as the same voice as "HI!". The writing itself stays in a book serif (Georgia) at 19px in one centred column of at most 660px. The heading block and the closing lines are centred; paragraphs are left-aligned for reading.
- **Lines.** Everything decorative is a thin line that draws itself once: the photograph's five ridgelines (`src/flight/ridges.ts`) open the five sections, a small line drawing sits beside each title, and the route under the column is an elevation profile.
- **One accent.** Ochre (`--ochre`, `--sun`) is the only accent on the paper: numbers, links, ridge marks and the walked part of the route.

## Reading section

The flight phase holds at exactly 48% of its route through the article body and starts moving again during the final 0.75 viewport heights. The measured article height determines the hold duration, including after edits and resizing. The scene rests during the hold, so reading costs no WebGL work.

`journeyAt` returns `horizon` (0 at the fly-by, 1 while reading). It starts about one viewport height before the first line arrives, is fully down by the time the first line clears the mountains, stays down through the article and the contact stage, and rises once the camera has set off again. The engine eases it at the camera's pace and applies it in three ways (`src/flight/engine.ts`):

- **Lower horizon.** The camera climbs a little (`RISE`) and its projection gets a lens shift, so the picture slides down without changing perspective. The shift is measured on every resize so that the highest point of the far ridgeline sits at five sixths of the screen height (`LOW_HORIZON`).
- **Clear sky.** The print shader lifts the open sky above the sunrise band toward the paper colour (`clear` and `skyline` in `src/flight/sketch-pass.ts`), so dark ink reads with full contrast. The sunrise band and the mountains keep their colours, and nothing is blurred. Above the top edge of the photograph the sky plate samples a blurred mip level instead of repeating its top row, so the lowered view shows one smooth wash instead of vertical streaks.
- **Text behind the mountains.** A second canvas (`.flight-front`, above the article) holds a copy of the rendered frame cut along the far ridgeline. Below the line the cut is hard and fully opaque, so the text passes behind the mountains along a crisp edge. Above it the copy fades out over 5.5% of the screen height (`FADE_FROM`, `FADE_HEIGHT`), so lines start to appear a little above the ridge and fade in as they rise. The fade is drawn at a quarter of the resolution as stacked, eased layers; the edge itself stays at full resolution. The copy is only redrawn on frames where the camera moves.

Earlier layouts: a paper blind with a landscape strip (replaced 2026-10-15, the user did not want the background to scroll away), and a soft focus haze behind the text (replaced the same day; the user wanted no blur, the mountains low and the text emerging from behind them).

Editable paragraphs, project links and track IDs live in `src/flight/article-content.ts`. Introductory and closing copy is in `src/flight/FlightApp.tsx`. The wording is the author's own and is treated as frozen except where the author changes it (on 2026-10-20 the author asked for a pass that fixed spelling and grammar only): on 2026-10-15 the Music paragraph's inline SoundCloud link was removed at the author's request, and the paragraph now ends "Check it out :)" right before the two players. The article moves through Go-findus, Mondono, BMW, Music and "What else i find cool". Both SoundCloud players sit inside the Music passage, each in a light frame with its track link underneath. The iframe markup and URLs are unchanged and nothing covers, hides or animates them.

### Line drawings

There are no particles in this version. Each section has one line drawing at the right of its opening, next to the ridgeline and the title (`src/flight/sketches.ts`):

| Section | Drawing |
| --- | --- |
| Go-findus | the Findus mascot |
| Mondono | shopping bag with an M |
| BMW | car front |
| Music | six stacked waveforms, drawn the way the ridges are |
| What else I find cool | spark |

A drawing is an inline SVG split into strokes. When its section is first scrolled into view, the strokes draw in one after the other with a `stroke-dashoffset` transition, and then stay still. Titles and ridge marks rise in the same way, once (`.reveal`); paragraphs and the player frames are not animated. Nothing in the article animates per frame.

### Route

`.flight-trail` shows the article as an elevation profile with a summit at every section (`trailHeight` and `trailPath` in `src/flight/ridges.ts`), small, in the top right margin, clear of the text and the mountains. The walked part turns ochre, a marker follows the scroll position, and the numbers 01 to 05 are buttons that scroll to their section. Below 1200px there is no room beside the column, so a thin ochre progress line along the top edge (`.flight-progress`) takes its place.

## Contact stage and return

The loop ends in three steps (`journeyMetrics` has a `contact` segment of one viewport height between the article and the departure):

1. **Rest.** The camera stays exactly where it rested for the article, through the last lines and the whole contact stage. As the last lines leave, "Let's connect." fades in, rising slightly, in the open sky above the mountains: the title in the display type, and LinkedIn, email and Substack (`https://substack.com/@projectnik`, replacing the SoundCloud profile on 2026-10-15) as line drawings that draw themselves in when the stage arrives. Each one is a link with a small label; email opens a message to `niklas@go-findus.tech`. The links are inert while hidden or fading. Phones show the same title with the three links as rows.
2. **Set off.** Scrolling past the contact segment, the stage fades out and drifts upward over 0.8 viewport heights while the camera starts moving again, slowly at first (it eases out of the rest), and the horizon rises back to the full view.
3. **Return.** Over 3.5 viewport heights the camera retraces the fly-by backwards (`getFlightFrame` in `src/flight/path.ts` maps phases after `.48` onto the outbound path), so it pulls straight back the way it came, the hikers slide back in from the right, and it slows into the opening frame. The print fades back into color on the last stretch and the opening photo reconstructs.

### The endless loop

The page holds five loops of scroll (`LOOPS` in `src/flight/journey.ts`) and the reader starts in the middle one. Every loop looks the same, so once the scroll has settled (`scrollend`, or 220 ms without scroll events and no finger on the screen) the reader is moved back to the middle loop at exactly the same point (`recenter`); nobody can see it. Only within half a loop of either end of the page does that happen at once (`nearEdge`). Until 2026-10-20 the page ended exactly at the opening frame and jumped back there, so a fast scroll or a fling ran into the end of the page, stopped and lost its momentum right at the loop's transition.

Before 2026-10-15 the camera started moving under the last lines and the contact stage was shown during the return flight.

## Reduced motion and fallback

`prefers-reduced-motion` and unavailable WebGL show a plain, normally scrolling page: the photograph as the opening picture, then the article on paper with the same typography, ridge marks and drawings (already drawn). The route, the landscape strip and the contact stage are switched off there.

## Assets and performance

| Asset | Export | Size |
| --- | --- | --- |
| `public/flight/mountain-upscaled.webp` | 2560 × 1440 | 165,466 bytes |
| `public/flight/mountain-clean.webp` | 1672 × 941 | 164,372 bytes |

The generated hero was natively 1672 × 941, then resized and compressed for the 2560 × 1440 web export. It is not native 4K. The restored background retains its native dimensions. The two served images total about 330 KB. `scripts/prepare-flight-assets.mjs` exports the hero; `scripts/prepare-photo-layers.mjs` compresses the AI clean plate using Sharp. Layer masks and perspective projection are code-native in `src/flight/photo-scene.ts`.

The engine loads separately from the photograph and HTML. Five photographic meshes share two image textures and a generated alpha mask, with capped pixel density (1.5 on desktop, 1.25 on phones), no lights, no shadow maps and no multisampling. One render target and one full-screen pass produce the print. No web fonts and no new runtime dependencies were added. Three.js remains the largest JavaScript dependency (about 524 kB before compression).

What keeps it light:

- **The loop sleeps.** The engine's animation loop only runs while the flight phase is still moving. Once the camera has settled it stops and is woken by the next scroll, resize or tab switch (`wake` in `src/flight/engine.ts`). A reader who is not scrolling costs no script and no rendering.
- **No per-frame canvas.** The 2D canvas only draws the opening "HI!" and is hidden everywhere else, so no full-screen blended layer is composited during the flight or while reading.
- **Scroll writes only what changed.** The scroll handler reads no layout (section positions are cached on resize) and writes each style only when its value changes, directly on the element that needs it instead of through custom properties on the root.
- **Warm start.** Textures are uploaded, the shaders for both ways the scene is drawn (straight to the screen near the photograph, through the print pass everywhere else) are compiled and the front layer is prepared once at load, behind the opening photograph, so the first scroll does not pay for them (it used to cost a 50 to 90 ms hitch as the fly-by began).
- **Front layer only where it is needed.** The copy of the mountains that lies in front of the text (`.flight-front`) covers only the lower 55% of the screen and is only drawn while article text can actually be near the mountains, not during the fly-by, the contact stage or the return.
- **Resolution governor.** If a run of frames is dropped, the render resolution steps down (to 60% at the lowest) until the next resize. A frame counts as dropped only when it took clearly longer than the fastest recent ones and longer than 1/50 s, so a steady frame-rate cap does not trigger it. Before 2026-10-20 any frame slower than 21 ms counted, so on battery with Windows energy saver (which holds Edge at about 30 frames per second) the scene always dropped to 60% resolution without getting any faster.
- **The article is built once.** Moving from section to section only re-renders the small route in the corner.
- **Stable on phones.** The scene layers are sized to the large viewport (`100lvh`, browser bars hidden) and the journey is measured against it (`.flight-probe`), so a phone's address bar coming and going no longer resizes the scene or moves the scroll position. When a resize does happen (rotating the phone, resizing a window), the engine draws the scene again right away, before the browser shows the frame; resizing wipes a canvas, and drawing on the next frame instead used to flash the dark page background for a frame, which on phones happened every time the address bar moved.
- **Drawings are CSS.** Line drawings and ridge marks are one-off stroke transitions; there is no SVG filter and no continuous animation.

Measured on 2026-10-02 in headless Edge on the development laptop's GPU (AMD Radeon 780M) at 1707 × 960 CSS pixels and a device pixel ratio of 1.5, with the SoundCloud embeds blocked so only the page itself is measured:

| | Navy version with particles | Paper version |
| --- | --- | --- |
| Scrolling through the article | 34 frames per second, 44 frames over 34 ms | 60 frames per second, none over 34 ms |
| Full loop scroll | 46 frames per second | 60 frames per second |
| Main thread busy while scrolling the article | 67% | 10 to 12% |
| Main thread busy at rest on a section | 32 to 36% | under 2% |
| Article scroll with a simulated 4x slower CPU | 6 frames per second | 52 frames per second |

The two SoundCloud widgets are the one cost the page does not control: while they load they can still cause a few one-off slow frames around the Music section. With them blocked, a full loop had no slow frames at all.

## AI generation prompts

Hero source: `C:/Users/N_gam/Pictures/WhatsApp Image 2026-09-09 at 19.57.28.jpeg`.

Hero prompt:

> Use case: identity-preserve. Edit target: the attached mountain sunrise photograph. Asset type: a high-resolution full-screen website hero. Faithfully AI upscale and delicately restore fine detail in this exact photograph, extending the scene horizontally into a cinematic 16:9 landscape, ideally 3840x2160. Preserve the central hooded hiker's exact identity, pose, clothing, silhouette, and expression without inventing facial detail. Preserve the second hiker at lower left, the actual mountain ridge shapes, sunrise gradient, rocks, natural grain, and atmospheric depth. Keep the hooded hiker at approximately 56% of image width, and the original horizon around 41% of image height. Preserve the photographic dark foreground; gently resolve rock texture without flattening contrast. Outpaint only enough landscape at the left and right to obtain a seamless wide frame; no new people, no text, no logos, no illustration look, no excessive sharpening or HDR. Return one single high-resolution cinematic photograph, not a mockup or collage.

Clean-plate prompt (built-in image-generation tool, using the wide hero as the edit target):

> Use case: precise-object-edit. Edit target: the supplied mountain sunrise photograph. Create an aligned clean background plate for a 3D photographic parallax scene. Remove BOTH hikers completely, including their clothing, arms, backpacks and legs, and reconstruct only the mountain slopes, valley and foreground rocks that they occlude. Keep the exact camera, 16:9 framing, skyline, sky gradient, sunset light, ridge silhouettes and every already visible landscape pixel as close as possible to the input. The main mountain on the left must stay exactly where it is. Photorealistic natural detail, dark alpine rock and layered blue-gray atmospheric ridges. No people, no figures, no buildings, no text. Do not reimagine the scene, shift the horizon, brighten shadows, or add dramatic invented peaks. One full-frame landscape photograph, ideally 2560x1440, to align over the original.

## References

- [Codrops: Scroll-Driven 3D Gallery Using a Blender Camera Path](https://tympanus.net/codrops/2026/07/07/building-a-scroll-driven-3d-gallery-using-a-blender-camera-path-with-three-js-and-gsap/) — closed camera route and smooth scroll progress.
- [Codrops: The Sleepers](https://tympanus.net/codrops/2026/07/10/the-sleepers-creating-an-atmospheric-webgl-experience-with-lightweight-techniques/) — atmosphere with lightweight WebGL techniques.

Original implementation; no reference source code or assets copied.

## Verification

`npm run test:flight` runs sixteen tests: exact loop endpoints, delayed color/print reconstruction, continuity across the wrap, finite camera samples, leftward movement and hiker clearance, original-image projection, a constant flight phase through variable article bodies, overlapping motion at both ends, progress preservation on resize, the contact stage window, the single music stage, the route profile (a summit on every stop, one ridgeline per section), the line drawings (one per section and contact link, made of separate strokes), the low horizon (down before the first lines clear the mountains, holds through the contact stage, gone on both flight legs, never jumps), a camera that is exactly still while the photograph crossfades in and out, the ending (contact stage shown only while the camera rests, the camera easing out of the rest as it fades) and the return flight (exactly the fly-by views in reverse, always getting closer to the opening view). TypeScript and production bundling pass. Lint reports only the existing fast-refresh warning in the shared button component. Three.js still triggers the existing bundle-size advisory.

Browser checks for the paper version (2026-10-02) covered 1920 and 1440 wide desktop views, an 820 wide tablet and a 390 wide phone: the unchanged opening frame and fly-by path, the print, the paper coming down and lifting again, the landscape strip, the centred article with every drawing, the route and its jump buttons, both SoundCloud players loading and playing when clicked, the contact stage with hover response, and the static article with reduced motion.

The haze version (2026-10-15) was measured the same way as the table above (1707 × 960 CSS pixels, device pixel ratio 1.5, SoundCloud blocked): 59 to 60 frames per second for the full loop, the entry into the article and scrolling through it, with the main thread busy 10 to 14% while scrolling and under 2% at rest. With a simulated 4x slower CPU the loop held 56 and the article 59 frames per second. Browser checks covered 1440 wide desktop, a 390 wide phone, both players playing, the route jump and reduced motion.

The horizon version (2026-10-15), same setup: 59 to 60 frames per second for the full loop, the entry into the article and scrolling through it, main thread busy 8 to 18% while scrolling and under 2% at rest. With a simulated 4x slower CPU the loop held 56, the entry 53 and the article 60 frames per second. Browser checks covered a 1914 × 1002 desktop (the crossfade at the start and the fly-by past the hikers), 1440 wide desktop, a 390 wide phone, both players playing and the route jump.

Smoothness pass (2026-10-20), measured at the owner's screen size (1280 × 800 CSS pixels at 1.5, so 1920 × 1200 pixels, AMD Radeon 780M, Edge):

- With Windows energy saver on (on battery below 20%), Edge holds every page at about 30 to 35 frames per second, an empty page included. The site's own work was about 5 to 10% of the main thread then; the cap is the system's, not the site's.
- Plugged in, both the previous and the new version run at 60 frames per second. With the SoundCloud players removed from the test page, the new version had no frame over 45 ms in a full loop; the previous version still had the hitch as the fly-by began.
- The largest remaining hitches (100 to 550 ms, no script involved) happen when the browser creates the two SoundCloud players, which it does lazily while the article scrolls in. Loading them earlier or on click would remove that, but changes the embeds; that was left to the owner to decide.
- A fast wheel fling across the end of the loop kept its full distance (9,000 of 9,000 pixels) instead of losing part of it at the end of the page.
- Toggling a phone viewport's height (as an address bar does) showed 11 black frames in the previous version and none in the new one.
