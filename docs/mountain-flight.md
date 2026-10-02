# The Long Way Home — mountain flight experiment

Branch: `claude/mountain-flight-rework` (based on `claude/mountain-flight-base`, which is `codex/mountain-flight-experiment` plus the last Codex session). The completed galaxy portfolio is preserved at commit `b53ef22` on `feature/ui-improvements`, and remains accessible in this branch at `/?view=galaxy`. The experimental flight is the default `/` view.

The opening uses Niklas's latest supplied photograph, AI enhanced and extended into a wide frame. Only a small “HI!” in the upper-left sky and a scroll cue are visible. The greeting is one third of the previous size and uses the original portfolio’s sans-serif font stack with negative blending. The camera moves beside the hikers, toward the next mountain on the left, then banks across the photographed valley before returning to the opening.

The opening frame and the fly-by are the reference for everything else and were not redesigned in the rework.

The image is divided into a distant photographic back plate, three connected depth bands for the ridges/valley/foreground, and a separate silhouette of the hikers. The hiker layer samples original hero pixels, preserving the face and clothing; AI only restores the landscape hidden behind them. Both shoulder masks are expanded to retain sunlit rims, with a five-pixel stroke and two-pixel feather on a 2048 × 1152 runtime mask. Photo coordinates are projected into perspective depth, reproducing the original image at the home camera. Mirrored texture overscan covers the outer edges during the bank.

This is a constrained 2.5D photographic reconstruction with authored depth, not recovered photogrammetry or a freely navigable world. Small viewpoint changes create parallax while larger translations can stretch the single-view texture. The camera path is deliberately bounded to preserve the photographic appearance.

The approach lasts 3.5 viewport heights. The color transition starts around the midpoint of the approach and fades the live render into a two-ink print: navy and amber, modelled on `public/flight/mountain-amber-screenprint.png` (a colour reference only; no code loads it). The print is a live shader over the moving scene in `src/flight/sketch-pass.ts`. It maps brightness and warmth onto the navy, blue and amber inks, keeps a little photographic shading, adds a fixed paper grain and lets the ink run slightly heavier toward the corners. No extra image assets are needed. Swapping the scene for a static filtered image and the earlier grey sketch look were both rejected and should not come back.

## Art direction after the fly-by

Everything after the fly-by is one navy and amber print with cream type, taken from the opening frame: its sunrise band, its layered ridges and the heavy "HI!". Three ideas carry it.

- **Type.** Display type uses the same heavy sans as the opening greeting (`--font-sans` at weight 900, tight tracking), so "Hi! I'm Nik.", the section titles and "Let's connect." all read as the same voice as "HI!". The writing itself stays in a book serif (Georgia) at 19px, left-aligned in one column of at most 620px.
- **Ridgelines.** The five ridgelines of the photograph live in `src/flight/ridges.ts`. The engine projects them into the scene, and the article reuses them: every section opens with its number and one of those ridges, drawn in as the section arrives. There are five ridges and five sections.
- **One accent.** Amber is the only accent: links, numbers, ridge marks, particles and the route.

## Reading section

The article fades up from the lower left while the camera settles over its first 0.9 viewport heights. The flight phase then holds at exactly 48% of its route through the article body and starts moving again during the final 0.75 viewport heights, with the closing lines fading away. The measured article height determines the hold duration, including after edits and resizing.

The scene is no longer frozen during the hold. `journeyAt` returns a `drift` from -1 at the first line to +1 at the last, and the engine adds a small sideways glide to the reading camera (`DRIFT_POSITION` and `DRIFT_TARGET` in `src/flight/engine.ts`), so the valley shows parallax while reading. The glide leans in over the end of the approach and is released across the contact stage; it is zero wherever the photograph is on screen. WebGL only redraws while the camera actually moves, so a resting reader costs no scene rendering.

A navy shade sits behind the text column (`.article-veil`), strongest on the left and open on the right so the sunrise stays visible. It follows the text opacity (`--veil`), so it stays for as long as there is text to read. `.article-fade` softens the top and bottom edge of the column.

Editable paragraphs, project links and track IDs live in `src/flight/article-content.ts`. Introductory and closing copy is in `src/flight/FlightApp.tsx`. The wording is the author's own and is treated as frozen; only its typesetting changes. The article moves through Go-findus, Mondono, BMW, Music and "What else i find cool". Both SoundCloud players sit inside the Music passage, each in a thin amber frame with its track link underneath. The iframe markup and URLs are unchanged and nothing covers or hides them. Paragraphs and titles rise in once when first scrolled into view (`.reveal`); the player frames are deliberately not animated. The list of things has a slow amber glint that travels from item to item.

### Particles and figures

The opening photograph has no particles. On screens of 768px and wider, 1,100 flat amber points (no glow) appear with the article. They start as lights travelling along the photograph's ridgelines, projected into the scene so they stick to the terrain as the camera glides. One in four stays there. The others leave the ridges and gather in the right half to draw the figure of the current section, with a slight spiral so one figure turns into the next:

| Section | Figure |
| --- | --- |
| Go-findus | the Findus mascot (sampled outline, `src/assets/findus-outline.json`) |
| Mondono | shopping bag with an M |
| BMW | car front |
| Music | seventeen stacked waveforms, drawn as lines that hide the ones behind them, like ridges; they rise from flat and keep moving |
| What else i find cool | spark |

Scrolling pulls the figure along a little before it settles. Points fade out beside the text column so they never sit under the writing. Mobile remains particle-free.

### Route

Below the figure, `.flight-trail` shows the article as an elevation profile with a summit at every section (`trailHeight` and `trailPath` in `src/flight/ridges.ts`). The walked part fills in amber, a marker follows the scroll position, the current section is named above it, and the numbers 01 to 05 are buttons that scroll to their section. Below 960px the route is replaced by a thin amber progress line at the top edge.

## Contact stage and return

The return flight begins gently under the last lines and continues after the article passes. Its first 62% is the contact stage. "Let's connect." is set large in the display type and blended with `mix-blend-mode: difference`, the same way the opening "HI!" is cut out of the sky, so the opening and the closing rhyme. Beneath it the points split between LinkedIn, email and SoundCloud outlines. Each complete logo area is an accessible link with a small label; email opens a message to `niklas@go-findus.tech`. Hover and focus make a logo swell slightly. The links are inert while hidden or fading in.

On phones the contact stage is shown as well (it used to be hidden): the same title, then the three links as rows with outline icons drawn from the same path data as the particle logos (`CONTACT_OUTLINES` in `src/lib/particle-shapes.ts`).

After the contact stage the print fades back into color and the opening photo reconstructs. Native scrolling rebases at matching loop frames.

## Reduced motion and fallback

`prefers-reduced-motion` and unavailable WebGL show a static, normally scrolling article over the photograph, with the same typography and ridge marks. Reveal animations, the glint, particles, the route and the contact stage are switched off there.

## Assets and performance

| Asset | Export | Size |
| --- | --- | --- |
| `public/flight/mountain-upscaled.webp` | 2560 × 1440 | 165,466 bytes |
| `public/flight/mountain-clean.webp` | 1672 × 941 | 164,372 bytes |

The generated hero was natively 1672 × 941, then resized and compressed for the 2560 × 1440 web export. It is not native 4K. The restored background retains its native dimensions. The two served images total about 330 KB. `scripts/prepare-flight-assets.mjs` exports the hero; `scripts/prepare-photo-layers.mjs` compresses the AI clean plate using Sharp. Layer masks and perspective projection are code-native in `src/flight/photo-scene.ts`.

The engine loads separately from the photograph and HTML. Five photographic meshes share two image textures and a generated alpha mask, with capped pixel density (1.5 on desktop, 1.25 on phones), no lights, and no shadow maps. One render target and one full-screen pass produce the print. Desktop uses 1,100 points on a 2D canvas; mobile skips particle drawing entirely. Animation suspends when the page is hidden. Scene rendering stops behind the opaque opening photo and whenever the camera is at rest, which includes a reader who is not scrolling; only the particle canvas redraws then. No web fonts and no new runtime dependencies were added. Three.js remains the largest JavaScript dependency (about 532 kB before compression); performance on older phones depends on their GPU.

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

`npm run test:flight` runs thirteen tests: exact loop endpoints, delayed color/print reconstruction, continuity across the wrap, finite camera samples, leftward movement and hiker clearance, original-image projection, a constant flight phase through variable article bodies, overlapping motion at both ends, progress preservation on resize, the contact stage window, the single music stage, the reading glide (crosses the article once, never jumps, at rest wherever the photograph shows) and the route profile (a summit on every stop, one ridgeline per section). TypeScript and production bundling pass. Lint reports only the existing fast-refresh warning in the shared button component. Three.js still triggers the existing bundle-size advisory.

Browser checks for the rework (2026-10-02) covered 1920, 1440, 1366 and 1024 wide desktop views, an 820 wide tablet and a 390 wide phone: the unchanged opening frame and fly-by, the reading section with every figure, the route and its jump buttons, both SoundCloud players loading and playing when clicked, the contact stage with hover response, and the static article with reduced motion on desktop and phone.
