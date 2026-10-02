import * as THREE from 'three';
import { circularDelta, getFlightFrame, getPresentation, wrap } from './path';
import { createPhotoScene, photoPoint, PHOTO_ASPECT, PHOTO_TAN, HIKER_OUTLINE } from './photo-scene';
import { createSketchPass } from './sketch-pass';
interface FlightOptions {
    host: HTMLDivElement;
    greeting: HTMLCanvasElement;
    photograph: HTMLDivElement;
    vignette: HTMLDivElement;
    intro: HTMLDivElement;
    input: {
        phase: number;
        reduced: boolean;
    };
    onReady: () => void;
    onError: () => void;
}
export function createMountainFlight(options: FlightOptions) {
    const { host, greeting: canvas, photograph, vignette, intro, input, onError } = options;
    const ctx = canvas.getContext('2d');
    if (!ctx)
        throw new Error('Canvas unavailable');
    // The scene is photographic texture on smooth meshes, so multisampling buys nothing here.
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'high-performance' });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    host.appendChild(renderer.domElement);
    const world = createPhotoScene(renderer), sketchPass = createSketchPass(renderer);
    const camera = new THREE.PerspectiveCamera(51, 1, .1, 2400);
    camera.zoom = 1.08;
    const font = getComputedStyle(document.body).fontFamily;
    let disposed = false, loaded = false, running = false, width = 1, height = 1, frameId = 0, last = 0, phase = 0, lastKey = '';
    // Resolution steps down if this machine cannot keep up with the flight.
    let quality = 1, slow = 0, greeted = false;
    const people = HIKER_OUTLINE.map(([u, v]) => photoPoint(u, v, 22));
    const projected = new THREE.Vector3(), look = new THREE.Vector3();
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
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        lastKey = '';
        wake();
    };
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
    const draw = (dt: number) => {
        const flight = getFlightFrame(phase), presentation = getPresentation(phase), sketch = input.reduced ? 0 : presentation.sketch;
        const hero = input.reduced || !loaded ? 1 : flight.photo, greeting = input.reduced ? 0 : presentation.greeting;
        camera.position.fromArray(flight.position);
        look.fromArray(flight.target);
        camera.up.set(Math.sin(flight.roll), Math.cos(flight.roll), 0);
        camera.lookAt(look);
        camera.updateMatrixWorld();
        if (loaded && hero < .999 && !input.reduced) {
            sketchPass.render(world.scene, camera, sketch);
            // Count frames that miss 60 per second; a run of them lowers the render resolution one step.
            slow = dt > .021 ? slow + 1 : Math.max(0, slow - 1);
            if (slow > 24 && quality > .6) {
                quality = Math.max(.6, quality * .85);
                slow = 0;
                size();
            }
        }
        photograph.style.opacity = String(hero);
        photograph.style.transform = 'scale(1.08)';
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
            const size = (width < 768 ? width * .64 : Math.min(width * .40, height * .47)) / 3;
            ctx.font = `900 ${size}px ${font}`;
            ctx.letterSpacing = `${-size * .065}px`;
            ctx.fillText('HI!', width * (width < 768 ? .12 : 1 / 3), height * .32);
            ctx.restore();
        }
    };
    const render = (now: number) => {
        if (disposed)
            return;
        const dt = Math.min((now - (last || now)) / 1000, .06);
        last = now;
        const delta = circularDelta(phase, input.phase);
        phase = Math.abs(delta) < .00002 ? input.phase : wrap(phase + delta * (1 - Math.exp(-dt * 5)));
        // Everything on screen follows the flight phase. Once it has settled, the loop stops until the next scroll.
        const key = `${phase}:${width}:${height}:${loaded}:${input.reduced}`;
        if (key !== lastKey) {
            lastKey = key;
            draw(dt);
        } else if (phase === input.phase) {
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
        // Upload the textures and compile both passes now, behind the opening photograph,
        // so the first scroll does not pay for them.
        sketchPass.render(world.scene, camera, .5);
        loaded = true;
        lastKey = '';
        wake();
        options.onReady();
    } }).catch(() => { if (!disposed)
        onError(); });
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
