import * as THREE from 'three';
/** Screen-space ink follows the actual rendered photo, including camera and cutout motion. */
export function createSketchPass(renderer: THREE.WebGLRenderer) {
    const target = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: true });
    const material = new THREE.ShaderMaterial({
        uniforms: { image: { value: target.texture }, amount: { value: 0 }, pixel: { value: new THREE.Vector2(1, 1) } },
        depthTest: false, depthWrite: false,
        vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
        fragmentShader: `
      uniform sampler2D image; uniform float amount; uniform vec2 pixel; varying vec2 vUv;
      float lum(vec2 p){return pow(max(.0001,dot(texture2D(image,p).rgb,vec3(.299,.587,.114))),.55);}
      void main(){
        vec3 color=texture2D(image,vUv).rgb;
        float rawGray=dot(color,vec3(.299,.587,.114));
        float gray=pow(max(.0001,rawGray),.55);
        vec2 d=pixel*1.05;
        float a=lum(vUv+vec2(-d.x,d.y)),b=lum(vUv+vec2(0.,d.y)),c=lum(vUv+d);
        float e=lum(vUv-vec2(d.x,0.)),f=lum(vUv+vec2(d.x,0.));
        float g=lum(vUv-d),h=lum(vUv-vec2(0.,d.y)),i=lum(vUv+vec2(d.x,-d.y));
        float edge=length(vec2(c+2.*f+i-a-2.*e-g,a+2.*b+c-g-2.*h-i));
        float ink=smoothstep(.008,.105,edge);
        float broad=abs(lum(vUv+pixel*3.)+lum(vUv-pixel*3.)-2.*gray);
        float detail=smoothstep(.006,.065,broad);
        float grain=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5;
        float hatch=pow(abs(sin((gl_FragCoord.x+gl_FragCoord.y*.7)*.56)),18.)*(1.-gray)*.017;
        float cel=mix(gray,floor(gray*8.+.5)/8.,.48);
        float tone=(.12+cel*.61)*(1.-ink*.54-detail*.18)-hatch+grain*.005;
        vec3 illustrated=vec3(tone*.98,tone,tone*1.025);
        vec3 monochrome=mix(color,vec3(rawGray),smoothstep(0.,.6,amount)*.8);
        gl_FragColor=vec4(mix(monochrome,illustrated,smoothstep(.1,1.,amount)),1.);
        #include <colorspace_fragment>
      }`,
    });
    const geometry = new THREE.PlaneGeometry(2, 2);
    const scene = new THREE.Scene();
    scene.add(new THREE.Mesh(geometry, material));
    const camera = new THREE.Camera();
    return {
        resize: (w: number, h: number) => { target.setSize(w, h); material.uniforms.pixel.value.set(1 / w, 1 / h); },
        render: (world: THREE.Scene, view: THREE.Camera, amount: number, captureColor?: (source: HTMLCanvasElement) => void) => {
            if (amount < .001) {
                renderer.render(world, view);
                return;
            }
            renderer.setRenderTarget(target);
            renderer.render(world, view);
            renderer.setRenderTarget(null);
            // Reuse the already rendered color texture for the particle palette.
            if (captureColor) {
                material.uniforms.amount.value = 0;
                renderer.render(scene, camera);
                captureColor(renderer.domElement);
            }
            material.uniforms.amount.value = amount;
            renderer.render(scene, camera);
        },
        dispose: () => { target.dispose(); geometry.dispose(); material.dispose(); },
    };
}
