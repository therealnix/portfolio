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
      float hash(vec2 p){ vec3 q=fract(vec3(p.xyx)*.1031); q+=dot(q,q.yzx+33.33); return fract((q.x+q.y)*q.z); }
      void main(){
        vec3 photo = texture2D(image,vUv).rgb;
        // Work from this frame's color and brightness, never a replacement image.
        vec3 perceptual = pow(max(photo,vec3(0.)),vec3(1./2.2));
        float brightness = dot(perceptual,vec3(.299,.587,.114));
        float stepped = floor(brightness*12.+.5)/12.;
        // Paper grain, fixed to the screen like the tooth of a print.
        float grain = hash(floor(gl_FragCoord.xy))-.5;
        float tone = mix(brightness,stepped,.22)+grain*.085;
        float warmth = smoothstep(-.02,.25,perceptual.r-perceptual.b+grain*.05);
        vec3 coolInk = mix(navy,blue,smoothstep(.015,.64,tone));
        vec3 warmInk = mix(navy,amber,smoothstep(.04,.78,tone));
        vec3 ink = mix(coolInk,warmInk,warmth);
        // Retain fine photographic shading within the limited navy/amber palette.
        vec3 printColor = mix(ink,photo,.16);
        // The ink runs a little heavier toward the corners of the sheet.
        printColor = mix(printColor,navy,.34*smoothstep(.5,1.15,length((vUv-.5)*vec2(1.5,1.2))));
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
        render: (world: THREE.Scene, view: THREE.Camera, amount: number) => {
            if (amount < .001) { renderer.render(world, view); return; }
            renderer.setRenderTarget(target);
            renderer.render(world, view);
            renderer.setRenderTarget(null);
            material.uniforms.amount.value = amount;
            renderer.render(scene, camera);
        },
        dispose: () => { target.dispose(); geometry.dispose(); material.dispose(); },
    };
}
