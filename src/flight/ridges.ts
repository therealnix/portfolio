// The five ridgelines of the photograph, far to near, in normalized image coordinates.
// The engine projects them into the scene; the article reuses them as its line motif.
export const RIDGES = [
    [[0, .426], [.07, .411], [.13, .444], [.17, .42], [.21, .432], [.26, .417], [.31, .447], [.37, .425], [.42, .426], [.49, .453], [.6, .48], [.8, .5], [1, .52]],
    [[0, .478], [.07, .495], [.14, .48], [.20, .537], [.27, .49], [.36, .474], [.4, .49], [.48, .527], [.56, .536], [.65, .519], [.75, .53], [.86, .56], [1, .55]],
    [[0, .556], [.06, .558], [.13, .58], [.17, .59], [.25, .531], [.34, .485], [.40, .484], [.47, .532], [.57, .572], [.65, .555], [.74, .586], [.87, .62], [1, .64]],
    [[0, .716], [.1, .765], [.22, .827], [.34, .787], [.48, .772], [.58, .7], [.68, .641], [.73, .632], [.77, .652], [.80, .704], [.88, .741], [1, .662]],
    [[0, .866], [.08, .891], [.17, .94], [.3, .974], [.41, .94], [.48, .765], [.55, .797], [.63, .817], [.72, .763], [.8, .783], [.9, .729], [1, .65]],
];
/** One ridge as an SVG polyline that fills a width × height box. */
export function ridgePath(index: number, width: number, height: number) {
    const ridge = RIDGES[index % RIDGES.length];
    const low = Math.max(...ridge.map(point => point[1])), high = Math.min(...ridge.map(point => point[1]));
    return ridge.map(([u, v], i) => `${i ? 'L' : 'M'}${(u * width).toFixed(1)} ${(1 + (v - high) / (low - high) * (height - 2)).toFixed(1)}`).join(' ');
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => t * t * (3 - 2 * t);
// Stable roughness, so the profile keeps its shape between renders.
const rough = (x: number) => Math.sin(x * 91.7) * .5 + Math.sin(x * 213.1 + 1.3) * .3 + Math.sin(x * 517.9 + 4.1) * .2;
const SUMMITS = [.74, .56, .96, .66, .82];
/** Elevation along the reading route (0 valley, 1 highest), with a summit at every stop. */
export function trailHeight(stops: number[], x: number) {
    const keys: [number, number][] = [[0, .1]];
    stops.forEach((stop, i) => {
        const previous = keys[keys.length - 1][0];
        keys.push([lerp(previous, stop, .55), .2 + .1 * (i % 2)], [stop, SUMMITS[i % SUMMITS.length]]);
    });
    const last = keys[keys.length - 1][0];
    keys.push([lerp(last, 1, .5), .3], [1, .08]);
    const index = Math.max(0, keys.findIndex((key, i) => i < keys.length - 1 && x >= key[0] && x <= keys[i + 1][0]));
    const a = keys[index], b = keys[Math.min(keys.length - 1, index + 1)];
    const t = b[0] > a[0] ? Math.max(0, Math.min(1, (x - a[0]) / (b[0] - a[0]))) : 0;
    // Roughness fades out at the keys, so every summit stays exactly on its stop.
    return Math.max(.02, Math.min(1, lerp(a[1], b[1], ease(t)) + rough(x) * .055 * Math.sin(t * Math.PI)));
}
/** The route profile as an SVG path in a width × height box; `closed` returns the filled area. */
export function trailPath(stops: number[], width: number, height: number, closed = false) {
    const steps = 160;
    let d = '';
    for (let i = 0; i <= steps; i++)
        d += `${i ? 'L' : 'M'}${(i / steps * width).toFixed(1)} ${((1 - trailHeight(stops, i / steps)) * height).toFixed(1)} `;
    return closed ? `${d}L${width} ${height} L0 ${height} Z` : d.trim();
}
