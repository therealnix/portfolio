import * as THREE from 'three';
import { circularDelta, smoothstep, getFlightFrame, getPresentation, wrap } from './path';
import { createPhotoScene, photoPoint, PHOTO_ASPECT, PHOTO_TAN, HIKER_OUTLINE } from './photo-scene';
import { createSketchPass } from './sketch-pass';
import { READING_CAMERA } from './journey';
import { ARTICLE_SECTIONS } from './article-content';
import { loadParticleShapes } from '../lib/particle-shapes';
import type { ParticleShape, Point } from '../lib/particle-shapes';
interface FlightOptions {
    root: HTMLElement;
    host: HTMLDivElement;
    particles: HTMLCanvasElement;
    photograph: HTMLDivElement;
    intro: HTMLDivElement;
    input: {
        phase: number;
        reading: boolean;
        holding: boolean;
        reduced: boolean;
        active: number;
        reveal: number;
        figureX: number;
        figureY: number;
        figureRadius: number;
    };
    onReady: () => void;
    onError: () => void;
}
const RIDGES = [
    [[0, .426], [.07, .411], [.13, .444], [.17, .42], [.21, .432], [.26, .417], [.31, .447], [.37, .425], [.42, .426], [.49, .453], [.6, .48], [.8, .5], [1, .52]],
    [[0, .478], [.07, .495], [.14, .48], [.20, .537], [.27, .49], [.36, .474], [.4, .49], [.48, .527], [.56, .536], [.65, .519], [.75, .53], [.86, .56], [1, .55]],
    [[0, .556], [.06, .558], [.13, .58], [.17, .59], [.25, .531], [.34, .485], [.40, .484], [.47, .532], [.57, .572], [.65, .555], [.74, .586], [.87, .62], [1, .64]],
    [[0, .716], [.1, .765], [.22, .827], [.34, .787], [.48, .772], [.58, .7], [.68, .641], [.73, .632], [.77, .652], [.80, .704], [.88, .741], [1, .662]],
    [[0, .866], [.08, .891], [.17, .94], [.3, .974], [.41, .94], [.48, .765], [.55, .797], [.63, .817], [.72, .763], [.8, .783], [.9, .729], [1, .65]],
];
export function createMountainFlight(options: FlightOptions) {
    const { root, host, particles: canvas, photograph, intro, input, onError } = options;
    const ctx = canvas.getContext('2d');
    if (!ctx)
        throw new Error('Canvas unavailable');
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    host.appendChild(renderer.domElement);
    const world = createPhotoScene(renderer), sketchPass = createSketchPass(renderer);
    const camera = new THREE.PerspectiveCamera(51, 1, .1, 2400);
    camera.zoom = 1.08;
    const font = getComputedStyle(document.body).fontFamily;
    const palette = document.createElement('canvas');
    palette.width = 192;
    palette.height = 128;
    const paletteContext = palette.getContext('2d');
    let paletteReady = false, lastPalette = -Infinity;
    const captureColor = (source: HTMLCanvasElement) => {
        paletteContext?.drawImage(source, 0, 0, palette.width, palette.height);
        paletteReady = !!paletteContext;
    };
    let disposed = false, loaded = false, width = 1, height = 1, frameId = 0, last = 0, time = 0, phase = 0, resting = false, lastSceneKey = '';
    void world.ready.then(() => { if (!disposed) {
        loaded = true;
        resting = false;
        options.onReady();
    } }).catch(() => { if (!disposed)
        onError(); });
    let seed = 371;
    const random = () => { seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646; };
    let shapes: Partial<Record<ParticleShape, Point[]>> = {};
    void loadParticleShapes().then(value => { if (!disposed)
        shapes = value; });
    const dots = Array.from({ length: 600 }, (_, i) => ({ seed: random(), index: i, x: 0, y: 0, ridgePosition: 0 }));
    const ridges = RIDGES.map(points => new THREE.CatmullRomCurve3(points.map(([u, v]) => photoPoint(u, v))).getPoints(800));
    const people = HIKER_OUTLINE.map(([u, v]) => photoPoint(u, v, 22));
    const projected = new THREE.Vector3(), look = new THREE.Vector3();
    const resize = () => {
        resting = false;
        lastSceneKey = '';
        paletteReady = false;
        width = host.clientWidth;
        height = host.clientHeight;
        const dpr = Math.min(window.devicePixelRatio || 1, width < 768 ? 1.25 : 1.5);
        renderer.setPixelRatio(dpr);
        renderer.setSize(width, height, false);
        sketchPass.resize(Math.round(width * dpr), Math.round(height * dpr));
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
    const contextLost = (event: Event) => { event.preventDefault(); cancelAnimationFrame(frameId); onError(); };
    renderer.domElement.addEventListener('webglcontextlost', contextLost);
    const maskPeople = () => {
        ctx.beginPath();
        ctx.rect(-width, -height, width * 3, height * 3);
        people.forEach((point, i) => { projected.copy(point).project(camera); const x = (projected.x * .5 + .5) * width, y = (-projected.y * .5 + .5) * height; if (i)
            ctx.lineTo(x, y);
        else
            ctx.moveTo(x, y); });
        ctx.closePath();
        ctx.clip('evenodd');
    };
    const render = (now: number) => {
        if (disposed)
            return;
        if (input.reduced && resting) {
            last = now;
            if (!document.hidden)
                frameId = requestAnimationFrame(render);
            return;
        }
        resting = input.reduced;
        const dt = Math.min((now - (last || now)) / 1000, .06);
        last = now;
        if (!input.reduced)
            time += dt;
        // Settle gently while the introduction enters, then cache the central reading view.
        const delta = circularDelta(phase, input.phase);
        phase = input.holding && Math.abs(delta) < .00005 ? READING_CAMERA : wrap(phase + delta * (1 - Math.exp(-dt * 5)));
        const flight = getFlightFrame(phase), presentation = getPresentation(phase), sketch = input.reduced ? 0 : presentation.sketch;
        const hero = input.reduced || !loaded ? 1 : flight.photo, greeting = input.reduced ? 0 : presentation.greeting;
        camera.position.fromArray(flight.position);
        look.fromArray(flight.target);
        camera.up.set(Math.sin(flight.roll), Math.cos(flight.roll), 0);
        camera.lookAt(look);
        camera.updateMatrixWorld();
        const sceneKey = `${phase.toFixed(7)}:${sketch.toFixed(7)}`;
        if (loaded && hero < .999 && !input.reduced && sceneKey !== lastSceneKey) {
            const capture = width >= 768 && sketch > .001 && (!paletteReady || phase === READING_CAMERA || now - lastPalette > 100);
            sketchPass.render(world.scene, camera, sketch, capture ? captureColor : undefined);
            if (capture) lastPalette = now;
            lastSceneKey = sceneKey;
        }
        photograph.style.opacity = String(hero);
        photograph.style.transform = 'scale(1.08)';
        root.style.setProperty('--sketch', String(sketch));
        intro.style.opacity = String(greeting);
        intro.style.visibility = greeting > .005 ? 'visible' : 'hidden';
        intro.inert = greeting < .8;
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#fff';
        if (greeting > .001) {
            ctx.save();
            ctx.globalAlpha = greeting;
            maskPeople();
            const size = (width < 768 ? width * .64 : Math.min(width * .40, height * .47)) / 3;
            ctx.font = `900 ${size}px ${font}`;
            ctx.letterSpacing = `${-size * .065}px`;
            ctx.fillText('HI!', width * (width < 768 ? .12 : 1 / 3), height * .32);
            ctx.restore();
        }
        ctx.save();
        if (phase < .3 || phase > .9)
            maskPeople();
        // Keep the greeting on mobile, but skip every particle, including article figures.
        const count = width < 768 ? 0 : dots.length, work = input.reading ? input.reveal : 0;
        const outline = shapes[ARTICLE_SECTIONS[input.active]?.shape];
        for (let bucket = 0; bucket < 4; bucket++) {
            ctx.beginPath();
            const alpha = (.15 + bucket * .10) * (1 - work) + (.38 + bucket * .18) * work;
            ctx.globalAlpha = alpha;
            for (let i = bucket; i < count; i += 4) {
                const dot = dots[i], ridge = ridges[i % ridges.length];
                // Restore the original ridge flow, but recycle at the ends without interpolating across the image.
                const ridgePosition = wrap(dot.seed + time * .007);
                const recycled = ridgePosition < dot.ridgePosition;
                dot.ridgePosition = ridgePosition;
                const edgeOpacity = smoothstep(0, .025, ridgePosition) * (1 - smoothstep(.975, 1, ridgePosition));
                const opacity = edgeOpacity * (1 - work) + work;
                projected.copy(ridge[Math.floor(ridgePosition * 800)]).project(camera);
                let x = (projected.x * .5 + .5) * width, y = (-projected.y * .5 + .5) * height;
                if (work > 0) {
                    const radius = input.figureRadius, theta = Math.acos(1 - 2 * dot.seed), phi = dot.index * 2.39996 + time * .16;
                    const r = radius * (1 + .14 * Math.sin(theta * 4 + time * .8) * Math.cos(phi * 3 - time * .3));
                    const perspective = 500 / (500 - Math.sin(theta) * Math.sin(phi) * r);
                    let bx = input.figureX + Math.sin(theta) * Math.cos(phi) * r * perspective, by = input.figureY + Math.cos(theta) * r * .78 * perspective;
                    if (outline?.length) {
                        const point = outline[Math.floor(dot.seed * outline.length)];
                        const breathe = 1 + .018 * Math.sin(time * .85);
                        bx = input.figureX + point[0] * radius * .8 * breathe + Math.sin(time * 1.2 + dot.seed * 25) * 1.3;
                        by = input.figureY + point[1] * radius * .8 * breathe + Math.cos(time + dot.seed * 31) * 1.3;
                    }
                    x = x * (1 - work) + bx * work;
                    y = y * (1 - work) + by * work;
                }
                const ease = !dot.x || work === 0 || (recycled && work < .99) ? 1 : 1 - Math.exp(-dt * 6);
                dot.x += (x - dot.x) * ease;
                dot.y += (y - dot.y) * ease;
                if (Math.abs(dot.x - width * .5) < width && Math.abs(dot.y - height * .5) < height) {
                    const size = .95 + bucket * .30;
                    if (opacity < .999) {
                        // Only the few fading endpoints need separate fills; keep the rest batched.
                        const edge = new Path2D();
                        edge.arc(dot.x, dot.y, size, 0, Math.PI * 2);
                        ctx.globalAlpha = alpha * opacity;
                        ctx.fill(edge);
                        ctx.globalAlpha = alpha;
                    } else {
                        ctx.moveTo(dot.x + size, dot.y);
                        ctx.arc(dot.x, dot.y, size, 0, Math.PI * 2);
                    }
                }
            }
            ctx.fill();
        }
        ctx.restore();
        ctx.globalAlpha = 1;
        const colored = width >= 768 && sketch > .001 && paletteReady;
        canvas.style.mixBlendMode = colored ? 'normal' : 'difference';
        if (colored) {
            // The landscape loses its color while the points recover that same color.
            // Source-in keeps the particle silhouettes and alpha; no per-pixel CPU readback.
            ctx.save();
            ctx.globalCompositeOperation = 'source-in';
            ctx.filter = `invert(${1 - sketch})`;
            ctx.drawImage(palette, 0, 0, width, height);
            ctx.restore();
            if (work > .001) {
                ctx.save();
                ctx.globalCompositeOperation = 'source-atop';
                ctx.globalAlpha = work;
                ctx.fillStyle = '#ff9b50';
                ctx.fillRect(0, 0, width, height);
                ctx.restore();
            }
        }
        if (!document.hidden)
            frameId = requestAnimationFrame(render);
    };
    const visibility = () => { cancelAnimationFrame(frameId); last = 0; if (!document.hidden && !disposed)
        frameId = requestAnimationFrame(render); };
    document.addEventListener('visibilitychange', visibility);
    frameId = requestAnimationFrame(render);
    return () => { disposed = true; cancelAnimationFrame(frameId); observer.disconnect(); document.removeEventListener('visibilitychange', visibility); renderer.domElement.removeEventListener('webglcontextlost', contextLost); sketchPass.dispose(); world.dispose(); renderer.dispose(); renderer.domElement.remove(); };
}
