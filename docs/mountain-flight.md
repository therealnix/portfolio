# The Long Way Home — mountain flight experiment

Branch: `codex/mountain-flight-experiment`. The completed galaxy portfolio is preserved at commit `b53ef22` on `feature/ui-improvements`, and remains accessible in this branch at `/?view=galaxy`. The experimental flight is the default `/` view.

The opening uses Niklas's latest supplied photograph, AI enhanced and extended into a wide frame. Animated points spell “Hi”. Scrolling pulls back, dissolves into a real-time mountain valley, banks and descends through six boulder stops, then climbs back to the opening. This is a stylized procedural interpretation of the photograph, not a reconstruction of the real mountain's geometry. No heavy video or frame sequence is downloaded.

Project text rises from the projected top of each boulder using a clipped HTML reveal. This is a screen-space illusion, not mesh-depth occlusion. Hover or focus gathers the route's points into the project's outline. White points on a `mix-blend-mode: difference` canvas invert the underlying photo and scenery; varying opacity softens some points. The photo, stones, and lettering all remain responsive.

Native scrolling drives a continuous camera spline. The scroll position rebases at matching loop frames, so wheel, keyboard, and touch can keep going. Six navigation markers and an index provide direct access. SoundCloud players mount once, at full width, only when opening a music stop. Motion can be disabled; reduced-motion preferences and unavailable WebGL display a static project index.

## Assets and performance

| Asset | Export | Size |
| --- | --- | --- |
| `public/flight/mountain-upscaled.webp` | 2560 × 1440 | 165,466 bytes |
| `public/flight/alpine-rock.webp` | 1024 × 1024 | 428,844 bytes |

The generated hero was natively 1672 × 941, then resized and compressed for the 2560 × 1440 web export. It is not native 4K. The texture was generated at 1254 × 1254. `scripts/prepare-flight-assets.mjs` reproduces export sizing and compression from the generated PNGs using Sharp; no scene editing is performed by this script.

The engine loads separately from the photograph and HTML. Shared textures, instanced small stones, capped pixel density, no shadow maps, and no postprocessing limit rendering cost. Desktop uses 2,200 points; mobile uses 1,250. Animation suspends when the page is hidden, and terrain rendering stops while the opaque opening photo covers it. No new runtime dependencies were added. Three.js remains the largest JavaScript dependency; performance on older phones depends on their GPU.

## AI generation prompts

Hero source: `C:/Users/N_gam/Pictures/WhatsApp Image 2026-09-09 at 19.57.28.jpeg`.

Hero prompt:

> Use case: identity-preserve. Edit target: the attached mountain sunrise photograph. Asset type: a high-resolution full-screen website hero. Faithfully AI upscale and delicately restore fine detail in this exact photograph, extending the scene horizontally into a cinematic 16:9 landscape, ideally 3840x2160. Preserve the central hooded hiker's exact identity, pose, clothing, silhouette, and expression without inventing facial detail. Preserve the second hiker at lower left, the actual mountain ridge shapes, sunrise gradient, rocks, natural grain, and atmospheric depth. Keep the hooded hiker at approximately 56% of image width, and the original horizon around 41% of image height. Preserve the photographic dark foreground; gently resolve rock texture without flattening contrast. Outpaint only enough landscape at the left and right to obtain a seamless wide frame; no new people, no text, no logos, no illustration look, no excessive sharpening or HDR. Return one single high-resolution cinematic photograph, not a mockup or collage.

Rock texture prompt:

> Use case: photorealistic-natural. Asset type: a seamless tiling albedo texture for real-time 3D Alpine rock surfaces. Create one square 1024x1024 photograph-like texture of rugged dark weathered alpine granite and gneiss, viewed perfectly straight-on, uniform scale throughout. Smoky charcoal, taupe, muted warm gray, pale thin mineral veins, small fissures, granular stone microtexture. Seamless edges on all four sides; flat soft neutral lighting with no strong directional shadow, no large identifiable boulder shapes, no perspective, no border, no text, no objects. Realistic and subtle, suitable for tiling over large terrain meshes and rounded angular boulders at dawn. This is a material texture only, not a landscape or an illustration.

## References

- [Codrops: Scroll-Driven 3D Gallery Using a Blender Camera Path](https://tympanus.net/codrops/2026/07/07/building-a-scroll-driven-3d-gallery-using-a-blender-camera-path-with-three-js-and-gsap/) — closed camera route and smooth scroll progress.
- [Codrops: The Sleepers](https://tympanus.net/codrops/2026/07/10/the-sleepers-creating-an-atmospheric-webgl-experience-with-lightweight-techniques/) — atmosphere with lightweight WebGL techniques.

Original implementation; no reference source code or assets copied.

## Verification

`npm run test:flight` verifies exact loop endpoints, continuity across the wrap, 5,000 finite terrain-clearing camera samples, and all six project targets. `npm run build` checks TypeScript and production bundling; `npm run lint` checks source. Browser checks cover desktop and mobile layouts, hover mascot morph, native SoundCloud rendering, motion-off browsing, and the scroll loop.
