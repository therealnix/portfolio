# The Long Way Home — mountain flight experiment

Branch: `codex/mountain-flight-experiment`. The completed galaxy portfolio is preserved at commit `b53ef22` on `feature/ui-improvements`, and remains accessible in this branch at `/?view=galaxy`. The experimental flight is the default `/` view.

The opening uses Niklas's latest supplied photograph, AI enhanced and extended into a wide frame. Animated points spell “Hi”. The camera moves beside the hikers, toward the next mountain on the left, then banks across the photographed valley before returning to the opening. The former procedural valley, faceted boulders, synthetic lighting and tiled rock material have been removed.

The image is divided into a distant photographic back plate, three connected depth bands for the ridges/valley/foreground, and a separate silhouette of the hikers. The hiker geometry samples the original hero pixels, preserving the face and clothing; AI only restores the landscape hidden behind them. Photo coordinates are projected into perspective depth, reproducing the original image at the home camera. A dense unlit surface retains the photograph's texture and lighting. Mirrored texture overscan covers the outer edges during the bank.

This is a constrained 2.5D photographic reconstruction with authored depth, not recovered photogrammetry or a freely navigable world. Small viewpoint changes create parallax while larger translations can stretch the single-view texture. The camera path is deliberately bounded to preserve the photographic appearance.

Project text rises at six photographed landscape anchors using a clipped HTML reveal. This is a screen-space reveal, not mesh-depth occlusion. Hover or focus gathers the route's points into the project's outline. White points on a `mix-blend-mode: difference` canvas invert the underlying photo and scenery; varying opacity softens some points.

Native scrolling drives a continuous camera spline. The scroll position rebases at matching loop frames, so wheel, keyboard, and touch can keep going. Six navigation markers and an index provide direct access. SoundCloud players mount once, at full width, only when opening a music stop. Motion can be disabled; reduced-motion preferences and unavailable WebGL display a static project index.

## Assets and performance

| Asset | Export | Size |
| --- | --- | --- |
| `public/flight/mountain-upscaled.webp` | 2560 × 1440 | 165,466 bytes |
| `public/flight/mountain-clean.webp` | 1672 × 941 | 164,372 bytes |

The generated hero was natively 1672 × 941, then resized and compressed for the 2560 × 1440 web export. It is not native 4K. The restored background retains its native dimensions. The two served images total about 330 KB. `scripts/prepare-flight-assets.mjs` exports the hero; `scripts/prepare-photo-layers.mjs` compresses the AI clean plate using Sharp. Layer masks and perspective projection are code-native in `src/flight/photo-scene.ts`.

The engine loads separately from the photograph and HTML. Five photographic meshes share two textures, with capped pixel density, no lights, no shadow maps, and no postprocessing. Desktop uses 1,800 points; mobile uses 1,100. Animation suspends when the page is hidden, and scene rendering stops behind the opaque opening photo, static index, or an open dialog. No new runtime dependencies were added. Three.js remains the largest JavaScript dependency; performance on older phones depends on their GPU.

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

`npm run test:flight` verifies exact loop endpoints, continuity across the wrap, 5,000 finite camera samples, leftward movement and clearance of the hiker plane, all six project stops, and 2,601 original-image projection coordinates. `npm run build` checks TypeScript and production bundling; `npm run lint` checks source. Browser checks cover desktop and mobile layouts, photographic edges at the furthest bank, hiker parallax, native SoundCloud rendering, motion-off browsing, and the scroll loop.
