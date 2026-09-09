import * as THREE from 'three';
import { circularDelta, getFlightFrame, getPresentation, smoothstep, STATIONS, wrap } from './path';
import { createPhotoScene, photoPoint, PHOTO_ASPECT, PHOTO_TAN, HIKER_OUTLINE } from './photo-scene';
import { createSketchPass } from './sketch-pass';
import { loadParticleShapes } from '../lib/particle-shapes';
import type { ParticleShape, Point } from '../lib/particle-shapes';
interface FlightOptions {
    root: HTMLElement;
    center: HTMLDivElement;
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
        selected: number;
    };
    onStage: (index: number) => void;
    onReady: () => void;
    onError: () => void;
}
// Traced ridges of the actual photo, from the distant skyline to the near valley walls.
const RIDGES = [
    [[0, .426], [.07, .411], [.13, .444], [.17, .42], [.21, .432], [.26, .417], [.31, .447], [.37, .425], [.42, .426], [.49, .453], [.6, .48], [.8, .5], [1, .52]],
    [[0, .478], [.07, .495], [.14, .48], [.20, .537], [.27, .49], [.36, .474], [.4, .49], [.48, .527], [.56, .536], [.65, .519], [.75, .53], [.86, .56], [1, .55]],
    [[0, .556], [.06, .558], [.13, .58], [.17, .59], [.25, .531], [.34, .485], [.40, .484], [.47, .532], [.57, .572], [.65, .555], [.74, .586], [.87, .62], [1, .64]],
    [[0, .716], [.1, .765], [.22, .827], [.34, .787], [.48, .772], [.58, .7], [.68, .641], [.73, .632], [.77, .652], [.80, .704], [.88, .741], [1, .662]],
    [[0, .866], [.08, .891], [.17, .94], [.3, .974], [.41, .94], [.48, .765], [.55, .797], [.63, .817], [.72, .763], [.8, .783], [.9, .729], [1, .65]],
];
export function createMountainFlight(options: FlightOptions) {
    const { root, host, particles: canvas, photograph, intro, cards, input, onError } = options;
    const ctx = canvas.getContext('2d');
    if (!ctx)
        throw new Error('Canvas unavailable');
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.setClearColor(0x7a8397);
    host.appendChild(renderer.domElement);
    const world = createPhotoScene(renderer), sketchPass = createSketchPass(renderer);
    const camera = new THREE.PerspectiveCamera(51, 1, .1, 2400);
    camera.zoom = 1.08;
    const hud = Array.from(root.querySelectorAll<HTMLElement>('.flight-header,.flight-footer,.flight-chapter'));
    const font = getComputedStyle(document.body).fontFamily;
    let disposed = false, loaded = false, width = 1, height = 1, frameId = 0, last = 0, time = 0, phase = input.phase, lastStage = -2;
    let pointerX = 0, pointerY = 0, resting = false, selectionX = 0, selectionY = 0;
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
    const dots = Array.from({ length: 900 }, (_, i) => ({ seed: random(), angle: random() * Math.PI * 2, radius: random(), phase: random() * 6.28, index: i, x: 0, y: 0 }));
    const ridges = RIDGES.map(points => new THREE.CatmullRomCurve3(points.map(([u, v]) => photoPoint(u, v))).getPoints(800));
    const greetingRidge = RIDGES[2].map(([u, v]) => photoPoint(u, v));
    const greetingPeople = HIKER_OUTLINE.map(([u, v]) => photoPoint(u, v, 22));
    const projected = new THREE.Vector3(), look = new THREE.Vector3();
    const resize = () => {
        resting = false;
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
        const flight = getFlightFrame(phase), presentation = getPresentation(phase);
        const hero = reduced || !loaded ? 1 : flight.photo, work = reduced ? 0 : presentation.work, sketch = reduced ? 0 : presentation.sketch;
        const greeting = reduced ? 1 : presentation.greeting;
        const selected = input.selected >= 0 && work > .1 ? input.selected : -1;
        const targetX = selected < 0 ? 0 : (selected % 2 ? 2.2 : -2.2), targetY = selected < 0 ? 0 : ((selected / 2 | 0) - 1) * .9;
        selectionX += (targetX - selectionX) * (1 - Math.exp(-dt * 3.5));
        selectionY += (targetY - selectionY) * (1 - Math.exp(-dt * 3.5));
        camera.position.fromArray(flight.position);
        camera.position.x += selectionX;
        camera.position.y += selectionY;
        look.fromArray(flight.target);
        if (!reduced) {
            look.x += pointerX * .7 * sketch;
            look.y -= pointerY * .4 * sketch;
        }
        camera.up.set(Math.sin(reduced ? 0 : flight.roll), Math.cos(reduced ? 0 : flight.roll), 0);
        camera.lookAt(look);
        camera.updateMatrixWorld();
        if (loaded && hero < .999 && !reduced)
            sketchPass.render(world.scene, camera, sketch);
        photograph.style.opacity = String(hero);
        photograph.style.transform = 'scale(1.08)';
        root.style.setProperty('--sketch', String(sketch));
        root.style.setProperty('--flight-ink', `rgb(${Math.round(255 - 210 * sketch)} ${Math.round(249 - 203 * sketch)} ${Math.round(234 - 185 * sketch)})`);
        intro.style.opacity = String(greeting);
        intro.style.pointerEvents = greeting > .8 ? 'auto' : 'none';
        intro.inert = greeting <= .8;
        const hudOpacity = reduced ? 1 : presentation.hud;
        hud.forEach(node => { node.style.opacity = String(hudOpacity); node.style.visibility = hudOpacity > .01 ? 'visible' : 'hidden'; node.inert = hudOpacity < .8; });
        options.progress.style.setProperty('--flight-progress', String(phase));
        options.center.style.opacity = String(work);
        options.center.style.visibility = work > .01 ? 'visible' : 'hidden';
        const stage = STATIONS.findIndex(station => Math.abs(phase - station.phase) < .047);
        if (stage !== lastStage) {
            lastStage = stage;
            options.onStage(stage);
        }
        const mobile = width < 768;
        cards.forEach((card, index) => {
            const reveal = smoothstep(index * .035, .78 + index * .035, work), visible = reveal > .005;
            card.style.visibility = visible ? 'visible' : 'hidden';
            card.style.opacity = String(reveal);
            card.style.pointerEvents = reveal > .85 ? 'auto' : 'none';
            card.inert = reveal < .85;
            const row = index / 2 | 0, col = index % 2;
            const x = width * (mobile ? (col ? .745 : .255) : (col ? .81 : .19));
            const y = height * (mobile ? (.51 + row * .145) : (.27 + row * .235));
            card.style.left = `${x}px`;
            card.style.top = `${y + (1 - reveal) * 30}px`;
            card.style.transform = `translate(-50%,-50%) scale(${1 + (selected === index ? .025 : 0)})`;
            card.style.clipPath = 'none';
        });
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = '#fff';
        // Solid original-style greeting; only its lower strokes are occluded by the ridge.
        if (greeting > .001) {
            ctx.save();
            ctx.globalAlpha = greeting;
            ctx.beginPath();
            ctx.moveTo(-width, -height);
            ctx.lineTo(width * 2, -height);
            for (let i = greetingRidge.length - 1; i >= 0; i--) {
                projected.copy(greetingRidge[i]).project(camera);
                ctx.lineTo((projected.x * .5 + .5) * width, (-projected.y * .5 + .5) * height);
            }
            ctx.closePath();
            ctx.clip();
            ctx.beginPath();
            ctx.rect(-width, -height, width * 3, height * 3);
            greetingPeople.forEach((point, i) => { projected.copy(point).project(camera); const x = (projected.x * .5 + .5) * width, y = (-projected.y * .5 + .5) * height; if(i) ctx.lineTo(x,y); else ctx.moveTo(x,y); });
            ctx.closePath();
            ctx.clip('evenodd');
            const size = mobile ? width * .64 : Math.min(width * .40, height * .47);
            ctx.font = `900 ${size}px ${font}`;
            ctx.letterSpacing = `${-size * .065}px`;
            ctx.fillText('HI!', width * (mobile ? .025 : .065), height * (mobile ? .565 : .595));
            ctx.restore();
        }
        ctx.save();
        if (phase < .3 || phase > .9) {
            ctx.beginPath(); ctx.rect(-width, -height, width * 3, height * 3);
            greetingPeople.forEach((point,i) => { projected.copy(point).project(camera); const x=(projected.x*.5+.5)*width,y=(-projected.y*.5+.5)*height; if(i) ctx.lineTo(x,y); else ctx.moveTo(x,y); });
            ctx.closePath(); ctx.clip('evenodd');
        }
        const count = mobile ? 550 : dots.length;
        const activeShape = selected >= 0 ? STATIONS[selected].shape : input.hovered;
        const outline = activeShape ? shapes[activeShape] : undefined;
        const centerX = width * .5, centerY = height * (mobile ? .265 : .5), radius = Math.min(width * (mobile ? .20 : .15), height * .22);
        for (let bucket = 0; bucket < 4; bucket++) {
            ctx.beginPath();
            ctx.globalAlpha = (.08 + bucket * .07) * (1 - work) + (.35 + bucket * .15) * work;
            for (let i = bucket; i < count; i += 4) {
                const dot = dots[i], ridge = ridges[i % ridges.length];
                projected.copy(ridge[Math.floor(wrap(dot.seed + time * .007) * 800)]).project(camera);
                let x = (projected.x * .5 + .5) * width, y = (-projected.y * .5 + .5) * height;
                if (i % 5 !== 0) {
                    const theta = Math.acos(1 - 2 * dot.seed), phi = dot.index * 2.39996 + time * .16;
                    const r = radius * (1 + .14 * Math.sin(theta * 4 + time * .8) * Math.cos(phi * 3 - time * .3));
                    const z = Math.sin(theta) * Math.sin(phi) * r, perspective = 500 / (500 - z);
                    let bx = centerX + Math.sin(theta) * Math.cos(phi) * r * perspective, by = centerY + Math.cos(theta) * r * .78 * perspective;
                    if (outline?.length) {
                        const point = outline[Math.floor(dot.seed * outline.length)];
                        bx = centerX + point[0] * radius * .72;
                        by = centerY + point[1] * radius * .72;
                    }
                    x = x * (1 - work) + bx * work;
                    y = y * (1 - work) + by * work;
                }
                const ease = reduced || !dot.x ? 1 : 1 - Math.exp(-dt * 6);
                dot.x += (x - dot.x) * ease;
                dot.y += (y - dot.y) * ease;
                if (Math.abs(dot.x - width * .5) < width && Math.abs(dot.y - height * .5) < height) {
                    const size = .5 + bucket * .18;
                    ctx.moveTo(dot.x + size, dot.y);
                    ctx.arc(dot.x, dot.y, size, 0, Math.PI * 2);
                }
            }
            ctx.fill();
        }
        ctx.restore();
        ctx.globalAlpha = 1;
        if (!document.hidden)
            frameId = requestAnimationFrame(render);
    };
    const visibility = () => { cancelAnimationFrame(frameId); last = 0; if (!document.hidden && !disposed)
        frameId = requestAnimationFrame(render); };
    document.addEventListener('visibilitychange', visibility);
    frameId = requestAnimationFrame(render);
    return () => { disposed = true; cancelAnimationFrame(frameId); observer.disconnect(); window.removeEventListener('pointermove', pointer); document.removeEventListener('visibilitychange', visibility); renderer.domElement.removeEventListener('webglcontextlost', contextLost); sketchPass.dispose(); world.dispose(); renderer.dispose(); renderer.domElement.remove(); };
}
