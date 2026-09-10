import { useEffect, useRef } from 'react';
import type { MotionValue } from 'framer-motion';
import { loadParticleShapes } from '../lib/particle-shapes';
import type { ParticleShape, Point } from '../lib/particle-shapes';

interface Props {
  progress: MotionValue<number>;
  shape: ParticleShape | null;
  dark: boolean;
  reducedMotion: boolean;
}

const TAU = Math.PI * 2;
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number) => Math.max(0, Math.min(1, v));
const hues: Record<ParticleShape, number> = { findus: 160, shop: 28, music: 270, headphones: 270, spark: 320, modono: 215, linkedin: 210, email: 42, soundcloud: 18 };

export default function ParticleGalaxy({ progress, shape, dark, reducedMotion }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const state = useRef({ shape, dark, reducedMotion });
  useEffect(() => { state.current = { shape, dark, reducedMotion }; }, [shape, dark, reducedMotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    let alive = true;
    let shapes: Partial<Record<ParticleShape, Point[]>> = {};
    void loadParticleShapes().then(value => { if (alive) shapes = value; });
    let seed = 137;
    const random = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const particles = Array.from({ length: 4200 }, (_, i) => {
      const r = 0.48 + Math.pow(random(), 0.8) * 0.72;
      const angle = (i % 3) * TAU / 3 + r * 4.5 + (random() - 0.5) * 0.55;
      return {
        r, angle, phase: random() * TAU, spread: random(), speed: 0.07 + random() * 0.06,
        x: Math.cos(angle) * r, y: Math.sin(angle) * r * 0.64,
        z: (random() - 0.5) * 0.18, noise: random() - 0.5,
      };
    });
    const stars = Array.from({ length: 190 }, () => ({ x: random(), y: random(), size: 0.4 + random() * 0.8, phase: random() * TAU }));
    let width = 0, height = 0, dpr = 1;
    let frame = 0, last = 0, time = 0, hue = 235, morph = 0;
    let pointerX = 0, pointerY = 0, smoothX = 0, smoothY = 0;
    const resize = () => {
      width = canvas.clientWidth; height = canvas.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      pointerX = (e.clientX / width - 0.5) * 2;
      pointerY = (e.clientY / height - 0.5) * 2;
    };
    const leave = () => { pointerX = pointerY = 0; };
    window.addEventListener('pointermove', move, { passive: true });
    document.documentElement.addEventListener('pointerleave', leave);

    const draw = (now: number) => {
      const dt = Math.min((now - (last || now)) / 1000, 0.05);
      last = now;
      const { shape: currentShape, dark: isDark, reducedMotion: reduced } = state.current;
      if (!reduced) time += dt;
      const mobile = width < 768;
      const reveal = clamp((progress.get() - 0.12) / 0.55);
      const target = currentShape && reveal > 0.7 ? shapes[currentShape] : undefined;
      const forming = !!target?.length;
      const ease = reduced ? 1 : 1 - Math.exp(-dt * 4.3);
      morph = mix(morph, forming ? 1 : 0, ease);
      const targetHue = forming ? hues[currentShape!] : 235;
      hue += (((targetHue - hue + 540) % 360) - 180) * ease;
      smoothX = mix(smoothX, reduced ? 0 : pointerX, ease);
      smoothY = mix(smoothY, reduced ? 0 : pointerY, ease);
      ctx.clearRect(0, 0, width, height);

      // Sparse ambient dust on the introduction; the full cloud gathers on scroll.
      ctx.fillStyle = isDark ? '#b7c3e0' : '#687087';
      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        if (reveal < 0.05 && i > 42) continue;
        const x = ((star.x + Math.sin(time * 0.025 + star.phase) * 0.025 + 1) % 1) * width;
        const y = ((star.y - time * 0.004 * star.size + 10) % 1) * height;
        ctx.globalAlpha = (0.12 + reveal * 0.25) * (0.6 + Math.sin(time * 0.5 + star.phase) * 0.3);
        ctx.beginPath(); ctx.arc(x, y, star.size, 0, TAU); ctx.fill();
      }

      if (reveal > 0.001) {
        const radius = mobile ? Math.min(width * 0.44, height * 0.23, 190) : Math.min(width * 0.235, height * 0.37, 295);
        const centerX = width / 2 + smoothX * 9;
        const centerY = mobile ? height * 0.29 : height / 2 - 15 + smoothY * 7;
        const spin = time * 0.11;
        const tilt = 0.67 + Math.sin(time * 0.12) * 0.07;
        const count = mobile ? 2400 : particles.length;

        // Batch circles by color/opacity, keeping thousands of dots inexpensive.
        for (let bucket = 0; bucket < 8; bucket++) {
          ctx.beginPath();
          const lightness = isDark ? 65 + bucket * 3 : 27 + bucket * 4;
          ctx.fillStyle = `hsl(${hue + bucket * 4} ${forming ? 52 : 24}% ${lightness}%)`;
          ctx.globalAlpha = reveal * (0.26 + bucket * 0.075);
          for (let i = bucket; i < count; i += 8) {
            const p = particles[i];
            // Bounded differential motion keeps the arms open even after hours.
            // Unbounded per-radius angular speeds would eventually collapse them.
            const angle = (i % 7 === 0 ? p.phase : p.angle) + spin + Math.sin(time * 0.18 + p.r * 4) * 0.08;
            const r = p.r + Math.sin(time * 0.4 + p.phase) * 0.016;
            let x = Math.cos(angle) * r;
            let y = Math.sin(angle) * r * tilt;
            let z = Math.sin(angle) * r * 0.32 + p.noise * 0.09;
            // Let some particles escape the arms in looping outward streams.
            if (i % 9 === 0) {
              const flow = (p.spread + time * p.speed * 0.18) % 1;
              x *= 1 + flow * 0.65; y *= 1 + flow * 0.65;
            }
            const isOutline = i % 5 !== 0;
            if (forming && isOutline) {
              const point = target[Math.floor(p.spread * target.length)];
              const breathe = Math.sin(time * 0.8) * 0.008;
              x = point[0] * (0.56 + breathe) + Math.sin(p.phase + time) * 0.005;
              y = point[1] * (0.56 + breathe) + Math.cos(p.phase + time) * 0.005;
              z = Math.sin(p.phase + time * 0.4) * 0.035;
              // Gentle 3D rocking keeps silhouettes readable, including the mascot.
              x += z * Math.sin(time * 0.35) + smoothX * 0.035;
            } else if (forming) {
              x *= 1.06; y *= 1.06;
            }
            const follow = reduced ? 1 : 1 - Math.exp(-dt * (3.5 + p.spread * 2));
            p.x = mix(p.x, x, follow); p.y = mix(p.y, y, follow); p.z = mix(p.z, z, follow);
            const perspective = 1 / (1 + p.z * 0.3);
            const px = centerX + p.x * radius * perspective;
            const py = centerY + p.y * radius * perspective;
            const size = (0.45 + (bucket / 7) * 0.65) * perspective * (1 + morph * 0.1);
            ctx.moveTo(px + size, py); ctx.arc(px, py, size, 0, TAU);
          }
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
      if (!document.hidden) frame = requestAnimationFrame(draw);
    };
    const visibility = () => {
      cancelAnimationFrame(frame);
      last = 0;
      if (!document.hidden) frame = requestAnimationFrame(draw);
    };
    document.addEventListener('visibilitychange', visibility);
    frame = requestAnimationFrame(draw);
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('pointerleave', leave);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [progress]);

  return <canvas ref={canvasRef} className="particle-canvas" aria-hidden="true" />;
}
