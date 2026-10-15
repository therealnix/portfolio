# The Long Way Home — mountain flight experiment

Branch: `claude/mountain-flight-haze`. It is the paper version of the flight: the muted paper print of the valley stays as the background all the way through, and while reading it goes softly out of focus and lighter behind centred text with line drawings. `claude/mountain-flight-paper` holds the previous layout with a paper blind and a landscape strip. The earlier navy and amber version with particle figures is kept on `claude/mountain-flight-rework`; both are based on `claude/mountain-flight-base` (`codex/mountain-flight-experiment` plus the last Codex session). The completed galaxy portfolio is preserved at commit `b53ef22` on `feature/ui-improvements`, and remains accessible in this branch at `/?view=galaxy`. The experimental flight is the default `/` view.

The opening uses Niklas's latest supplied photograph, AI enhanced and extended into a wide frame. Only a small “HI!” in the upper-left sky and a scroll cue are visible. The greeting is one third of the previous size and uses the original portfolio’s sans-serif font stack with negative blending. The camera moves beside the hikers, toward the next mountain on the left, then banks across the photographed valley before returning to the opening.

The opening frame and the fly-by are the reference for everything else and were not redesigned in the rework.

The image is divided into a distant photographic back plate, three connected depth bands for the ridges/valley/foreground, and a separate silhouette of the hikers. The hiker layer samples original hero pixels, preserving the face and clothing; AI only restores the landscape hidden behind them. Both shoulder masks are expanded to retain sunlit rims, with a five-pixel stroke and two-pixel feather on a 2048 × 1152 runtime mask. Photo coordinates are projected into perspective depth, reproducing the original image at the home camera. Mirrored texture overscan covers the outer edges during the bank.

This is a constrained 2.5D photographic reconstruction with authored depth, not recovered photogrammetry or a freely navigable world. Small viewpoint changes create parallax while larger translations can stretch the single-view texture. The camera path is deliberately bounded to preserve the photographic appearance.

The approach lasts 3.5 viewport heights. The color transition starts around the midpoint of the approach and fades the live render into a print on paper. The print is a live shader over the moving scene in `src/flight/sketch-pass.ts`; no extra image assets are needed. It reads brightness (weighted toward the strongest colour channel, which separates the open sky from the ridges) and warmth from each frame and maps them onto two muted inks on warm paper: slate for the ridges (`#1c2733` ink, `#566c82` slate, `#a9b7bf` mist) and ochre for the sunrise (`#7b5c3a`, `#cfa15f`, `#f0deb6`), with the lightest tones left as paper (`#efe7d6`). A fixed grain gives the paper its tooth. The result is deliberately less vibrant than the photograph but keeps its two colour families, so the opening frame turns into the print without a break. Swapping the scene for a static filtered image and the earlier grey sketch look were both rejected and should not come back. `public/flight/mountain-amber-screenprint.png` is an older colour reference; no code loads it.

## Art direction after the fly-by

Everything after the fly-by stays in the print the fly-by ends on. Nothing slides in over it: the valley itself softens and lightens until it can carry dark ink, and sharpens again when the text has gone.

- **Type.** Display type uses the same heavy sans as the opening greeting (`--font-sans` at weight 900, tight tracking), so "Hi! I'm Nik.", the section titles and "Let's connect." read as the same voice as "HI!". The writing itself stays in a book serif (Georgia) at 19px in one centred column of at most 660px. The heading block and the closing lines are centred; paragraphs are left-aligned for reading.
- **Lines.** Everything decorative is a thin line that draws itself once: the photograph's five ridgelines (`src/flight/ridges.ts`) open the five sections, a small line drawing sits beside each title, and the route under the column is an elevation profile.
- **One accent.** Ochre (`--ochre`, `--sun`) is the only accent on the paper: numbers, links, ridge marks and the walked part of the route.

## Reading section

The flight phase holds at exactly 48% of its route through the article body and starts moving again during the final 0.75 viewport heights. The measured article height determines the hold duration, including after edits and resizing. The scene rests during the hold, so reading costs no WebGL work.

The print stays full screen the whole time. `journeyAt` returns `haze` (0 clear, 1 reading): it starts building 0.7 viewport heights before the first line scrolls in, holds through the article and the contact stage, and clears as the contact stage leaves. The engine eases it at the camera's pace and hands it to the print shader (`src/flight/sketch-pass.ts`), which does two things with it:

- **Soft focus.** The rendered frame is sampled as a dithered disc of 20 taps, about 11 CSS pixels wide at full haze. The paper grain is added afterwards, so it stays sharp over the soft valley.
- **Lifted tones.** The darker half of the print is lifted toward the paper (`tone = mix(tone, .5 + .5 * tone, haze)`), so the ridges become a pale slate and the sky turns to paper, and dark ink stays legible anywhere on screen. Only the bright sunrise keeps its ochre; mid tones lose their warmth, which would otherwise print a dark rim along the soft skyline.

There is no overlay, panel, blind or gradient over the scene. Both changes happen while the camera is still settling or already leaving, so they ride on frames that render anyway. An earlier layout (paper blind with a landscape strip along the bottom, on `claude/mountain-flight-paper`) was replaced on 2026-10-15 because the user wanted to stay with the print the fly-by ends on.

Editable paragraphs, project links and track IDs live in `src/flight/article-content.ts`. Introductory and closing copy is in `src/flight/FlightApp.tsx`. The wording is the author's own and is treated as frozen; only its typesetting changes. The article moves through Go-findus, Mondono, BMW, Music and "What else i find cool". Both SoundCloud players sit inside the Music passage, each in a light frame with its track link underneath. The iframe markup and URLs are unchanged and nothing covers, hides or animates them.

### Line drawings

There are no particles in this version. Each section has one line drawing at the right of its opening, next to the ridgeline and the title (`src/flight/sketches.ts`):

| Section | Drawing |
| --- | --- |
| Go-findus | the Findus mascot |
| Mondono | shopping bag with an M |
| BMW | car front |
| Music | six stacked waveforms, drawn the way the ridges are |
| What else i find cool | spark |

A drawing is an inline SVG split into strokes. When its section is first scrolled into view, the strokes draw in one after the other with a `stroke-dashoffset` transition, and then stay still. Titles and ridge marks rise in the same way, once (`.reveal`); paragraphs and the player frames are not animated. Nothing in the article animates per frame.

### Route

`.flight-trail` shows the article as an elevation profile with a summit at every section (`trailHeight` and `trailPath` in `src/flight/ridges.ts`), small, in the bottom right margin, clear of the text. The walked part turns ochre, a marker follows the scroll position, and the numbers 01 to 05 are buttons that scroll to their section. Below 1200px there is no room beside the column, so a thin ochre progress line along the top edge (`.flight-progress`) takes its place.

## Contact stage and return

The return flight begins gently under the last lines and continues after the article passes. Its first 62% is the contact stage, on the same softened print: "Let's connect." in the display type, and LinkedIn, email and SoundCloud as line drawings that draw themselves in when the stage arrives. Each one is a link with a small label; email opens a message to `niklas@go-findus.tech`. The links are inert while hidden or fading in. Phones show the same title with the three links as rows. Behind it the camera is already flying back through the valley.

As the contact stage fades, the haze clears and the valley comes back into focus. The print then fades back into color and the opening photo reconstructs. Native scrolling rebases at matching loop frames.

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
- **Warm start.** Textures are uploaded and both shader passes are compiled once at load, behind the opening photograph, so the first scroll does not pay for them.
- **Resolution governor.** If a run of flight frames misses 60 per second, the render resolution steps down (to 60% at the lowest) until the next resize.
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

`npm run test:flight` runs fourteen tests: exact loop endpoints, delayed color/print reconstruction, continuity across the wrap, finite camera samples, leftward movement and hiker clearance, original-image projection, a constant flight phase through variable article bodies, overlapping motion at both ends, progress preservation on resize, the contact stage window, the single music stage, the route profile (a summit on every stop, one ridgeline per section), the line drawings (one per section and contact link, made of separate strokes) and the reading haze (builds before the first line, holds through the contact stage, clears on both flight legs, never jumps). TypeScript and production bundling pass. Lint reports only the existing fast-refresh warning in the shared button component. Three.js still triggers the existing bundle-size advisory.

Browser checks for the paper version (2026-10-02) covered 1920 and 1440 wide desktop views, an 820 wide tablet and a 390 wide phone: the unchanged opening frame and fly-by path, the print, the paper coming down and lifting again, the landscape strip, the centred article with every drawing, the route and its jump buttons, both SoundCloud players loading and playing when clicked, the contact stage with hover response, and the static article with reduced motion.

The haze version (2026-10-15) was measured the same way as the table above (1707 × 960 CSS pixels, device pixel ratio 1.5, SoundCloud blocked): 59 to 60 frames per second for the full loop, the entry into the article and scrolling through it, with the main thread busy 10 to 14% while scrolling and under 2% at rest. With a simulated 4x slower CPU the loop held 56 and the article 59 frames per second. Browser checks covered 1440 wide desktop, a 390 wide phone, both players playing, the route jump and reduced motion.
