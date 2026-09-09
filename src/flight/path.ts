export type Vec3 = [
    number,
    number,
    number
];
export const wrap = (v: number) => ((v % 1) + 1) % 1;
export const clamp = (v: number) => Math.max(0, Math.min(1, v));
export const smoothstep = (a: number, b: number, v: number) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
export const circularDelta = (from: number, to: number) => wrap(to - from + 0.5) - 0.5;

export function getPresentation(value: number) {
    const phase = wrap(value);
    return {
        greeting: 1 - smoothstep(.06, .18, phase) + smoothstep(.90, .98, phase),
        sketch: smoothstep(.12, .31, phase) * (1 - smoothstep(.82, .96, phase)),
        work: smoothstep(.23, .32, phase) * (1 - smoothstep(.81, .90, phase)),
        hud: smoothstep(.14, .25, phase) * (1 - smoothstep(.88, .96, phase)),
    };
}
export const STATIONS = [
    { id: 'findus', title: 'Findus', category: 'BUILDING SOMETHING NEW', phase: 0.28, x: 5, z: -35, shape: 'findus', description: "What I'm currently working on. A new project, built with curiosity.", href: 'https://go-findus.tech' },
    { id: 'jost', title: 'Jost-Shop', category: 'CODE MEETS COMMERCE', phase: 0.38, x: -10, z: -78, shape: 'shop', description: 'A custom Shopify storefront with a Three.js homepage. Built to be explored.', href: 'https://jost-shop.com' },
    { id: 'modono', title: 'Modono', category: 'FIRST HIRED ENGINEER', phase: 0.48, x: 10, z: -121, shape: 'modono', description: "I'm the first hired engineer at Modono, building webshops for business clients.", href: 'https://mondono.eu' },
    { id: 'turntuppp', title: 'turntuppp', category: 'SOUND / S0N!K', phase: 0.58, x: -7, z: -164, shape: 'music', description: 'A little energy for the descent. A bootleg from my SoundCloud.', href: 'https://soundcloud.com/jigglniggl/turntuppp', track: '2292371054' },
    { id: 'onedanceee', title: 'Onedanceee', category: 'AFTER HOURS / S0N!K', phase: 0.68, x: 8, z: -207, shape: 'headphones', description: 'Another side of what I make. Best explored with headphones.', href: 'https://soundcloud.com/jigglniggl/lamp-rawmix1', track: '2093814105' },
    { id: 'things', title: 'Cool things', category: 'OFF THE CLOCK', phase: 0.78, x: -4, z: -250, shape: 'spark', description: 'Mountains, music, and the small things that make life interesting.', href: '', details: 'Beluga lentils, Adam Audio T7V, Traktor Controll MX-2, Hyperlite Pleasure, Lowa Cadin II, Arizona Iced Tea, Paracord, Luma, Niagara Launcher, BMW f87, ScreenZen, Billabong Boardshorts, Ikea, Rossignol Ski Boots, Nosebutter 360s, Sendlinger Spezialkebab, Victorinox, U3 Universität, FL Studio updates, myradl.' },
] as const;
export type Station = typeof STATIONS[number];
interface Keyframe {
    t: number;
    position: Vec3;
    target: Vec3;
    roll: number;
}
const home: Vec3 = [0, 0, 0], homeTarget: Vec3 = [0, 0, -200];
const keys: Keyframe[] = [
    { t: 0, position: home, target: homeTarget, roll: 0 },
    { t: .045, position: home, target: homeTarget, roll: 0 },
    { t: .15, position: [-3, .3, -2], target: [-8, 0, -200], roll: -.012 },
    { t: .28, position: [-9, -1.5, -9], target: [-26, -5, -200], roll: -.033 },
    { t: .38, position: [-16, -3, -17], target: [-38, -13, -200], roll: -.02 },
    { t: .48, position: [-23, -4, -26], target: [-40, -19, -200], roll: .012 },
    { t: .58, position: [-27, -5, -32], target: [-26, -25, -200], roll: .032 },
    { t: .68, position: [-28, -6, -38], target: [-7, -22, -200], roll: .02 },
    { t: .78, position: [-24, -5, -34], target: [4, -6, -200], roll: 0 },
    { t: .87, position: [-14, -2, -17], target: [-8, 2, -200], roll: -.018 },
    { t: .965, position: home, target: homeTarget, roll: 0 },
    { t: 1, position: home, target: homeTarget, roll: 0 },
];
function hermite(a: number, b: number, before: number, after: number, u: number, span: number, leftSpan: number, rightSpan: number, first: boolean, last: boolean) {
    const m0 = first ? 0 : (b - before) / leftSpan * span, m1 = last ? 0 : (after - a) / rightSpan * span;
    return (2 * u * u * u - 3 * u * u + 1) * a + (u * u * u - 2 * u * u + u) * m0 + (-2 * u * u * u + 3 * u * u) * b + (u * u * u - u * u) * m1;
}
export function photoOpacity(phase: number) {
    return 1 - smoothstep(.012, .043, phase) + smoothstep(.967, .99, phase);
}
export function getFlightFrame(value: number) {
    const phase = wrap(value);
    const index = Math.max(0, keys.findIndex((key, i) => i < keys.length - 1 && phase >= key.t && phase <= keys[i + 1].t));
    const a = keys[index], b = keys[index + 1], before = keys[Math.max(0, index - 1)], after = keys[Math.min(keys.length - 1, index + 2)];
    const span = b.t - a.t, u = clamp((phase - a.t) / span);
    const sample = (av: number, bv: number, pv: number, nv: number) => hermite(av, bv, pv, nv, u, span, b.t - before.t, after.t - a.t, index === 0, index === keys.length - 2);
    const vector = (field: 'position' | 'target') => a[field].map((v, i) => sample(v, b[field][i], before[field][i], after[field][i])) as Vec3;
    return { phase, position: vector('position'), target: vector('target'), roll: sample(a.roll, b.roll, before.roll, after.roll), fov: 51, photo: photoOpacity(phase) };
}
