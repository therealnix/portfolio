import * as THREE from 'three';
import { circularDelta, getFlightFrame, smoothstep, STATIONS, terrainHeight, wrap } from './path';
import { loadParticleShapes } from '../lib/particle-shapes';
import type { ParticleShape, Point } from '../lib/particle-shapes';

interface FlightOptions {
  host: HTMLDivElement;
  particles: HTMLCanvasElement;
  photograph: HTMLDivElement;
  intro: HTMLDivElement;
  cards: HTMLElement[];
  progress: HTMLDivElement;
  input: { phase: number; reduced: boolean; paused: boolean; hovered: ParticleShape | null };
  onStage: (index: number) => void;
  onReady: () => void;
  onError: () => void;
}

function makeHi() {
  const canvas = document.createElement('canvas');
  canvas.width = 420; canvas.height = 300;
  const context = canvas.getContext('2d')!;
  context.font = 'italic 270px Georgia';
  context.fillStyle = '#fff';
  context.fillText('Hi', 28, 242);
  const pixels = context.getImageData(0, 0, 420, 300).data;
  const points: Point[] = [];
  for (let y = 0; y < 300; y += 3) for (let x = 0; x < 420; x += 3) {
    if (pixels[(y * 420 + x) * 4 + 3] > 140) points.push([(x - 190) / 210, (y - 145) / 210]);
  }
  return points;
}

export function createMountainFlight(options: FlightOptions) {
  const { host, particles: canvas, photograph, intro, cards, input, onError } = options;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0xa19396, 0.0038);
  const camera = new THREE.PerspectiveCamera(51, 1, 0.15, 2200);
  let disposed = false, width = 1, height = 1, frameId = 0, last = 0, time = 0, phase = input.phase, lastStage = -2;
  let pointerX = 0, pointerY = 0, dpr = 1;
  let resting = false;
  const resources: Array<{ dispose: () => void }> = [];
  const retain = <T extends { dispose: () => void }>(value: T): T => { resources.push(value); return value; };

  const skyMaterial = retain(new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    vertexShader: 'varying vec3 vDirection; void main(){vDirection=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: `varying vec3 vDirection;
      void main(){
        vec3 d=normalize(vDirection); float h=d.y;
        vec3 top=vec3(.30,.39,.57), horizon=vec3(.95,.64,.36), below=vec3(.31,.29,.36);
        vec3 color=mix(horizon,top,smoothstep(.0,.52,h));
        color=mix(below,color,smoothstep(-.18,.015,h));
        float sun=pow(max(0.,dot(d,normalize(vec3(-.6,.055,-1.)))),1800.);
        color+=vec3(1.,.64,.24)*sun*.7;
        gl_FragColor=vec4(color,1.);
        #include <colorspace_fragment>
      }`,
  }));
  const sky = new THREE.Mesh(retain(new THREE.SphereGeometry(1600, 32, 16)), skyMaterial);
  scene.add(sky);
  scene.add(new THREE.HemisphereLight(0xa2b8eb, 0x453327, 2.2));
  const sun = new THREE.DirectionalLight(0xffcf93, 3.1);
  sun.position.set(-100, 75, -160); scene.add(sun);
  const fill = new THREE.DirectionalLight(0x899bb7, 0.65);
  fill.position.set(60, 40, 80); scene.add(fill);

  const texture = retain(new THREE.TextureLoader().load('/flight/alpine-rock.webp'));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(48, 70);
  texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  const terrainMaterial = retain(new THREE.MeshStandardMaterial({ map: texture, color: 0x665d58, roughness: 1, metalness: 0 }));
  const terrainGeometry = retain(new THREE.PlaneGeometry(460, 660, 160, 224));
  terrainGeometry.rotateX(-Math.PI / 2);
  terrainGeometry.translate(0, 0, -100);
  const vertices = terrainGeometry.attributes.position;
  for (let i = 0; i < vertices.count; i++) vertices.setY(i, terrainHeight(vertices.getX(i), vertices.getZ(i)));
  terrainGeometry.computeVertexNormals();
  scene.add(new THREE.Mesh(terrainGeometry, terrainMaterial));

  // Distant ridges provide depth without additional textures or shadow maps.
  const distanceGeometry = retain(new THREE.PlaneGeometry(2600, 1900, 110, 90));
  distanceGeometry.rotateX(-Math.PI / 2); distanceGeometry.translate(0, -8, -500);
  const distant = distanceGeometry.attributes.position;
  for (let i = 0; i < distant.count; i++) {
    const x = distant.getX(i), z = distant.getZ(i);
    const falloff = smoothstep(230, 430, Math.max(Math.abs(x), Math.abs(z + 100)));
    const ridge = 30 + Math.abs(Math.sin(x * .008 + z * .003) * Math.cos(z * .009)) * 115;
    distant.setY(i, -10 + ridge * falloff);
  }
  distanceGeometry.computeVertexNormals();
  const distantMaterial = retain(new THREE.MeshStandardMaterial({ color: 0x514b58, roughness: 1, flatShading: true }));
  scene.add(new THREE.Mesh(distanceGeometry, distantMaterial));

  const rockTexture = retain(texture.clone());
  rockTexture.repeat.set(2, 2); rockTexture.needsUpdate = true;
  const rockMaterial = retain(new THREE.MeshStandardMaterial({ map: rockTexture, color: 0x615b55, roughness: 0.96, flatShading: true }));
  const stoneTops: THREE.Vector3[] = [];
  STATIONS.forEach((station, index) => {
    const geometry = retain(new THREE.IcosahedronGeometry(1, 3));
    const points = geometry.attributes.position;
    for (let i = 0; i < points.count; i++) {
      const x = points.getX(i), y = points.getY(i), z = points.getZ(i);
      const warp = 1 + Math.sin(x * 6.7 + index) * Math.cos(y * 5.2 + z * 3.7) * .17;
      points.setXYZ(i, x * warp, y * warp, z * warp);
    }
    geometry.computeVertexNormals();
    const rock = new THREE.Mesh(geometry, rockMaterial);
    const floor = terrainHeight(station.x, station.z);
    rock.position.set(station.x, floor + 2.1, station.z);
    rock.scale.set(5.4 + index % 2, 3.5, 4.5);
    rock.rotation.y = index * 1.7;
    scene.add(rock);
    stoneTops.push(new THREE.Vector3(station.x, floor + 5.6, station.z));
  });

  // One draw call for the entire field of small scree stones.
  const scree = new THREE.InstancedMesh(retain(new THREE.IcosahedronGeometry(1, 0)), rockMaterial, 900);
  const dummy = new THREE.Object3D();
  let seed = 371;
  const random = () => { seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646; };
  for (let i = 0; i < 900; i++) {
    const x = (random() - .5) * 200, z = random() * -420 + 100;
    dummy.position.set(x, terrainHeight(x, z), z);
    dummy.rotation.set(random(), random() * 6, random());
    const scale = .15 + random() * .65;
    dummy.scale.set(scale * 1.5, scale, scale * 1.1); dummy.updateMatrix();
    scree.setMatrixAt(i, dummy.matrix);
  }
  scene.add(scree);

  const hi = makeHi();
  let shapes: Partial<Record<ParticleShape, Point[]>> = {};
  void loadParticleShapes().then(value => { if (!disposed) shapes = value; });
  const dots = Array.from({ length: 2200 }, (_, i) => ({
    seed: random(), angle: random() * Math.PI * 2, radius: random(), phase: random() * 6.28,
    hi: hi[i * 17 % hi.length], x: 0, y: 0,
  }));
  const projected = new THREE.Vector3();
  const look = new THREE.Vector3();
  const trailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 40, 60), new THREE.Vector3(-8, 18, -5),
    ...STATIONS.map(station => new THREE.Vector3(station.x, terrainHeight(station.x, station.z) + 6.5, station.z)),
    new THREE.Vector3(30, 45, -300),
  ]);
  const trail = trailCurve.getPoints(1800);

  const resize = () => {
    resting = false;
    width = host.clientWidth; height = host.clientHeight;
    dpr = Math.min(window.devicePixelRatio || 1, width < 768 ? 1.25 : 1.6);
    renderer.setPixelRatio(dpr); renderer.setSize(width, height, false);
    camera.aspect = width / height; camera.updateProjectionMatrix();
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const observer = new ResizeObserver(resize); observer.observe(host); resize();
  const pointer = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    pointerX = event.clientX / width - .5; pointerY = event.clientY / height - .5;
  };
  window.addEventListener('pointermove', pointer, { passive: true });
  const contextLost = (event: Event) => { event.preventDefault(); cancelAnimationFrame(frameId); onError(); };
  renderer.domElement.addEventListener('webglcontextlost', contextLost);

  const render = (now: number) => {
    if (disposed) return;
    // Keep input responsive without redrawing a frozen scene behind a player or static index.
    if ((input.paused || input.reduced) && resting) {
      last = now;
      if (!document.hidden) frameId = requestAnimationFrame(render);
      return;
    }
    resting = input.paused || input.reduced;
    const dt = Math.min((now - (last || now)) / 1000, .06); last = now;
    const reduced = input.reduced;
    if (!reduced && !input.paused) time += dt;
    if (!input.paused) phase = wrap(phase + circularDelta(phase, input.phase) * (reduced ? 1 : 1 - Math.exp(-dt * 5)));
    const flight = getFlightFrame(phase);
    const hero = reduced ? 1 : flight.photo;
    camera.position.fromArray(flight.position);
    look.fromArray(flight.target);
    if (!reduced) { look.x += pointerX * .7; look.y -= pointerY * .4; }
    camera.up.set(Math.sin(reduced ? 0 : flight.roll), Math.cos(reduced ? 0 : flight.roll), 0);
    camera.lookAt(look); camera.fov = flight.fov; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    sky.position.copy(camera.position);
    if (hero < .999 && !reduced) renderer.render(scene, camera);
    photograph.style.opacity = String(hero);
    const pullback = smoothstep(.025, .16, phase) * (1 - smoothstep(.87, .97, phase));
    photograph.style.transform = reduced ? 'none' : `scale(${1.08 - pullback * .08}) translateY(${-pullback * 3}%)`;
    intro.style.opacity = String(hero);
    intro.style.pointerEvents = hero > .8 ? 'auto' : 'none';
    intro.inert = hero <= .8;
    options.progress.style.setProperty('--flight-progress', String(phase));

    const stage = STATIONS.findIndex(station => Math.abs(phase - station.phase) < .047);
    if (stage !== lastStage) { lastStage = stage; options.onStage(stage); }
    let activeX = width / 2, activeY = height * .4;
    cards.forEach((card, index) => {
      const distance = Math.abs(phase - STATIONS[index].phase);
      const reveal = (1 - smoothstep(.018, .062, distance)) * (1 - hero);
      projected.copy(stoneTops[index]).project(camera);
      const visible = reveal > .005 && projected.z < 1 && projected.z > -1;
      card.style.visibility = visible ? 'visible' : 'hidden';
      card.style.opacity = String(reveal);
      card.style.pointerEvents = visible && reveal > .82 ? 'auto' : 'none';
      card.inert = !visible || reveal < .82;
      if (visible) {
        const x = Math.max(width < 768 ? width / 2 : 215, Math.min(width < 768 ? width / 2 : width - 215, (projected.x * .5 + .5) * width));
        const rockY = (-projected.y * .5 + .5) * height;
        const rise = (1 - reveal) * 170;
        const y = Math.max(height < 600 ? 230 : 280, rockY - 12);
        card.style.left = `${x}px`; card.style.top = `${y + rise}px`;
        card.style.transform = `translate(-50%, -100%)`;
        card.style.clipPath = `inset(0 -30px ${rise}px -30px)`;
        if (index === stage) { activeX = x; activeY = y - 100; }
      }
    });

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = '#fff';
    const count = width < 768 ? 1250 : dots.length;
    const hiScale = Math.min(width * .45, height * .55, 400);
    const hiCenter = width < 768 ? width * .39 : width * .32;
    const outline = input.hovered ? shapes[input.hovered] : undefined;
    let nearest = 0, nearestDistance = Infinity;
    for (let i = 0; i < trail.length; i += 4) {
      const distance = trail[i].distanceToSquared(look);
      if (distance < nearestDistance) { nearest = i; nearestDistance = distance; }
    }
    const trailAnchor = nearest / (trail.length - 1);
    for (let bucket = 0; bucket < 4; bucket++) {
      ctx.beginPath(); ctx.globalAlpha = .4 + bucket * .19;
      for (let i = bucket; i < count; i += 4) {
        const dot = dots[i];
        const hiX = hiCenter + dot.hi[0] * hiScale + Math.sin(time * .8 + dot.phase) * 1.2;
        const hiY = height * .43 + dot.hi[1] * hiScale + Math.cos(time + dot.phase) * 1.2;
        let x = hiX, y = hiY, visible = true;
        if (hero < .999) {
          const cursor = Math.max(0, Math.min(.999, trailAnchor + (wrap(dot.seed + time * .08) - .3) * .16));
          const point = trail[Math.floor(cursor * (trail.length - 1))];
          const spread = .35 + dot.radius * 2.4;
          projected.copy(point);
          projected.x += Math.sin(time * .7 + dot.angle) * spread;
          projected.y += Math.cos(time * .7 + dot.angle) * spread * .5;
          projected.project(camera);
          x = (projected.x * .5 + .5) * width;
          y = (-projected.y * .5 + .5) * height;
          visible = projected.z > -1 && projected.z < 1 && Math.abs(projected.x) < 2 && Math.abs(projected.y) < 2;
          if (outline?.length && stage >= 0 && i % 3 !== 0) {
            const shapePoint = outline[Math.floor(dot.seed * outline.length)];
            const offset = width < 768 ? 0 : -250;
            x = activeX + offset + shapePoint[0] * (width < 768 ? 60 : 80);
            y = activeY - (width < 768 ? 140 : 0) + shapePoint[1] * (width < 768 ? 60 : 80);
            visible = true;
          }
          x = x * (1 - hero) + hiX * hero;
          y = y * (1 - hero) + hiY * hero;
        }
        const ease = reduced || !dot.x ? 1 : 1 - Math.exp(-dt * 8);
        dot.x += (x - dot.x) * ease; dot.y += (y - dot.y) * ease;
        if (visible || hero > .15) {
          const size = .65 + bucket * .3;
          ctx.moveTo(dot.x + size, dot.y); ctx.arc(dot.x, dot.y, size, 0, Math.PI * 2);
        }
      }
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (!document.hidden) frameId = requestAnimationFrame(render);
  };
  const visibility = () => { cancelAnimationFrame(frameId); last = 0; if (!document.hidden && !disposed) frameId = requestAnimationFrame(render); };
  document.addEventListener('visibilitychange', visibility);
  frameId = requestAnimationFrame(render);
  options.onReady();
  return () => {
    disposed = true; cancelAnimationFrame(frameId); observer.disconnect();
    window.removeEventListener('pointermove', pointer);
    document.removeEventListener('visibilitychange', visibility);
    renderer.domElement.removeEventListener('webglcontextlost', contextLost);
    scree.dispose(); resources.forEach(resource => resource.dispose()); renderer.dispose(); renderer.domElement.remove();
  };
}
