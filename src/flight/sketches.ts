// Line drawings for the article margins and the contact stage, on a 256 × 256 board.
// They are plain SVG paths that draw themselves in once; nothing here animates per frame.

// Stacked waveforms for the music section: sound drawn the way the ridges are.
function waveforms() {
    let d = '';
    for (let line = 0; line < 6; line++)
        for (let i = 0; i <= 44; i++) {
            const t = i / 44, swell = Math.exp(-Math.pow((t - .5) / .21, 2));
            const wave = (.5 + .5 * Math.sin(t * 19 + line * 1.9 + 1.2)) * (.55 + .45 * Math.sin(t * 7.3 - line * .8));
            d += `${i ? 'L' : 'M'}${(22 + t * 212).toFixed(1)} ${(92 + line * 27 - swell * wave * 62 - Math.sin(t * 43 + line) * .9).toFixed(1)} `;
        }
    return d.trim();
}
export const SKETCHES: Record<string, string> = {
    findus: 'M128 70 V51 Q129 33 144 32 Q156 32 154 44 M72 70 H184 Q216 70 216 102 V182 Q216 216 182 216 H74 Q40 216 40 182 V102 Q40 70 72 70 Z M89 140 a9 15 0 1 0 18 0 a9 15 0 1 0 -18 0 M149 140 a9 15 0 1 0 18 0 a9 15 0 1 0 -18 0 M111 174 Q128 188 145 174',
    modono: 'M51 87 H205 L219 216 H37 Z M89 100 V68 C89 16 167 16 167 68 V100 M83 177 V128 L128 164 L173 128 V177',
    car: 'M38 126 L59 69 Q62 60 74 60 H182 Q194 60 197 69 L218 126 M59 108 L72 76 H184 L197 108 Z M38 126 Q27 132 27 147 V191 H229 V147 Q229 132 218 126 Z M27 166 H229 M48 139 H82 V153 H48 Z M174 139 H208 V153 H174 Z M100 141 H156 V154 H100 Z M39 191 V211 H70 V191 M186 191 V211 H217 V191',
    music: waveforms(),
    spark: 'M128 27 C138 94 162 116 227 128 C162 140 138 162 128 229 C116 162 94 140 29 128 C94 116 116 94 128 27 Z M210 22 V62 M190 42 H230 M44 199 V229 M29 214 H59',
};
export const CONTACT_SKETCHES = {
    linkedin: 'M42 32 H214 Q224 32 224 42 V214 Q224 224 214 224 H42 Q32 224 32 214 V42 Q32 32 42 32 Z M65 102 H91 V192 H65 Z M91 73 A13 13 0 1 1 65 73 A13 13 0 1 1 91 73 Z M110 192 V102 H136 V114 C146 93 193 95 193 132 V192 H167 V139 C167 117 136 117 136 140 V192 Z',
    email: 'M35 65 H221 V193 H35 Z M35 68 L128 143 L221 68 M35 190 L101 132 M221 190 L155 132',
    soundcloud: 'M20 142 V167 M35 127 V180 M50 113 V184 M65 98 V184 M80 108 V184 M95 83 V184 M110 70 V184 M126 184 V66 C156 52 189 76 193 114 C244 101 260 184 215 184 Z',
};
/** A drawing as separate strokes, so each one can be drawn after the other. */
export const strokes = (d: string) => d.split(/(?=M)/).map(stroke => stroke.trim()).filter(Boolean);
