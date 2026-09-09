import { useEffect, useRef, useState } from 'react';
import { ARTICLE_SECTIONS } from './article-content';
import { journeyAt, journeyMetrics, remapJourneyOffset } from './journey';
import type { JourneyMetrics } from './journey';
import originalPhoto from '../assets/niklas-mountains.jpeg';
import './flight.css';
export default function FlightApp() {
    const root = useRef<HTMLElement>(null), host = useRef<HTMLDivElement>(null), particles = useRef<HTMLCanvasElement>(null);
    const photograph = useRef<HTMLDivElement>(null), intro = useRef<HTMLDivElement>(null), spacer = useRef<HTMLDivElement>(null);
    const article = useRef<HTMLElement>(null), sections = useRef<HTMLElement[]>([]);
    const input = useRef({ phase: 0, reading: false, holding: false, reduced: false, active: -1, reveal: 0, figureX: 0, figureY: 0, figureRadius: 80 });
    const metrics = useRef<JourneyMetrics>(journeyMetrics(window.innerHeight, 4000));
    const [ready, setReady] = useState(false), [fallback, setFallback] = useState(false);
    const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const staticMode = reduced || fallback;
    useEffect(() => {
        const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
        const update = () => setReduced(preference.matches);
        preference.addEventListener('change', update);
        return () => preference.removeEventListener('change', update);
    }, []);
    useEffect(() => { input.current.reduced = staticMode; }, [staticMode]);
    useEffect(() => {
        document.body.classList.add('flight-mode');
        document.documentElement.classList.remove('dark');
        const previous = history.scrollRestoration;
        history.scrollRestoration = 'manual';
        let initialized = false, cycle = 1;
        const update = () => {
            if (staticMode)
                return;
            const m = metrics.current;
            let y = window.scrollY;
            if (y < 2) {
                y += m.length;
                window.scrollTo({ top: y, behavior: 'instant' });
            }
            else if (y > m.length * 2 - 2) {
                y -= m.length;
                window.scrollTo({ top: y, behavior: 'instant' });
            }
            cycle = Math.floor(y / m.length);
            const state = journeyAt(y, m);
            article.current!.style.top = `${cycle * m.length + m.approach + m.viewport}px`;
            article.current!.style.visibility = state.reading ? 'visible' : 'hidden';
            article.current!.inert = !state.reading;
            input.current.phase = state.phase;
            input.current.reading = state.reading;
            input.current.holding = state.holding;
            input.current.reveal = state.reveal;
            root.current!.style.setProperty('--reading', String(state.reveal));
            root.current!.style.setProperty('--article-opacity', String(state.textOpacity));
            root.current!.style.setProperty('--article-offset', `${-24 * (1 - state.entrance)}px`);
            let active = -1;
            if (state.reading)
                sections.current.forEach((section, index) => { if (section.getBoundingClientRect().top < window.innerHeight * .55)
                    active = index; });
            input.current.active = active;
        };
        const resize = () => {
            if (staticMode) {
                article.current!.style.top = '';
                article.current!.style.visibility = 'visible';
                article.current!.inert = false;
                return;
            }
            const before = metrics.current, next = journeyMetrics(window.innerHeight, article.current!.offsetHeight);
            const offset = initialized ? remapJourneyOffset(window.scrollY, before, next) : 0;
            metrics.current = next;
            spacer.current!.style.height = `${next.length * 2 + next.viewport}px`;
            article.current!.style.top = `${next.length + next.approach + next.viewport}px`;
            const box = article.current!.getBoundingClientRect(), available = window.innerWidth - box.right;
            input.current.figureX = box.right + available * .52;
            input.current.figureY = window.innerHeight * .46;
            input.current.figureRadius = Math.min(115, available * .35, window.innerHeight * .17);
            initialized = true;
            window.scrollTo({ top: next.length + offset, behavior: 'instant' });
            update();
        };
        resize();
        if (staticMode)
            window.scrollTo({ top: 0, behavior: 'instant' });
        const observer = new ResizeObserver(resize);
        observer.observe(article.current!);
        window.addEventListener('resize', resize);
        window.addEventListener('scroll', update, { passive: true });
        return () => { observer.disconnect(); window.removeEventListener('resize', resize); window.removeEventListener('scroll', update); document.body.classList.remove('flight-mode'); history.scrollRestoration = previous; };
    }, [staticMode]);
    useEffect(() => {
        let cancelled = false, dispose: (() => void) | undefined;
        void import('./engine').then(({ createMountainFlight }) => {
            if (cancelled)
                return;
            dispose = createMountainFlight({ root: root.current!, host: host.current!, particles: particles.current!, photograph: photograph.current!, intro: intro.current!, input: input.current, onReady: () => setReady(true), onError: () => setFallback(true) });
        }).catch(() => { if (!cancelled) {
            setFallback(true);
            setReady(true);
        } });
        return () => { cancelled = true; dispose?.(); };
    }, []);
    const readArticle = () => {
        const m = metrics.current;
        window.scrollTo({ top: m.length + m.approach + m.viewport * .8, behavior: 'smooth' });
    };
    return <main ref={root} className={`mountain-flight ${staticMode ? 'is-static' : ''}`}>
    <div ref={spacer} aria-hidden="true"/>
    <div ref={host} className="flight-world" aria-hidden="true"/>
    <div ref={photograph} className="flight-photograph" aria-hidden="true"><img src="/flight/mountain-upscaled.webp" alt="" fetchPriority="high" onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = originalPhoto; }}/></div>
    <div className="flight-vignette" aria-hidden="true"/>
    <div className="article-veil" aria-hidden="true"/>
    <canvas ref={particles} className="flight-particles" aria-hidden="true"/>
    <div ref={intro} className="flight-intro">
      <h1 className="sr-only">Hi! I'm Niklas Kornev.</h1>
      <button className="flight-begin" onClick={readArticle}><span>{ready ? 'get to kow me' : 'PREPARING THE VIEW'}</span><span aria-hidden="true">↓</span></button>
    </div>
    <article ref={article} className="portfolio-article" aria-labelledby="article-title">
      <header className="article-heading">
        <p className="article-byline">Niklas Kornev</p>
        <h2 id="article-title">A few things<br />I’ve been making.</h2>
        <p className="article-deck">On building things for the web, making music, and staying curious along the way.</p>
      </header>
      <p>I’m Niklas. This is a small introduction to the things I spend my time on: the projects I’m building, the work I do with other people, and the ideas I follow outside of it. Think of it as a little more context to go with my CV.</p>
      <p>I like work that lets me move between the practical and the creative. Sometimes that means getting the details of a webshop right. Sometimes it means experimenting with an interaction or following a sound until it becomes a track.</p>
      {ARTICLE_SECTIONS.map((section, index) => <section key={section.id} id={section.id} ref={node => { if (node)
            sections.current[index] = node; }} className="article-section" data-shape={section.shape}>
        <h3>{section.title}</h3>
        {section.tracks?.[0] && <aside className="article-player" aria-label={`${section.tracks[0].label} on SoundCloud`}>
          <iframe title={`${section.tracks[0].label} on SoundCloud`} width="100%" height="120" loading="lazy" scrolling="no" frameBorder="0" allow="autoplay; encrypted-media" src={`https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/soundcloud%253Atracks%253A${section.tracks[0].id}&color=%234b4e3d&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`}/>
          <a href={section.tracks[0].href} target="_blank" rel="noopener noreferrer">{section.tracks[0].label} ↗</a>
        </aside>}
        {section.paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
        {section.tracks?.[1] && <aside className="article-player article-player--end" aria-label={`${section.tracks[1].label} on SoundCloud`}>
          <iframe title={`${section.tracks[1].label} on SoundCloud`} width="100%" height="120" loading="lazy" scrolling="no" frameBorder="0" allow="autoplay; encrypted-media" src={`https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/soundcloud%253Atracks%253A${section.tracks[1].id}&color=%234b4e3d&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`}/>
          <a href={section.tracks[1].href} target="_blank" rel="noopener noreferrer">{section.tracks[1].label} ↗</a>
        </aside>}
        {section.href && <a className="article-link" href={section.href} target="_blank" rel="noopener noreferrer">{section.linkLabel}<span aria-hidden="true">↗</span></a>}
      </section>)}
      <footer className="article-ending"><h3>There’s more to come.</h3><p>I’ll keep adding to this collection as the work develops. If something here resonates, or you’d like to talk about building something together, I’d be happy to hear from you.</p><a className="article-link" href="mailto:niklas@go-findus.tech">Say hello<span aria-hidden="true">↗</span></a><p className="article-last-line">For now, back to the mountains.</p></footer>
    </article>
  </main>;
}
