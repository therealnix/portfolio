import * as THREE from 'three';
/** Reprint the live camera render on paper; every mountain and hiker keeps its scene projection. */
export function createSketchPass(renderer: THREE.WebGLRenderer) {
    const target = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: true });
    const material = new THREE.ShaderMaterial({
        uniforms: {
            image: { value: target.texture }, amount: { value: 0 },
            // Two muted inks on warm paper: the slate of the ridges and the ochre of the sunrise.
            ink: { value: new THREE.Color('#1c2733') },
            slate: { value: new THREE.Color('#566c82') },
            mist: { value: new THREE.Color('#a9b7bf') },
            paper: { value: new THREE.Color('#efe7d6') },
            umber: { value: new THREE.Color('#7b5c3a') },
            ochre: { value: new THREE.Color('#cfa15f') },
            sand: { value: new THREE.Color('#f0deb6') },
        },
        depthTest: false, depthWrite: false,
        vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
        fragmentShader: `
      uniform sampler2D image;
      uniform float amount;
      uniform vec3 ink, slate, mist, paper, umber, ochre, sand;
      varying vec2 vUv;
      float hash(vec2 p){ vec3 q=fract(vec3(p.xyx)*.1031); q+=dot(q,q.yzx+33.33); return fract((q.x+q.y)*q.z); }
      vec3 ramp(float t, vec3 a, vec3 b, vec3 c, vec3 d, float s1, float s2, float s3){
        return t<s1 ? mix(a,b,t/s1) : t<s2 ? mix(b,c,(t-s1)/(s2-s1)) : mix(c,d,clamp((t-s2)/(s3-s2),0.,1.));
      }
      void main(){
        vec3 photo = texture2D(image,vUv).rgb;
        // Work from this frame's color and brightness, never a replacement image.
        vec3 perceptual = pow(max(photo,vec3(0.)),vec3(1./2.2));
        float brightness = dot(perceptual,vec3(.299,.587,.114));
        // The strongest channel separates the open sky from the ridges better than brightness alone.
        float value = max(perceptual.r,max(perceptual.g,perceptual.b));
        float tone = mix(brightness,value,.6);
        tone = mix(tone,floor(tone*12.+.5)/12.,.2);
        // Paper tooth, fixed to the screen.
        float grain = hash(floor(gl_FragCoord.xy))-.5;
        tone += grain*.06;
        float warmth = smoothstep(-.02,.25,perceptual.r-perceptual.b+grain*.05);
        vec3 cool = ramp(tone,ink,slate,mist,paper,.3,.56,.8);
        vec3 warm = ramp(tone,ink,umber,ochre,sand,.3,.6,.92);
        // Retain a little photographic shading under the two inks.
        vec3 printColor = mix(mix(cool,warm,warmth),photo,.1);
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
