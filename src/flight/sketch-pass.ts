import * as THREE from 'three';
/** Reprint the live camera render on paper; every mountain and hiker keeps its scene projection. */
export function createSketchPass(renderer: THREE.WebGLRenderer) {
    const target = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: true });
    const material = new THREE.ShaderMaterial({
        uniforms: {
            image: { value: target.texture }, amount: { value: 0 }, haze: { value: 0 },
            texel: { value: new THREE.Vector2(1, 1) }, density: { value: 1 },
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
      uniform float amount, haze, density;
      uniform vec2 texel;
      uniform vec3 ink, slate, mist, paper, umber, ochre, sand;
      varying vec2 vUv;
      float hash(vec2 p){ vec3 q=fract(vec3(p.xyx)*.1031); q+=dot(q,q.yzx+33.33); return fract((q.x+q.y)*q.z); }
      vec3 ramp(float t, vec3 a, vec3 b, vec3 c, vec3 d, float s1, float s2, float s3){
        return t<s1 ? mix(a,b,t/s1) : t<s2 ? mix(b,c,(t-s1)/(s2-s1)) : mix(c,d,clamp((t-s2)/(s3-s2),0.,1.));
      }
      void main(){
        vec3 photo = texture2D(image,vUv).rgb;
        if (haze > .001) {
          // While reading, the valley goes softly out of focus: a dithered disc of samples,
          // about 11 CSS pixels wide at full haze. The paper grain below stays sharp.
          float radius = haze * 11. * density, spin = hash(gl_FragCoord.yx) * 6.2832;
          vec3 sum = photo;
          for (int i = 1; i < 20; i++) {
            float f = float(i), angle = f * 2.39996 + spin;
            sum += texture2D(image, vUv + vec2(cos(angle), sin(angle)) * sqrt(f / 19.) * radius * texel).rgb;
          }
          photo = sum / 20.;
        }
        // Work from this frame's color and brightness, never a replacement image.
        vec3 perceptual = pow(max(photo,vec3(0.)),vec3(1./2.2));
        float brightness = dot(perceptual,vec3(.299,.587,.114));
        // The strongest channel separates the open sky from the ridges better than brightness alone.
        float value = max(perceptual.r,max(perceptual.g,perceptual.b));
        float tone = mix(brightness,value,.6);
        tone = mix(tone,floor(tone*12.+.5)/12.,.2);
        // While reading, the dark half of the print is lifted toward the paper so that ink stays legible everywhere.
        tone = mix(tone,.5+.5*tone,haze);
        // Paper tooth, fixed to the screen.
        float grain = hash(floor(gl_FragCoord.xy))-.5;
        tone += grain*.06;
        float warmth = smoothstep(-.02,.25,perceptual.r-perceptual.b+grain*.05);
        // In the haze only the bright sunrise keeps its ochre; where the soft sky meets the ridges
        // the mid tones would otherwise print as a dark warm rim along the skyline.
        warmth *= mix(1.,smoothstep(.72,.9,tone),haze);
        vec3 cool = ramp(tone,ink,slate,mist,paper,.3,.56,.8);
        vec3 warm = ramp(tone,ink,umber,ochre,sand,.3,.6,.92);
        // Retain a little photographic shading under the two inks.
        vec3 printColor = mix(mix(cool,warm,warmth),photo,.1*(1.-haze));
        gl_FragColor=vec4(mix(photo,printColor,smoothstep(0.,1.,amount)),1.);
        #include <colorspace_fragment>
      }`,
    });
    const geometry = new THREE.PlaneGeometry(2, 2);
    const scene = new THREE.Scene();
    scene.add(new THREE.Mesh(geometry, material));
    const camera = new THREE.Camera();
    return {
        /** Size in device pixels, and device pixels per CSS pixel. */
        resize: (w: number, h: number, ratio: number) => {
            target.setSize(w, h);
            material.uniforms.texel.value.set(1 / w, 1 / h);
            material.uniforms.density.value = ratio;
        },
        render: (world: THREE.Scene, view: THREE.Camera, amount: number, haze = 0) => {
            if (amount < .001) { renderer.render(world, view); return; }
            renderer.setRenderTarget(target);
            renderer.render(world, view);
            renderer.setRenderTarget(null);
            material.uniforms.amount.value = amount;
            material.uniforms.haze.value = haze;
            renderer.render(scene, camera);
        },
        dispose: () => { target.dispose(); geometry.dispose(); material.dispose(); },
    };
}
