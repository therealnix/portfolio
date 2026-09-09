# The Long Way Home — mountain flight experiment

Branch: `codex/mountain-flight-experiment`. The completed galaxy portfolio is preserved at commit `b53ef22` on `feature/ui-improvements`, and remains accessible in this branch at `/?view=galaxy`. The experimental flight is the default `/` view.

The opening uses Niklas's latest supplied photograph, AI enhanced and extended into a wide frame. Only a small “HI!” in the upper-left sky and a scroll cue are visible. The greeting is one third of the previous size and uses the original portfolio’s sans-serif font stack with negative blending. The camera moves beside the hikers, toward the next mountain on the left, then banks across the photographed valley before returning to the opening.

The image is divided into a distant photographic back plate, three connected depth bands for the ridges/valley/foreground, and a separate silhouette of the hikers. The hiker layer samples original hero pixels, preserving the face and clothing; AI only restores the landscape hidden behind them. Both shoulder masks are expanded to retain sunlit rims, with a five-pixel stroke and two-pixel feather on a 2048 × 1152 runtime mask. Photo coordinates are projected into perspective depth, reproducing the original image at the home camera. Mirrored texture overscan covers the outer edges during the bank.

This is a constrained 2.5D photographic reconstruction with authored depth, not recovered photogrammetry or a freely navigable world. Small viewpoint changes create parallax while larger translations can stretch the single-view texture. The camera path is deliberately bounded to preserve the photographic appearance.

The approach lasts five viewport heights. Color is retained through the first half of that approach, then gradually fades into a shaded, anime-inspired monochrome treatment. Fine Sobel contours and broader detail detection retain mountain ridgelines and rock texture; restrained cel shading and hatching preserve the midtones. This is a live shader, requiring no extra image assets.

The camera then holds at exactly 48% of its route while a single centered article scrolls over the landscape. The measured article height determines the hold duration, so editing the copy or resizing the window cannot start the return flight before the last line has cleared the screen. The background render is cached during this hold: neither scrolling, pointer movement nor clicks can move it. Only the particle canvas animates.

Editable placeholder paragraphs, project links and track IDs live in `src/flight/article-content.ts`. Introductory and closing copy is in `src/flight/FlightApp.tsx`. The article moves through Findus, Jost-Shop, Modono, two music passages and personal interests. It uses a 600px serif text column with simple underlined links, without cards, dialogs, navigation markers or overlay labels. Existing SoundCloud players mount once each in the left margin on wide screens and inline below 1280px. The right margin is reserved for particles, which smoothly form the outline associated with the current passage. The outlines gently breathe and drift even when scrolling stops.

Larger background points follow five measured ridgelines. White points and greeting on a `mix-blend-mode: difference` canvas invert the underlying photo; the hikers occlude background points near the opening. The article starts with an organic particle blob, then uses the existing mascot, shop, shopping bag, musical note, headphones and spark outlines.

After the entire article passes, a 3.5-viewport return flight resumes the camera route. The sketch fades back into color and the opening photo reconstructs. Native scrolling rebases at the matching loop frames. Reduced-motion preferences and unavailable WebGL show a static, normally scrolling article.

## Assets and performance

| Asset | Export | Size |
| --- | --- | --- |
| `public/flight/mountain-upscaled.webp` | 2560 × 1440 | 165,466 bytes |
| `public/flight/mountain-clean.webp` | 1672 × 941 | 164,372 bytes |

The generated hero was natively 1672 × 941, then resized and compressed for the 2560 × 1440 web export. It is not native 4K. The restored background retains its native dimensions. The two served images total about 330 KB. `scripts/prepare-flight-assets.mjs` exports the hero; `scripts/prepare-photo-layers.mjs` compresses the AI clean plate using Sharp. Layer masks and perspective projection are code-native in `src/flight/photo-scene.ts`.

The engine loads separately from the photograph and HTML. Five photographic meshes share two image textures and a generated alpha mask, with capped pixel density, no lights, and no shadow maps. One render target and one full-screen sketch pass produce the monochrome view. Desktop uses 900 points; mobile uses 550. Animation suspends when the page is hidden. Scene rendering stops behind the opaque opening photo and throughout the article hold; only particles redraw while reading. No new runtime dependencies were added. Three.js remains the largest JavaScript dependency; performance on older phones depends on their GPU.

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

Nine flight tests verify exact loop endpoints, delayed color/sketch reconstruction, continuity across the wrap, finite camera samples, leftward movement and hiker clearance, original-image projection, a constant camera across variable article lengths, and progress preservation on resize. TypeScript and production bundling pass. Lint reports only the existing fast-refresh warning in the shared button component. Three.js still triggers the existing bundle-size advisory.

Browser checks cover the smaller opening greeting, shaded mountain contours, article layout, section-driven particle figures, both native SoundCloud players in the left margin, and an identical landscape screenshot before and after article scrolling.
