import * as THREE from 'three';
import { circularDelta, getFlightFrame, smoothstep, STATIONS, wrap } from './path';
import { createPhotoScene, photoPoint, PHOTO_ASPECT, PHOTO_TAN } from './photo-scene';
import { loadParticleShapes } from '../lib/particle-shapes';
import type { ParticleShape, Point } from '../lib/particle-shapes';
interface FlightOptions {
    host: HTMLDivElement;
    particles: HTMLCanvasElement;
    photograph: HTMLDivElement;
    intro: HTMLDivElement;
    cards: HTMLElement[];
    progress: HTMLDivElement;
    input: {
        phase: number;
        reduced: boolean;
        paused: boolean;
        hovered: ParticleShape | null;
    };
    onStage: (index: number) => void;
    onReady: () => void;
    onError: () => void;
}
function makeHi() {
    const canvas = document.createElement('canvas');
    canvas.width = 420;
    canvas.height = 300;
    const context = canvas.getContext('2d')!;
    context.font = 'italic 270px Georgia';
    context.fillStyle = '#fff';
    context.fillText('Hi', 28, 242);
    const pixels = context.getImageData(0, 0, 420, 300).data, points: Point[] = [];
    for (let y = 0; y < 300; y += 3)
        for (let x = 0; x < 420; x += 3)
            if (pixels[(y * 420 + x) * 4 + 3] > 140)
                points.push([(x - 190) / 210, (y - 145) / 210]);
    return points;
}
export function createMountainFlight(options: FlightOptions) {
    const { host, particles: canvas, photograph, intro, cards, input, onError } = options;
    const ctx = canvas.getContext('2d');
    if (!ctx)
        throw new Error('Canvas unavailable');
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.setClearColor(0x7a8397);
    host.appendChild(renderer.domElement);
    const world = createPhotoScene(renderer);
    const camera = new THREE.PerspectiveCamera(51, 1, .1, 2400);
    camera.zoom = 1.08;
    let disposed = false, loaded = false, width = 1, height = 1, frameId = 0, last = 0, time = 0, phase = input.phase, lastStage = -2;
    let pointerX = 0, pointerY = 0, resting = false;
    void world.ready.then(() => { if (!disposed) {
        loaded = true;
        resting = false;
        options.onReady();
    } }).catch(() => { if (!disposed)
        onError(); });
    let seed = 371;
    const random = () => { seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646; };
    const hi = makeHi();
    let shapes: Partial<Record<ParticleShape, Point[]>> = {};
    void loadParticleShapes().then(value => { if (!disposed)
        shapes = value; });
    const dots = Array.from({ length: 1800 }, (_, i) => ({ seed: random(), angle: random() * Math.PI * 2, radius: random(), phase: random() * 6.28, hi: hi[i * 17 % hi.length], x: 0, y: 0 }));
    const projected = new THREE.Vector3(), look = new THREE.Vector3();
    const anchors = [[.34, .71], [.27, .67], [.24, .64], [.3, .67], [.38, .65], [.43, .62]].map(([u, v]) => photoPoint(u, v));
    const route = new THREE.CatmullRomCurve3([
        photoPoint(.5, .7, 18), photoPoint(.4, .65, 33), photoPoint(.30, .63, 66),
        photoPoint(.24, .62, 100), photoPoint(.32, .66, 115), photoPoint(.42, .64, 140), photoPoint(.50, .6, 200),
    ]).getPoints(1600);
    const resize = () => {
        resting = false;
        width = host.clientWidth;
        height = host.clientHeight;
        const dpr = Math.min(window.devicePixelRatio || 1, width < 768 ? 1.25 : 1.6);
        renderer.setPixelRatio(dpr);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.fov = 2 * Math.atan(PHOTO_TAN * Math.min(1, PHOTO_ASPECT / camera.aspect)) * 180 / Math.PI;
        camera.updateProjectionMatrix();
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    const pointer = (event: PointerEvent) => { if (event.pointerType === 'mouse') {
        pointerX = event.clientX / width - .5;
        pointerY = event.clientY / height - .5;
    } };
    window.addEventListener('pointermove', pointer, { passive: true });
    const contextLost = (event: Event) => { event.preventDefault(); cancelAnimationFrame(frameId); onError(); };
    renderer.domElement.addEventListener('webglcontextlost', contextLost);
    const render = (now: number) => {
        if (disposed)
            return;
        if ((input.paused || input.reduced) && resting) {
            last = now;
            if (!document.hidden)
                frameId = requestAnimationFrame(render);
            return;
        }
        resting = input.paused || input.reduced;
        const dt = Math.min((now - (last || now)) / 1000, .06);
        last = now;
        const reduced = input.reduced;
        if (!reduced && !input.paused)
            time += dt;
        if (!input.paused)
            phase = wrap(phase + circularDelta(phase, input.phase) * (reduced ? 1 : 1 - Math.exp(-dt * 5)));
        const flight = getFlightFrame(phase), hero = reduced || !loaded ? 1 : flight.photo;
        camera.position.fromArray(flight.position);
        look.fromArray(flight.target);
        const underway = smoothstep(.05, .2, phase) * (1 - smoothstep(.88, .96, phase));
        if (!reduced) {
            look.x += pointerX * .7 * underway;
            look.y -= pointerY * .4 * underway;
        }
        camera.up.set(Math.sin(reduced ? 0 : flight.roll), Math.cos(reduced ? 0 : flight.roll), 0);
        camera.lookAt(look);
        camera.updateMatrixWorld();
        if (loaded && hero < .999 && !reduced)
            renderer.render(world.scene, camera);
        photograph.style.opacity = String(hero);
        photograph.style.transform = 'scale(1.08)';
        const greeting = reduced ? 1 : 1 - smoothstep(.055, .16, phase) + smoothstep(.90, .98, phase);
        intro.style.opacity = String(greeting);
        intro.style.pointerEvents = greeting > .8 ? 'auto' : 'none';
        intro.inert = greeting <= .8;
        options.progress.style.setProperty('--flight-progress', String(phase));
        const stage = STATIONS.findIndex(station => Math.abs(phase - station.phase) < .047);
        if (stage !== lastStage) {
            lastStage = stage;
            options.onStage(stage);
        }
        let activeX = width * .45, activeY = height * .43;
        cards.forEach((card, index) => {
            const distance = Math.abs(phase - STATIONS[index].phase), reveal = (1 - smoothstep(.018, .062, distance)) * (1 - hero);
            projected.copy(anchors[index]).project(camera);
            const visible = reveal > .005;
            card.style.visibility = visible ? 'visible' : 'hidden';
            card.style.opacity = String(reveal);
            card.style.pointerEvents = visible && reveal > .82 ? 'auto' : 'none';
            card.inert = !visible || reveal < .82;
            if (visible) {
                const x = width < 768 ? width / 2 : Math.max(240, Math.min(width - 240, (projected.x * .5 + .5) * width));
                const rise = (1 - reveal) * 90;
                const y = Math.max(card.offsetHeight + 90, Math.min(height - 150, (-projected.y * .5 + .5) * height));
                card.style.left = `${x}px`;
                card.style.top = `${y + rise}px`;
                card.style.transform = 'translate(-50%, -100%)';
                card.style.clipPath = `inset(0 -30px ${rise}px -30px)`;
                if (index === stage) {
                    activeX = x;
                    activeY = y - 100;
                }
            }
        });
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#fff';
        const count = width < 768 ? 1100 : dots.length, hiScale = Math.min(width * .45, height * .55, 400), hiCenter = width < 768 ? width * .39 : width * .32;
        const outline = input.hovered ? shapes[input.hovered] : undefined;
        const routeStart = Math.min(.64, smoothstep(.08, .8, phase) * .64);
        for (let bucket = 0; bucket < 4; bucket++) {
            ctx.beginPath();
            ctx.globalAlpha = .35 + bucket * .2;
            for (let i = bucket; i < count; i += 4) {
                const dot = dots[i], hiX = hiCenter + dot.hi[0] * hiScale + Math.sin(time * .8 + dot.phase) * 1.2, hiY = height * .43 + dot.hi[1] * hiScale + Math.cos(time + dot.phase) * 1.2;
                let x = hiX, y = hiY, visible = true;
                if (greeting < .999) {
                    const cursor = Math.min(.999, routeStart + wrap(dot.seed + time * .055) * .3);
                    projected.copy(route[Math.floor(cursor * (route.length - 1))]);
                    const spread = .15 + dot.radius * 1.8;
                    projected.x += Math.sin(time * .6 + dot.angle) * spread;
                    projected.y += Math.cos(time * .6 + dot.angle) * spread * .5;
                    projected.project(camera);
                    x = (projected.x * .5 + .5) * width;
                    y = (-projected.y * .5 + .5) * height;
                    visible = projected.z > -1 && projected.z < 1 && Math.abs(projected.x) < 2 && Math.abs(projected.y) < 2;
                    if (outline?.length && stage >= 0 && i % 3 !== 0) {
                        const shapePoint = outline[Math.floor(dot.seed * outline.length)];
                        x = activeX + (width < 768 ? 0 : 230) + shapePoint[0] * (width < 768 ? 60 : 80);
                        y = activeY - (width < 768 ? 140 : 0) + shapePoint[1] * (width < 768 ? 60 : 80);
                        visible = true;
                    }
                    x = x * (1 - greeting) + hiX * greeting;
                    y = y * (1 - greeting) + hiY * greeting;
                }
                const ease = reduced || !dot.x ? 1 : 1 - Math.exp(-dt * 8);
                dot.x += (x - dot.x) * ease;
                dot.y += (y - dot.y) * ease;
                if (visible || greeting > .15) {
                    const size = .55 + bucket * .23;
                    ctx.moveTo(dot.x + size, dot.y);
                    ctx.arc(dot.x, dot.y, size, 0, Math.PI * 2);
                }
            }
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        if (!document.hidden)
            frameId = requestAnimationFrame(render);
    };
    const visibility = () => { cancelAnimationFrame(frameId); last = 0; if (!document.hidden && !disposed)
        frameId = requestAnimationFrame(render); };
    document.addEventListener('visibilitychange', visibility);
    frameId = requestAnimationFrame(render);
    return () => { disposed = true; cancelAnimationFrame(frameId); observer.disconnect(); window.removeEventListener('pointermove', pointer); document.removeEventListener('visibilitychange', visibility); renderer.domElement.removeEventListener('webglcontextlost', contextLost); world.dispose(); renderer.dispose(); renderer.domElement.remove(); };
}
