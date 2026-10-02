import * as THREE from 'three';
import { circularDelta, smoothstep, getFlightFrame, getPresentation, wrap } from './path';
import { createPhotoScene, photoPoint, PHOTO_ASPECT, PHOTO_TAN, HIKER_OUTLINE } from './photo-scene';
import { createSketchPass } from './sketch-pass';
import { READING_CAMERA } from './journey';
import { RIDGES } from './ridges';
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
        drift: number;
        reading: boolean;
        holding: boolean;
        reduced: boolean;
        active: number;
        reveal: number;
        contact: number;
        contactHover: number;
        contactFocus: number;
        figureX: number;
        figureY: number;
        figureRadius: number;
        clearX: number;
    };
    onReady: () => void;
    onError: () => void;
}
// How far the reading camera glides across the valley between the first and the last line.
const DRIFT_POSITION = [-3, .6, -2], DRIFT_TARGET = [-3.4, .3, 0];
const AMBER = '#f4b953';
const GOLDEN = .6180339887;
const WAVE_LINES = 17;
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
    let disposed = false, loaded = false, width = 1, height = 1, frameId = 0, last = 0, time = 0, phase = 0, drift = 0, resting = false, lastSceneKey = '';
    let scrolled = window.scrollY, pull = 0, cleared = true, waveClock = 0, waveShow = 0;
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
    // One in four points stays on the ridgelines; the others leave them to draw each figure.
    let figures = 0;
    const dots = Array.from({ length: 1100 }, (_, i) => {
        const ambient = i % 4 === 0;
        return { seed: random(), pace: .55 + random() * .9, spin: random() < .5 ? -.5 : .5, ridge: i % RIDGES.length, ambient, rank: ambient ? -1 : figures++, x: 0, y: 0, fx: 0, fy: 0, free: 0, ridgePosition: 0 };
    });
    // The music figure is drawn as lines through its points, one list per waveform, left to right.
    const waveLines = Array.from({ length: WAVE_LINES }, (_, line) => dots.filter(dot => !dot.ambient && dot.rank % WAVE_LINES === line));
    const contactResponse = [0, 0, 0];
    const ridges = RIDGES.map(points => new THREE.CatmullRomCurve3(points.map(([u, v]) => photoPoint(u, v))).getPoints(800));
    const people = HIKER_OUTLINE.map(([u, v]) => photoPoint(u, v, 22));
    const projected = new THREE.Vector3(), look = new THREE.Vector3();
    const resize = () => {
        resting = false;
        lastSceneKey = '';
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
        // Settle gently while the introduction enters, then rest on the reading view.
        const delta = circularDelta(phase, input.phase);
        phase = input.holding && Math.abs(delta) < .00005 ? READING_CAMERA : wrap(phase + delta * (1 - Math.exp(-dt * 5)));
        const glide = input.reduced ? 0 : input.drift;
        drift = Math.abs(glide - drift) < .00002 ? glide : drift + (glide - drift) * (1 - Math.exp(-dt * 5));
        const flight = getFlightFrame(phase), presentation = getPresentation(phase), sketch = input.reduced ? 0 : presentation.sketch;
        const hero = input.reduced || !loaded ? 1 : flight.photo, greeting = input.reduced ? 0 : presentation.greeting;
        camera.position.set(flight.position[0] + DRIFT_POSITION[0] * drift, flight.position[1] + DRIFT_POSITION[1] * drift, flight.position[2] + DRIFT_POSITION[2] * drift);
        look.set(flight.target[0] + DRIFT_TARGET[0] * drift, flight.target[1] + DRIFT_TARGET[1] * drift, flight.target[2] + DRIFT_TARGET[2] * drift);
        camera.up.set(Math.sin(flight.roll), Math.cos(flight.roll), 0);
        camera.lookAt(look);
        camera.updateMatrixWorld();
        // The scene only redraws while the camera moves; a resting reader costs no WebGL work.
        const sceneKey = `${phase.toFixed(7)}:${sketch.toFixed(7)}:${drift.toFixed(5)}`;
        if (loaded && hero < .999 && !input.reduced && sceneKey !== lastSceneKey) {
            sketchPass.render(world.scene, camera, sketch);
            lastSceneKey = sceneKey;
        }
        photograph.style.opacity = String(hero);
        photograph.style.transform = 'scale(1.08)';
        root.style.setProperty('--sketch', String(sketch));
        intro.style.opacity = String(greeting);
        intro.style.visibility = greeting > .005 ? 'visible' : 'hidden';
        intro.inert = greeting < .8;
        // The greeting is cut out of the photograph; the amber points sit on top of the print.
        canvas.style.mixBlendMode = greeting > .001 ? 'difference' : 'normal';
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
        const work = input.reading ? input.reveal : input.contact;
        // Particles only accompany the article and contact stage; the home photo stays clear.
        const count = width < 768 || work <= .001 ? 0 : dots.length;
        if (!count && !cleared)
            dots.forEach(dot => { dot.free = 0; dot.x = 0; });
        cleared = !count;
        // Scrolling pulls the figure along a little before it settles again.
        const moved = window.scrollY - scrolled;
        scrolled = window.scrollY;
        pull += ((Math.abs(moved) < height && dt > 0 ? moved / dt : 0) - pull) * (1 - Math.exp(-dt * 9));
        const isContact = !input.reading && input.contact > 0;
        const contactShapes: ParticleShape[] = ['linkedin', 'email', 'soundcloud'];
        const contactWidth = Math.min(820, width * .84);
        const selectedContact = input.contactHover >= 0 ? input.contactHover : input.contactFocus;
        contactResponse.forEach((value, index) => {
            const target = input.contact >= .8 && selectedContact === index ? 1 : 0;
            contactResponse[index] = value + (target - value) * (1 - Math.exp(-dt * 7));
        });
        const section = input.reading ? ARTICLE_SECTIONS[input.active] : undefined;
        const articleOutline = section ? shapes[section.shape] : undefined;
        const radius = input.figureRadius, perLine = Math.ceil(figures / WAVE_LINES);
        // The waveform lines appear once their points have gathered, rise from flat, and leave before the points scatter.
        const waving = count > 0 && section?.shape === 'music';
        waveClock = waving ? waveClock + dt : 0;
        waveShow += waving ? (smoothstep(.7, 1.7, waveClock) - waveShow) * (1 - Math.exp(-dt * 6)) : -waveShow * (1 - Math.exp(-dt * 12));
        const swellUp = smoothstep(1.1, 3, waveClock);
        // The text column stays clear of the ridge lights while reading.
        const clearX = input.reading ? input.clearX : -1e4;
        ctx.fillStyle = AMBER;
        for (let bucket = 0; bucket < 4; bucket++) {
            ctx.beginPath();
            const alpha = (bucket ? .5 + bucket * .16 : .62) * work;
            ctx.globalAlpha = alpha;
            for (let i = bucket; i < count; i += 4) {
                const dot = dots[i], ridge = ridges[dot.ridge];
                // Points travel slowly along their ridge and recycle at its ends.
                const ridgePosition = wrap(dot.seed + time * .006);
                const recycled = ridgePosition < dot.ridgePosition;
                dot.ridgePosition = ridgePosition;
                projected.copy(ridge[Math.floor(ridgePosition * 800)]).project(camera);
                const rx = (projected.x * .5 + .5) * width, ry = (-projected.y * .5 + .5) * height;
                let gather = 0, bx = rx, by = ry, lift = 0, drag = dot.seed;
                if (!dot.ambient && isContact) {
                    const contactIndex = dot.rank % 3, outline = shapes[contactShapes[contactIndex]];
                    if (outline?.length) {
                        // Optical sizing balances the square mark against the wider envelope and cloud.
                        const size = Math.min(78, contactWidth / 9) * [.83, 1, 1.08][contactIndex];
                        const point = outline[Math.floor(Math.floor(dot.rank / 3) / Math.ceil(figures / 3) * outline.length)];
                        const response = contactResponse[contactIndex];
                        const reach = size * .8 * (1 + .018 * Math.sin(time * .85) + response * .08) + response * 2.4 * Math.sin(time * 3 + dot.seed * 18);
                        bx = width * .5 + (contactIndex - 1) * contactWidth / 3 + point[0] * reach + Math.sin(time * 1.2 + dot.seed * 25) * 1.1;
                        by = height * .56 + point[1] * reach + Math.cos(time + dot.seed * 31) * 1.1 - response * 4;
                        gather = work;
                    }
                } else if (!dot.ambient && section?.shape === 'music') {
                    // Stacked waveforms: sound drawn the way the ridges are.
                    const line = dot.rank % WAVE_LINES, t = (Math.floor(dot.rank / WAVE_LINES) + .5) / perLine;
                    const swell = Math.exp(-Math.pow((t - .5) / .2, 2));
                    const wave = (.5 + .5 * Math.sin(t * 19 + line * 1.9 + time * 1.7)) * (.55 + .45 * Math.sin(t * 7.3 - line * .8 - time * 1.1));
                    bx = input.figureX + (t - .5) * radius * 2.2;
                    by = input.figureY + (line / (WAVE_LINES - 1) - .42) * radius * 1.7;
                    // The moving part is added after the easing, so neighbours on a line stay in step.
                    lift = (swell * wave * radius * .5 + Math.sin(t * 43 + line + time * 2.2) * radius * .006) * swellUp;
                    drag = line / (WAVE_LINES - 1);
                    gather = 1;
                } else if (!dot.ambient && articleOutline?.length) {
                    const point = articleOutline[Math.floor(wrap(dot.rank * GOLDEN) * articleOutline.length)];
                    const reach = radius * .86 * (1 + .018 * Math.sin(time * .85));
                    bx = input.figureX + point[0] * reach + Math.sin(time * 1.2 + dot.seed * 25) * 1.2;
                    by = input.figureY + point[1] * reach + Math.cos(time + dot.seed * 31) * 1.2;
                    gather = 1;
                }
                const settle = dot.x ? 1 - Math.exp(-dt * 4.6 * dot.pace) : 1;
                dot.free += (gather - dot.free) * (isContact ? 1 : settle);
                if (dot.free < .02 || !dot.x) {
                    dot.fx = bx;
                    dot.fy = by;
                } else {
                    // A slight spiral, so one figure turns into the next instead of sliding.
                    const dx = bx - dot.fx, dy = by - dot.fy;
                    dot.fx += (dx - dy * dot.spin) * settle;
                    dot.fy += (dy + dx * dot.spin) * settle;
                }
                const free = dot.free * dot.free * (3 - 2 * dot.free);
                dot.x = rx + (dot.fx - rx) * free;
                dot.y = ry + (dot.fy - lift - ry) * free - pull * .012 * drag * free * (isContact ? 0 : 1);
                // Fade at the ridge ends and beside the text; a gathered point is always fully drawn.
                const edge = smoothstep(0, .025, ridgePosition) * (1 - smoothstep(.975, 1, ridgePosition)) * smoothstep(clearX + 10, clearX + 190, dot.x);
                const opacity = (recycled && free < .5 ? 0 : edge + (1 - edge) * free) * (dot.ambient ? 1 : 1 - waveShow * free);
                if (opacity > .004 && Math.abs(dot.x - width * .5) < width && Math.abs(dot.y - height * .5) < height) {
                    const size = .75 + dot.ridge * .2 + bucket * .12;
                    if (opacity < .999) {
                        // Only the fading points need separate fills; keep the rest batched.
                        const faded = new Path2D();
                        faded.arc(dot.x, dot.y, size, 0, Math.PI * 2);
                        ctx.globalAlpha = alpha * opacity;
                        ctx.fill(faded);
                        ctx.globalAlpha = alpha;
                    } else {
                        ctx.moveTo(dot.x + size, dot.y);
                        ctx.arc(dot.x, dot.y, size, 0, Math.PI * 2);
                    }
                }
            }
            ctx.fill();
        }
        if (waveShow > .01) {
            // Back to front, every waveform hides the ones behind it, like one ridge in front of the next.
            ctx.lineWidth = 1.3;
            ctx.lineJoin = 'round';
            ctx.strokeStyle = AMBER;
            for (const line of waveLines) {
                ctx.beginPath();
                ctx.moveTo(line[0].x, line[0].y);
                // Curves through the midpoints keep the crests round with few points.
                for (let i = 1; i < line.length - 1; i++)
                    ctx.quadraticCurveTo(line[i].x, line[i].y, (line[i].x + line[i + 1].x) / 2, (line[i].y + line[i + 1].y) / 2);
                ctx.lineTo(line[line.length - 1].x, line[line.length - 1].y);
                ctx.globalAlpha = .9 * waveShow * work;
                ctx.fillStyle = '#0a2238';
                ctx.fill();
                ctx.globalAlpha = waveShow * work;
                ctx.stroke();
            }
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
    return () => { disposed = true; cancelAnimationFrame(frameId); observer.disconnect(); document.removeEventListener('visibilitychange', visibility); renderer.domElement.removeEventListener('webglcontextlost', contextLost); sketchPass.dispose(); world.dispose(); renderer.dispose(); renderer.domElement.remove(); };
}
