import * as THREE from 'three';
import { circularDelta, getFlightFrame, getPresentation, wrap } from './path';
import { createPhotoScene, photoPoint, PHOTO_ASPECT, PHOTO_TAN, HIKER_OUTLINE } from './photo-scene';
import { createSketchPass } from './sketch-pass';
import { READING_CAMERA } from './journey';
import { RIDGES } from './ridges';
interface FlightOptions {
    host: HTMLDivElement;
    greeting: HTMLCanvasElement;
    front: HTMLCanvasElement;
    photograph: HTMLDivElement;
    vignette: HTMLDivElement;
    intro: HTMLDivElement;
    input: {
        phase: number;
        horizon: number;
        /** Whether article text can be near the mountains, so they have to be drawn in front of it. */
        front: boolean;
        reduced: boolean;
    };
    onReady: () => void;
    onError: () => void;
}
// While reading, the highest point of the mountains settles at five sixths of the screen height,
// and the camera climbs a little on the way, so the near ridges sink further than the far ones.
const LOW_HORIZON = 5 / 6, RISE = 3;
// The text passes behind the mountains along a hard edge at the far ridgeline. Above the edge it fades in:
// starting at FADE_FROM transparency right at the edge and reaching full strength FADE_HEIGHT higher,
// a share of the screen height. Only the fade is drawn at a fraction of the resolution; the edge stays sharp.
const FADE_FROM = .78, FADE_HEIGHT = .055, FADE_STEPS = 12, FADE_SCALE = 4;
// The mountains in front of the text only ever cover the lower part of the screen, so the front layer
// is just that part: FRONT_SHARE of the screen height, anchored to the bottom.
const FRONT_SHARE = .55;
// Heights of the stacked fade layers, spaced so that together they ease out smoothly (inverse smoothstep).
const FADE_OFFSETS = Array.from({ length: FADE_STEPS }, (_, k) => .5 - Math.sin(Math.asin(1 - 2 * (k + .5) / FADE_STEPS) / 3));
// The outline of the mountains: the far ridgeline of the photograph, carried past both of its edges.
// The greeting on the opening photograph, cut out of the sky.
const GREETING = 'WELCOME :)';
const OUTLINE = [[-.4, RIDGES[0][0][1]], ...RIDGES[0], [1.4, RIDGES[0][RIDGES[0].length - 1][1]]];
export function createMountainFlight(options: FlightOptions) {
    const { host, greeting: canvas, front, photograph, vignette, intro, input, onError } = options;
    const ctx = canvas.getContext('2d'), frontCtx = front.getContext('2d');
    const fade = document.createElement('canvas'), fadeCtx = fade.getContext('2d');
    const cut = document.createElement('canvas'), cutCtx = cut.getContext('2d');
    if (!ctx || !frontCtx || !fadeCtx || !cutCtx)
        throw new Error('Canvas unavailable');
    // The scene is photographic texture on smooth meshes, so multisampling buys nothing here.
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    host.appendChild(renderer.domElement);
    const world = createPhotoScene(renderer), sketchPass = createSketchPass(renderer);
    const camera = new THREE.PerspectiveCamera(51, 1, .1, 2400);
    camera.zoom = 1.08;
    const projection = new THREE.Matrix4();
    const font = getComputedStyle(document.body).fontFamily;
    let disposed = false, loaded = false, running = false, width = 1, height = 1, frameId = 0, last = 0, phase = 0, horizon = 0, shift = 0, lastKey = '';
    // Resolution steps down if this machine cannot keep up with the flight.
    let quality = 1, slow = 0, greeted = false, fronted = false, frontTop = 0;
    // Recent frame intervals. A browser or power setting can cap the frame rate (Windows energy saver holds
    // Edge at about 30 per second); a steady cap is not a slow frame, and lowering the resolution would not help.
    const intervals: number[] = [];
    const people = HIKER_OUTLINE.map(([u, v]) => photoPoint(u, v, 22));
    const outline = new THREE.CatmullRomCurve3(OUTLINE.map(([u, v]) => photoPoint(u, v))).getPoints(320);
    const projected = new THREE.Vector3(), look = new THREE.Vector3();
    const toScreen = (point: THREE.Vector3) => {
        projected.copy(point).project(camera);
        return [(projected.x * .5 + .5) * width, (-projected.y * .5 + .5) * height];
    };
    /** Place the camera on the flight path, raised and with the horizon lowered by `low` (0 to 1). */
    const aim = (at: number, low: number) => {
        const flight = getFlightFrame(at);
        camera.position.set(flight.position[0], flight.position[1] + RISE * low, flight.position[2]);
        look.set(flight.target[0], flight.target[1] + RISE * low, flight.target[2]);
        camera.up.set(Math.sin(flight.roll), Math.cos(flight.roll), 0);
        camera.lookAt(look);
        camera.updateMatrixWorld();
        // A lens shift: the whole picture slides down without changing its perspective.
        camera.projectionMatrix.copy(projection);
        camera.projectionMatrix.elements[9] += shift * low;
        camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
        return flight;
    };
    const size = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, width < 768 ? 1.25 : 1.5);
        renderer.setPixelRatio(dpr * quality);
        renderer.setSize(width, height, false);
        sketchPass.resize(Math.round(width * dpr * quality), Math.round(height * dpr * quality));
        return dpr;
    };
    const resize = () => {
        width = host.clientWidth;
        height = host.clientHeight;
        quality = 1;
        slow = 0;
        const dpr = size();
        camera.aspect = width / height;
        camera.fov = 2 * Math.atan(PHOTO_TAN * Math.min(1, PHOTO_ASPECT / camera.aspect)) * 180 / Math.PI;
        camera.updateProjectionMatrix();
        projection.copy(camera.projectionMatrix);
        // Measure where the outline would sit in the raised reading view, and shift it to the low horizon.
        shift = 0;
        aim(READING_CAMERA, 1);
        let top = height;
        for (const point of outline) {
            const [x, y] = toScreen(point);
            if (x >= 0 && x <= width)
                top = Math.min(top, y);
        }
        shift = 2 * (LOW_HORIZON - top / height);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        frontTop = Math.round(height * (1 - FRONT_SHARE));
        front.style.top = `${frontTop}px`;
        front.style.height = `${height - frontTop}px`;
        front.width = Math.round(width * dpr);
        front.height = Math.round((height - frontTop) * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        frontCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        cut.width = front.width;
        cut.height = front.height;
        fade.width = Math.ceil(width / FADE_SCALE);
        fade.height = Math.ceil((height - frontTop) / FADE_SCALE);
        // Resizing wipes every canvas. Draw again right away, before the browser shows the frame,
        // instead of on the next one: otherwise a resize flashes black (on phones every time the address bar moves).
        if (loaded) {
            lastKey = key();
            draw(0);
        } else {
            lastKey = '';
            wake();
        }
    };
    const maskPeople = () => {
        ctx.beginPath();
        ctx.rect(-width, -height, width * 3, height * 3);
        people.forEach((point, i) => { const [x, y] = toScreen(point); if (i)
            ctx.lineTo(x, y);
        else
            ctx.moveTo(x, y); });
        ctx.closePath();
        ctx.clip('evenodd');
    };
    /** Copy the mountains below their outline onto the front canvas, which lies above the article. */
    const drawFront = () => {
        // The area below the outline, in CSS pixels of the front canvas (which starts at frontTop).
        const shape = new Path2D();
        outline.forEach((point, i) => {
            const [x, screenY] = toScreen(point), y = screenY - frontTop;
            if (!i)
                shape.moveTo(-width, y);
            shape.lineTo(x, y);
            if (i === outline.length - 1)
                shape.lineTo(width * 2, y);
        });
        shape.lineTo(width * 2, height * 2);
        shape.lineTo(-width, height * 2);
        shape.closePath();
        // The fade above the edge: the same area stacked at rising heights, at low resolution.
        const scale = 1 / FADE_SCALE;
        fadeCtx.setTransform(1, 0, 0, 1, 0, 0);
        fadeCtx.clearRect(0, 0, fade.width, fade.height);
        fadeCtx.globalCompositeOperation = 'lighter';
        fadeCtx.fillStyle = `rgba(255,255,255,${FADE_FROM / FADE_STEPS})`;
        for (const offset of FADE_OFFSETS) {
            fadeCtx.setTransform(scale, 0, 0, scale, 0, -height * scale * FADE_HEIGHT * offset);
            fadeCtx.fill(shape);
        }
        // The cut: fully opaque below the outline with a sharp edge, plus the fade above it.
        const dpr = front.width / width;
        cutCtx.setTransform(1, 0, 0, 1, 0, 0);
        cutCtx.clearRect(0, 0, cut.width, cut.height);
        cutCtx.globalCompositeOperation = 'source-over';
        cutCtx.drawImage(fade, 0, 0, fade.width * FADE_SCALE * dpr, fade.height * FADE_SCALE * dpr);
        cutCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        cutCtx.fillStyle = '#fff';
        cutCtx.fill(shape);
        // Only the lower part of the rendered frame is copied.
        const source = renderer.domElement, ratio = source.height / height;
        frontCtx.globalCompositeOperation = 'copy';
        frontCtx.drawImage(source, 0, frontTop * ratio, source.width, (height - frontTop) * ratio, 0, 0, width, height - frontTop);
        frontCtx.globalCompositeOperation = 'destination-in';
        frontCtx.drawImage(cut, 0, 0, width, height - frontTop);
        frontCtx.globalCompositeOperation = 'source-over';
    };
    const draw = (dt: number) => {
        const flight = aim(phase, horizon), presentation = getPresentation(phase), sketch = input.reduced ? 0 : presentation.sketch;
        const hero = input.reduced || !loaded ? 1 : flight.photo, greeting = input.reduced ? 0 : presentation.greeting;
        const layered = loaded && hero < .999 && !input.reduced && horizon > .001 && input.front;
        if (loaded && hero < .999 && !input.reduced) {
            sketchPass.render(world.scene, camera, sketch, horizon, 1 - (1 - LOW_HORIZON) * horizon - .5 * (1 - horizon));
            // Read straight back while this frame's drawing buffer is still current.
            if (layered)
                drawFront();
            // A run of dropped frames lowers the render resolution one step. A frame counts as dropped when it
            // took clearly longer than the fastest recent ones and longer than 1/50 s.
            if (dt > 0) {
                intervals.push(dt);
                if (intervals.length > 30)
                    intervals.shift();
            }
            const cadence = Math.min(...intervals);
            slow = intervals.length >= 10 && dt > Math.max(cadence * 1.45, .02) ? slow + 1 : Math.max(0, slow - 1);
            if (slow > 24 && quality > .6) {
                quality = Math.max(.6, quality * .85);
                slow = 0;
                size();
            }
        }
        if (layered !== fronted) {
            front.style.visibility = layered ? 'visible' : 'hidden';
            if (!layered)
                frontCtx.clearRect(0, 0, width, height - frontTop);
            fronted = layered;
        }
        photograph.style.opacity = String(hero);
        vignette.style.opacity = String(1 - sketch);
        intro.style.opacity = String(greeting);
        intro.style.visibility = greeting > .005 ? 'visible' : 'hidden';
        intro.inert = greeting < .8;
        // The greeting is cut out of the photograph; away from the opening its canvas is not even composited.
        const greet = greeting > .001;
        if (greet || greeted)
            ctx.clearRect(0, 0, width, height);
        if (greet !== greeted)
            canvas.style.visibility = greet ? 'visible' : 'hidden';
        greeted = greet;
        if (greet) {
            ctx.save();
            ctx.fillStyle = '#fff';
            ctx.globalAlpha = greeting;
            maskPeople();
            // The greeting keeps the size the short "HI!" had, unless the longer word would not fit its room.
            const phone = width < 768, base = (phone ? width * .64 : Math.min(width * .40, height * .47)) / 3;
            ctx.font = `900 ${base}px ${font}`;
            ctx.letterSpacing = `${-base * .065}px`;
            const room = phone ? width * .84 : width * .4, measured = ctx.measureText(GREETING).width;
            const size = measured > room ? base * room / measured : base;
            ctx.font = `900 ${size}px ${font}`;
            ctx.letterSpacing = `${-size * .065}px`;
            const textWidth = ctx.measureText(GREETING).width;
            // On a phone it is centred above the hikers; on wider screens it sits in the open sky to their left.
            const x = phone ? (width - textWidth) / 2 : width * .08;
            ctx.fillText(GREETING, x, height * .32);
            ctx.restore();
        }
    };
    const key = () => `${phase}:${horizon}:${width}:${height}:${loaded}:${input.reduced}:${input.front}`;
    const render = (now: number) => {
        if (disposed)
            return;
        const dt = Math.min((now - (last || now)) / 1000, .06);
        last = now;
        const delta = circularDelta(phase, input.phase);
        phase = Math.abs(delta) < .00002 ? input.phase : wrap(phase + delta * (1 - Math.exp(-dt * 5)));
        // The horizon eases down and back up at the same pace as the camera.
        const goal = input.reduced ? 0 : input.horizon;
        horizon = Math.abs(goal - horizon) < .0005 ? goal : horizon + (goal - horizon) * (1 - Math.exp(-dt * 4));
        // Everything on screen follows the flight phase and the horizon. Once both have settled, the loop stops until the next scroll.
        const current = key();
        if (current !== lastKey) {
            lastKey = current;
            draw(dt);
        } else if (phase === input.phase && horizon === goal) {
            running = false;
            return;
        }
        frameId = requestAnimationFrame(render);
    };
    function wake() {
        if (running || disposed || document.hidden)
            return;
        running = true;
        last = 0;
        frameId = requestAnimationFrame(render);
    }
    void world.ready.then(() => { if (!disposed) {
        // Upload the textures, compile the shaders for both ways the scene is drawn (straight to the screen near
        // the photograph, through the print pass everywhere else) and prepare the front layer, all behind the
        // opening photograph, so the first scroll does not pay for any of it.
        sketchPass.render(world.scene, camera, 0);
        sketchPass.render(world.scene, camera, .5);
        drawFront();
        frontCtx.clearRect(0, 0, width, height - frontTop);
        loaded = true;
        lastKey = '';
        wake();
        options.onReady();
    } }).catch(() => { if (!disposed)
        onError(); });
    photograph.style.transform = 'scale(1.08)';
    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    const contextLost = (event: Event) => { event.preventDefault(); cancelAnimationFrame(frameId); onError(); };
    renderer.domElement.addEventListener('webglcontextlost', contextLost);
    const visibility = () => { cancelAnimationFrame(frameId); running = false; wake(); };
    document.addEventListener('visibilitychange', visibility);
    return {
        wake,
        dispose: () => { disposed = true; cancelAnimationFrame(frameId); observer.disconnect(); document.removeEventListener('visibilitychange', visibility); renderer.domElement.removeEventListener('webglcontextlost', contextLost); sketchPass.dispose(); world.dispose(); renderer.dispose(); renderer.domElement.remove(); },
    };
}
