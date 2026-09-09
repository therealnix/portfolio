# Portfolio particle artwork

The opening screen has sparse drifting dots. Scrolling into the work section gathers a rotating, three-arm galaxy around “Here's what I do.” Hover or keyboard-focus a card to morph the same particles into its outline. Leaving the card returns to the galaxy. On touch screens, touching a card selects its shape; “Back to orbit” clears it.

| Card | Particle outline |
| --- | --- |
| Findus | The hub's smiling mascot, including its antenna |
| Jost-Shop | Storefront |
| turntuppp | Musical notes |
| Onedanceee | Headphones and sound bars |
| Cool things | Sparkle |
| Modono | Shopping bag with an M |

The renderer uses a single Canvas 2D surface with perspective-projected points, 4,200 foreground particles on desktop and 2,400 on mobile. No new dependencies. It pauses in hidden tabs, caps pixel density, and respects reduced motion. SoundCloud iframe markup and URLs remain unchanged; the canvas never receives pointer events. One responsive card list replaces the old hidden duplicate players, avoiding zero-width initialization errors and preserving the same player instances when resizing.

## Mascot source

`src/assets/findus-outline.json` is sampled from `Findus_hub/public/brand/findus-smile-black.png`, the asset referenced by `Findus_hub/components/findus-avatar.tsx`. The original 1.2 MB raster is not bundled. To regenerate on Windows:

```powershell
./scripts/sample-mascot.ps1 -SourceImage 'C:/path/to/Findus_hub/public/brand/findus-smile-black.png'
```

## Visual references

- [Codrops: Creating a Particles Galaxy](https://tympanus.net/codrops/2022/06/21/creating-a-particles-galaxy-with-three-js/) — spiral motion and depth.
- [Codrops: Interactive Particles](https://tympanus.net/codrops/2019/01/17/interactive-particles-with-three-js/) — imagery represented by fine points and responsive motion.

The implementation is original; these are visual references, not copied source code.
