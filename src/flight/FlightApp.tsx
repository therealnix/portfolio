import { useEffect, useRef, useState } from 'react';
import { STATIONS, wrap } from './path';
import type { Station } from './path';
import type { ParticleShape } from '../lib/particle-shapes';
import originalPhoto from '../assets/niklas-mountains.jpeg';
import './flight.css';

export default function FlightApp() {
  const host = useRef<HTMLDivElement>(null);
  const particles = useRef<HTMLCanvasElement>(null);
  const photograph = useRef<HTMLDivElement>(null);
  const intro = useRef<HTMLDivElement>(null);
  const progress = useRef<HTMLDivElement>(null);
  const spacer = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<HTMLElement[]>([]);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const input = useRef({ phase: 0, reduced: false, paused: false, hovered: null as ParticleShape | null });
  const loopLength = useRef(1);
  const [stage, setStage] = useState(-1);
  const [ready, setReady] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [motionEnabled, setMotionEnabled] = useState(() => !window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [dialog, setDialog] = useState<Station | 'index' | null>(null);

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    document.body.classList.add('flight-mode');
    const previousRestoration = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    const resize = () => {
      loopLength.current = window.innerHeight * 12;
      spacer.current!.style.height = `${loopLength.current * 2 + window.innerHeight}px`;
      window.scrollTo({ top: loopLength.current * (1 + input.current.phase), behavior: 'instant' });
    };
    resize();
    const scroll = () => {
      if (input.current.paused) return;
      const length = loopLength.current;
      const y = window.scrollY;
      input.current.phase = wrap(y / length);
      // Native wheel, keyboard and touch scrolling, rebased at identical loop frames.
      if (y < 2) window.scrollTo({ top: y + length, behavior: 'instant' });
      else if (y > length * 2 - 2) window.scrollTo({ top: y - length, behavior: 'instant' });
    };
    window.addEventListener('scroll', scroll, { passive: true });
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('scroll', scroll);
      window.removeEventListener('resize', resize);
      document.body.classList.remove('flight-mode');
      history.scrollRestoration = previousRestoration;
    };
  }, []);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const change = () => setMotionEnabled(!preference.matches);
    preference.addEventListener('change', change);
    return () => preference.removeEventListener('change', change);
  }, []);
  useEffect(() => { input.current.reduced = !motionEnabled; }, [motionEnabled]);

  useEffect(() => {
    let cancelled = false;
    let dispose: (() => void) | undefined;
    void import('./engine').then(({ createMountainFlight }) => {
      if (cancelled) return;
      dispose = createMountainFlight({
        host: host.current!, particles: particles.current!, photograph: photograph.current!,
        intro: intro.current!, progress: progress.current!, cards: cardRefs.current,
        input: input.current, onStage: setStage, onReady: () => setReady(true), onError: () => setFallback(true),
      });
    }).catch(error => {
      if (cancelled) return;
      console.warn('Mountain flight unavailable; showing the project index.', error);
      setFallback(true); setReady(true);
    });
    return () => { cancelled = true; dispose?.(); };
  }, []);

  useEffect(() => {
    const controls = input.current;
    controls.paused = dialog !== null;
    const node = dialogRef.current;
    if (dialog && node && !node.open) node.showModal();
    if (!dialog && node?.open) node.close();
    const previous = document.body.style.overflow;
    if (dialog) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; controls.paused = false; };
  }, [dialog]);

  const seek = (phase: number) => {
    setDialog(null);
    input.current.paused = false;
    input.current.hovered = null;
    input.current.phase = phase;
    window.scrollTo({ top: loopLength.current * (1 + phase), behavior: 'instant' });
  };
  const staticMode = fallback || !motionEnabled;

  return (
    <main className={`mountain-flight ${staticMode ? 'is-static' : ''}`}>
      <div ref={spacer} aria-hidden="true" />
      <div ref={host} className="flight-world" aria-hidden="true" />
      <div ref={photograph} className="flight-photograph" aria-hidden="true">
        <img src="/flight/mountain-upscaled.webp" alt="" fetchPriority="high" onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = originalPhoto; }} />
      </div>
      <div className="flight-vignette" aria-hidden="true" />
      <canvas ref={particles} className="flight-particles" aria-hidden="true" />

      <header className="flight-header">
        <button className="flight-wordmark" onClick={() => seek(0)} aria-label="Return to the opening view">NIKLAS KORNEV<span>✳</span></button>
        <div className="flight-header-right"><span>A LITTLE FURTHER.</span><button onClick={() => setDialog('index')}>INDEX <span aria-hidden="true">↗</span></button></div>
      </header>

      <div ref={intro} className="flight-intro">
        <h1 className="sr-only">Hi. I'm Niklas Kornev.</h1>
        <button className="flight-begin" onClick={() => staticMode ? setDialog('index') : seek(.2)}>
          <span>{!ready ? 'PREPARING THE DESCENT' : staticMode ? 'EXPLORE THE PROJECTS' : 'SCROLL TO DESCEND'}</span>
          <span aria-hidden="true">↓</span>
        </button>
      </div>

      <div className="flight-stations">
        {STATIONS.map((station, index) => (
          <article key={station.id} ref={node => { if (node) cardRefs.current[index] = node; }} className="flight-station" aria-label={station.title}
            onPointerEnter={() => { input.current.hovered = station.shape; }}
            onPointerLeave={() => { input.current.hovered = null; }}
            onFocusCapture={() => { input.current.hovered = station.shape; }}
            onBlurCapture={() => { input.current.hovered = null; }}>
            <div className="station-kicker"><span>0{index + 1}</span><i />{station.category}</div>
            <h2>{station.title}</h2>
            <p>{station.description}</p>
            {'track' in station || 'details' in station ? (
              <button className="station-link" onClick={() => setDialog(station)}>{'track' in station ? 'Listen to the track' : 'A few favourites'} <span aria-hidden="true">↗</span></button>
            ) : <a className="station-link" href={station.href} target="_blank" rel="noopener noreferrer">Explore the project <span aria-hidden="true">↗</span></a>}
          </article>
        ))}
      </div>

      {staticMode && <section className="flight-static-index" aria-label="Projects">
        <span className="station-kicker">TAKE THE SCENIC ROUTE</span><h2>A few things I make.</h2>
        {STATIONS.map((station, index) => <button key={station.id} onClick={() => setDialog(station)}><small>0{index + 1}</small>{station.title}<span>↗</span></button>)}
      </section>}

      <footer className="flight-footer">
        <a href="mailto:niklas@go-findus.tech" className="flight-contact">SAY HELLO <span aria-hidden="true">↗</span></a>
        <div ref={progress} className="flight-route" aria-label="Journey navigation">
          <div className="route-line"><i /></div>
          {STATIONS.map((station, index) => <button key={station.id} className={stage === index ? 'is-current' : ''} aria-label={`Go to ${station.title}`} aria-current={stage === index ? 'step' : undefined} onClick={() => staticMode ? setDialog(station) : seek(station.phase)}><span /><small>0{index + 1}</small></button>)}
        </div>
        <button className="motion-toggle" onClick={() => setMotionEnabled(value => !value)} aria-pressed={motionEnabled}>MOTION {motionEnabled ? 'ON' : 'OFF'}<i /></button>
      </footer>
      <div className="flight-chapter" aria-live="polite">{stage >= 0 ? `0${stage + 1} / ${STATIONS[stage].title}` : 'THE LONG WAY HOME'}</div>

      <dialog ref={dialogRef} className="flight-dialog" onClose={() => setDialog(null)} onClick={event => { if (event.target === event.currentTarget) setDialog(null); }} aria-labelledby="flight-dialog-title">
        <button className="dialog-close" aria-label="Close" onClick={() => setDialog(null)}>✕</button>
        {dialog === 'index' ? <>
          <span className="station-kicker">SIX STOPS. ONE WAY BACK.</span><h2 id="flight-dialog-title">Pick a trail.</h2>
          <nav className="flight-index-links">{STATIONS.map((station, index) => <button key={station.id} onClick={() => staticMode ? setDialog(station) : seek(station.phase)}><small>0{index + 1}</small><span>{station.title}</span><span>↗</span></button>)}</nav>
          <a className="classic-link" href="?view=galaxy">View the galaxy version ↗</a>
        </> : dialog && <>
          <span className="station-kicker">{dialog.category}</span><h2 id="flight-dialog-title">{dialog.title}</h2>
          <p>{'details' in dialog ? dialog.details : dialog.description}</p>
          {'track' in dialog && <iframe title={`${dialog.title} on SoundCloud`} width="100%" height="166" scrolling="no" frameBorder="0" allow="autoplay; encrypted-media" src={`https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/soundcloud%253Atracks%253A${dialog.track}&color=%234b4e3d&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`} />}
          {dialog.href && <a className="station-link" href={dialog.href} target="_blank" rel="noopener noreferrer">{'track' in dialog ? 'Open SoundCloud' : 'Visit the website'} ↗</a>}
        </>}
      </dialog>
    </main>
  );
}
