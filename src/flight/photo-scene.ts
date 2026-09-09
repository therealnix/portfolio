import * as THREE from 'three';
export const PHOTO_ASPECT = 16 / 9;
export const PHOTO_TAN = Math.tan(51 * Math.PI / 360);
// Measured against the supplied wide photograph, in normalized image coordinates.
const skyline = [[0, .425], [.014, .429], [.038, .422], [.069, .411], [.098, .429], [.132, .434], [.169, .421], [.183, .425], [.201, .426], [.229, .423], [.257, .417], [.273, .426], [.304, .42], [.337, .422], [.362, .416], [.38, .424], [.406, .421], [.434, .424], [.463, .423], [.487, .423], [.528, .421], [.56, .422], [.61, .424], [.66, .424], [.72, .425], [.79, .425], [.85, .426], [.92, .426], [1, .426]];
function edgeAt(u: number) {
    u = Math.max(0, Math.min(1, u));
    const index = skyline.findIndex((point, i) => i < skyline.length - 1 && u >= point[0] && u <= skyline[i + 1][0]);
    const a = skyline[Math.max(0, index)], b = skyline[Math.max(0, index) + 1];
    return a[1] + (b[1] - a[1]) * Math.max(0, Math.min(1, (u - a[0]) / (b[0] - a[0])));
}
export function photoDepth(u: number, v: number) {
    const fall = Math.max(0, v - edgeAt(u));
    const ridge = Math.exp(-Math.pow((u - .24) / .19, 2) - Math.pow((v - .64) / .17, 2));
    return 48 + 650 * Math.exp(-6.7 * fall) - ridge * 24;
}
export function photoPoint(u: number, v: number, depth = photoDepth(u, v)): THREE.Vector3 {
    return new THREE.Vector3((u - .5) * depth * PHOTO_TAN * 2 * PHOTO_ASPECT, (.5 - v) * depth * PHOTO_TAN * 2, -depth);
}
// A silhouette mesh samples the ORIGINAL photograph. No generated replacement face/body.
const hikers = [
    [.252, 1], [.256, .946], [.263, .899], [.268, .864], [.276, .819], [.283, .786], [.284, .768], [.294, .733], [.303, .706], [.326, .678], [.335, .66], [.334, .634], [.341, .61], [.352, .597], [.369, .593], [.38, .601], [.386, .617], [.388, .633], [.38, .659], [.376, .676], [.391, .698], [.397, .721], [.412, .739], [.434, .725], [.455, .72], [.467, .708],
    [.465, .679], [.459, .661], [.456, .621], [.459, .581], [.466, .548], [.477, .513], [.495, .498], [.491, .482], [.5, .46], [.501, .42], [.507, .394], [.516, .377], [.527, .367], [.541, .368], [.551, .377], [.556, .39], [.559, .415], [.558, .444], [.555, .459], [.562, .477], [.565, .493], [.578, .502], [.587, .498], [.595, .502], [.594, .513], [.6, .537], [.604, .566], [.609, .612], [.606, .65], [.598, .68], [.595, .714], [.603, .748], [.616, .785], [.618, .832], [.622, .877], [.628, .909], [.638, .95], [.645, 1],
];
export const HIKER_OUTLINE = hikers.map(([u, v]) => {
    if (u < .335 && v > .67 && v < .8)
        u -= .007;
    if (u > .45 && u < .496 && v > .495 && v < .63)
        u -= .008;
    if (u > .575 && u < .612 && v > .5 && v < .66)
        u += .004;
    return [u, v];
});
export function createPhotoScene(renderer: THREE.WebGLRenderer) {
    const scene = new THREE.Scene();
    const resources: Array<{
        dispose: () => void;
    }> = [];
    let disposed = false;
    const keep = <T extends {
        dispose: () => void;
    }>(value: T) => { resources.push(value); return value; };
    const loader = new THREE.TextureLoader();
    const load = async (path: string) => {
        const texture = await loader.loadAsync(path);
        if (disposed) {
            texture.dispose();
            return texture;
        }
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.wrapS = THREE.MirroredRepeatWrapping;
        texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
        return keep(texture);
    };
    const ready = Promise.all([load('/flight/mountain-upscaled.webp'), load('/flight/mountain-clean.webp')]).then(([original, clean]) => {
        if (disposed) {
            resources.forEach(r => r.dispose());
            return;
        }
        const landscapeMaterial = keep(new THREE.MeshBasicMaterial({ map: clean, side: THREE.DoubleSide, toneMapped: false }));
        // A photographic back plate shares the horizon's projection and follows camera rotation.
        // Overscan uses mirrored edge sampling, so the bank never exposes a rectangular image border.
        const skyGeometry = keep(new THREE.PlaneGeometry(1, 1));
        const skyPosition = skyGeometry.attributes.position, skyUv = skyGeometry.attributes.uv;
        for (let i = 0; i < skyPosition.count; i++) {
            const u = skyUv.getX(i) * 2 - .5, v = 1.5 - skyUv.getY(i) * 2;
            const p = photoPoint(u, v, 698);
            skyPosition.setXYZ(i, p.x, p.y, p.z);
            skyUv.setXY(i, u, 1 - v);
        }
        skyGeometry.computeBoundingSphere();
        scene.add(new THREE.Mesh(skyGeometry, landscapeMaterial));
        // Three connected depth bands: far ridges, left mountain/valley, and near rock apron.
        // Dense photo-projected geometry retains every photograph detail without synthetic lighting.
        for (const [start, end] of [[0, .26], [.26, .66], [.66, 1]]) {
            const nx = 240, ny = 64;
            const geometry = keep(new THREE.PlaneGeometry(1, 1, nx, ny));
            const positions = geometry.attributes.position, uvs = geometry.attributes.uv;
            for (let row = 0; row <= ny; row++)
                for (let col = 0; col <= nx; col++) {
                    const u = col / nx * 1.7 - .35, band = start + (end - start) * row / ny;
                    const v = edgeAt(u) + (1 - edgeAt(u)) * band;
                    const p = photoPoint(u, v), index = row * (nx + 1) + col;
                    positions.setXYZ(index, p.x, p.y, p.z);
                    uvs.setXY(index, u, 1 - v);
                }
            geometry.computeBoundingSphere();
            scene.add(new THREE.Mesh(geometry, landscapeMaterial));
        }
        // Retain the sunlit shoulder rims, then feather the mask in source-image pixels.
        const outline = HIKER_OUTLINE;
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = 2048;
        maskCanvas.height = 1152;
        const mask = maskCanvas.getContext('2d')!;
        mask.fillStyle = '#000';
        mask.fillRect(0, 0, 2048, 1152);
        mask.filter = 'blur(2px)';
        mask.fillStyle = '#fff';
        mask.strokeStyle = '#fff';
        mask.lineWidth = 5;
        mask.lineJoin = 'round';
        mask.beginPath();
        outline.forEach(([u, v], i) => i ? mask.lineTo(u * 2048, v * 1152) : mask.moveTo(u * 2048, v * 1152));
        mask.closePath();
        mask.fill();
        mask.stroke();
        const alpha = keep(new THREE.CanvasTexture(maskCanvas));
        const personGeometry = keep(new THREE.PlaneGeometry(1, 1));
        const pos = personGeometry.attributes.position, uv = personGeometry.attributes.uv;
        for (let i = 0; i < pos.count; i++) {
            const u = uv.getX(i), v = 1 - uv.getY(i);
            uv.setXY(i, u, 1 - v);
            const p = photoPoint(u, v, 22);
            pos.setXYZ(i, p.x, p.y, p.z);
        }
        personGeometry.computeBoundingSphere();
        const people = new THREE.Mesh(personGeometry, keep(new THREE.MeshBasicMaterial({ map: original, alphaMap: alpha, transparent: true, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })));
        scene.add(people);
    });
    return { scene, ready, dispose: () => { disposed = true; resources.forEach(r => r.dispose()); } };
}
