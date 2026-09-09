export type Vec3 = [number, number, number];
export const wrap = (v: number) => ((v % 1) + 1) % 1;
export const clamp = (v: number) => Math.max(0, Math.min(1, v));
export const smoothstep = (a: number, b: number, v: number) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
export const circularDelta = (from: number, to: number) => wrap(to - from + 0.5) - 0.5;

export function terrainHeight(x: number, z: number) {
  const valley = Math.max(0, Math.abs(x - Math.sin(z * 0.023) * 9) - 24);
  const ridges = Math.abs(Math.sin(x * 0.027 + z * 0.019) * Math.cos(z * 0.017 - x * 0.011));
  const fine = Math.sin(x * 0.16 + z * 0.08) * 0.55 + Math.cos(z * 0.13 - x * 0.11) * 0.7;
  return 1 + Math.sin(z * 0.029) * 2 + fine + Math.pow(valley, 0.96) * (0.3 + ridges * 0.46);
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

interface Keyframe { t: number; position: Vec3; target: Vec3; }
const home: Vec3 = [0, 35, 64];
const homeTarget: Vec3 = [0, 12, -75];
const keys: Keyframe[] = [
  { t: 0, position: home, target: homeTarget },
  { t: 0.04, position: home, target: homeTarget },
  { t: 0.12, position: [5, 85, 100], target: [0, 3, -100] },
  { t: 0.21, position: [-10, 24, 4], target: [5, 4, -38] },
  ...STATIONS.map((station, i): Keyframe => ({
    t: station.phase,
    position: [station.x + (i % 2 ? 7 : -7), terrainHeight(station.x, station.z) + 10.5, station.z + 21],
    target: [station.x, terrainHeight(station.x, station.z) + 6, station.z],
  })),
  { t: 0.85, position: [42, 64, -252], target: [0, 10, -195] },
  { t: 0.90, position: [58, 96, -65], target: [0, 15, 20] },
  { t: 0.96, position: home, target: homeTarget },
  { t: 1, position: home, target: homeTarget },
];

function interpolate(t: number, field: 'position' | 'target'): Vec3 {
  const index = Math.max(0, keys.findIndex((key, i) => i < keys.length - 1 && t >= key.t && t <= keys[i + 1].t));
  const a = keys[index], b = keys[index + 1];
  const before = keys[Math.max(0, index - 1)], after = keys[Math.min(keys.length - 1, index + 2)];
  const span = b.t - a.t;
  const u = clamp((t - a.t) / span), u2 = u * u, u3 = u2 * u;
  return a[field].map((value, axis) => {
    const m0 = index === 0 ? 0 : (b[field][axis] - before[field][axis]) / (b.t - before.t) * span;
    const m1 = index + 1 === keys.length - 1 ? 0 : (after[field][axis] - value) / (after.t - a.t) * span;
    return (2 * u3 - 3 * u2 + 1) * value + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * b[field][axis] + (u3 - u2) * m1;
  }) as Vec3;
}

export function photoOpacity(phase: number) {
  return 1 - smoothstep(0.055, 0.18, phase) + smoothstep(0.885, 0.97, phase);
}

export function getFlightFrame(value: number) {
  const phase = wrap(value);
  const position = interpolate(phase, 'position');
  position[1] = Math.max(position[1], terrainHeight(position[0], position[2]) + 4);
  const target = interpolate(phase, 'target');
  const dive = smoothstep(0.07, 0.15, phase) * (1 - smoothstep(0.20, 0.27, phase));
  const roll = Math.sin(phase * Math.PI * 14) * 0.07 * smoothstep(0.08, 0.2, phase) * (1 - smoothstep(0.83, 0.96, phase));
  return { phase, position, target, fov: 51 + dive * 13, roll, photo: photoOpacity(phase) };
}
