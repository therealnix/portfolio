import * as THREE from 'three';
/** Recolor the live camera render; every mountain and hiker keeps its scene projection. */
export function createSketchPass(renderer: THREE.WebGLRenderer) {
    const target = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: true });
    const material = new THREE.ShaderMaterial({
        uniforms: {
            image: { value: target.texture }, amount: { value: 0 },
            navy: { value: new THREE.Color('#071d32') },
            blue: { value: new THREE.Color('#527eaa') },
            amber: { value: new THREE.Color('#f4b953') },
        },
        depthTest: false, depthWrite: false,
        vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
        fragmentShader: `
      uniform sampler2D image;
      uniform float amount;
      uniform vec3 navy, blue, amber;
      varying vec2 vUv;
      void main(){
        vec3 photo = texture2D(image,vUv).rgb;
        // Work from this frame's color and brightness, never a replacement image.
        vec3 perceptual = pow(max(photo,vec3(0.)),vec3(1./2.2));
        float brightness = dot(perceptual,vec3(.299,.587,.114));
        float stepped = floor(brightness*12.+.5)/12.;
        float tone = mix(brightness,stepped,.22);
        float warmth = smoothstep(-.02,.25,perceptual.r-perceptual.b);
        vec3 coolInk = mix(navy,blue,smoothstep(.015,.64,tone));
        vec3 warmInk = mix(navy,amber,smoothstep(.04,.78,tone));
        vec3 ink = mix(coolInk,warmInk,warmth);
        // Retain fine photographic shading within the limited navy/amber palette.
        vec3 printColor = mix(ink,photo,.16);
        gl_FragColor=vec4(mix(photo,printColor,smoothstep(0.,1.,amount)),1.);
        #include <colorspace_fragment>
      }`,
    });
    const geometry = new THREE.PlaneGeometry(2, 2);
    const scene = new THREE.Scene();
    scene.add(new THREE.Mesh(geometry, material));
    const camera = new THREE.Camera();
    return {
        resize: (w: number, h: number) => { target.setSize(w, h); },
        render: (world: THREE.Scene, view: THREE.Camera, amount: number, captureColor?: (source: HTMLCanvasElement) => void) => {
            if (amount < .001) { renderer.render(world, view); return; }
            renderer.setRenderTarget(target);
            renderer.render(world, view);
            renderer.setRenderTarget(null);
            material.uniforms.amount.value = amount;
            renderer.render(scene, camera);
            captureColor?.(renderer.domElement);
        },
        dispose: () => { target.dispose(); geometry.dispose(); material.dispose(); },
    };
}
