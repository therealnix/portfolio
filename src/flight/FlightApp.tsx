import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { ARTICLE_SECTIONS } from './article-content';
import { journeyAt, journeyMetrics, remapJourneyOffset } from './journey';
import type { JourneyMetrics } from './journey';
import { ridgePath, trailHeight, trailPath } from './ridges';
import { CONTACT_OUTLINES } from '../lib/particle-shapes';
import originalPhoto from '../assets/niklas-mountains.jpeg';
import './flight.css';
const stopNumber = (index: number) => String(index + 1).padStart(2, '0');
// Every section opens with one of the photograph's own ridgelines, drawn in as it arrives.
const SectionMark = ({ index, number }: { index: number; number?: string }) => <div className="section-mark reveal" aria-hidden="true">
    {number && <span>{number}</span>}
    <svg viewBox="0 0 600 26" preserveAspectRatio="none"><path d={ridgePath(index, 600, 26)} pathLength={1}/></svg>
  </div>;
export default function FlightApp() {
    const root = useRef<HTMLElement>(null), host = useRef<HTMLDivElement>(null), particles = useRef<HTMLCanvasElement>(null);
    const photograph = useRef<HTMLDivElement>(null), intro = useRef<HTMLDivElement>(null), spacer = useRef<HTMLDivElement>(null);
    const article = useRef<HTMLElement>(null), contactTitle = useRef<HTMLHeadingElement>(null), contactLinks = useRef<HTMLElement>(null), trailNav = useRef<HTMLElement>(null), sections = useRef<HTMLElement[]>([]);
    const input = useRef({ phase: 0, drift: 0, reading: false, holding: false, reduced: false, active: -1, reveal: 0, contact: 0, contactHover: -1, contactFocus: -1, figureX: 0, figureY: 0, figureRadius: 80, clearX: 0 });
    const metrics = useRef<JourneyMetrics>(journeyMetrics(window.innerHeight, 4000));
    const route = useRef<number[]>([]);
    const [ready, setReady] = useState(false), [fallback, setFallback] = useState(false);
    const [reduced, setReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const [stops, setStops] = useState<number[]>(() => ARTICLE_SECTIONS.map((_, index) => (index + 1) / (ARTICLE_SECTIONS.length + 1)));
    const [active, setActive] = useState(-1);
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
            input.current.drift = state.drift;
            input.current.reading = state.reading;
            input.current.holding = state.holding;
            input.current.reveal = state.reveal;
            input.current.contact = state.contact;
            root.current!.style.setProperty('--reading', String(state.reveal));
            root.current!.style.setProperty('--contact', String(state.contact));
            root.current!.style.setProperty('--route', String(state.progress));
            root.current!.style.setProperty('--route-height', String(trailHeight(route.current, state.progress)));
            trailNav.current!.inert = state.reveal < .8;
            contactLinks.current!.inert = state.contact < .8;
            if (state.contact < .8) {
                input.current.contactHover = -1;
                input.current.contactFocus = -1;
            }
            contactLinks.current!.style.visibility = contactTitle.current!.style.visibility = state.contact > .01 ? 'visible' : 'hidden';
            root.current!.style.setProperty('--article-opacity', String(state.textOpacity));
            // The shade behind the text stays for as long as there is text to read.
            root.current!.style.setProperty('--veil', String(state.textOpacity));
            root.current!.style.setProperty('--article-offset', `${-24 * (1 - state.entrance)}px`);
            let current = -1;
            if (state.reading)
                sections.current.forEach((section, index) => { if (section.getBoundingClientRect().top < window.innerHeight * .55)
                    current = index; });
            if (current !== input.current.active)
                setActive(current);
            input.current.active = current;
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
            const right = article.current!.offsetLeft + article.current!.offsetWidth, available = window.innerWidth - right;
            input.current.clearX = right;
            input.current.figureX = right + available * .5;
            input.current.figureY = window.innerHeight * .54;
            input.current.figureRadius = Math.min(190, available * .36, window.innerHeight * .24);
            root.current!.style.setProperty('--clear-x', `${right}px`);
            root.current!.style.setProperty('--stage-x', `${input.current.figureX}px`);
            root.current!.style.setProperty('--trail-width', `${Math.max(0, Math.min(620, available - 110))}px`);
            // A section becomes the current stop when its title reaches the reading line.
            const marks = sections.current.map(section => Math.min(1, (section.offsetTop + next.viewport * .45) / next.reading));
            if (marks.join() !== route.current.join()) {
                route.current = marks;
                setStops(marks);
            }
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
        if (staticMode)
            return;
        // Paragraphs rise into place once, the first time they are scrolled into view.
        const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            observer.unobserve(entry.target);
        } }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
        article.current!.querySelectorAll('.reveal').forEach(node => observer.observe(node));
        return () => observer.disconnect();
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
    const visitStop = (index: number) => {
        const m = metrics.current;
        window.scrollTo({ top: Math.floor(window.scrollY / m.length) * m.length + m.approach + sections.current[index].offsetTop + m.viewport * .78, behavior: 'smooth' });
    };
    const contactInteraction = (index: number) => ({
        onPointerEnter: () => { input.current.contactHover = index; },
        onPointerLeave: () => { input.current.contactHover = -1; },
        onFocus: () => { input.current.contactFocus = index; },
        onBlur: () => { input.current.contactFocus = -1; },
    });
    const contactIcon = (shape: keyof typeof CONTACT_OUTLINES) => <svg viewBox="0 0 256 256" aria-hidden="true"><path d={CONTACT_OUTLINES[shape]}/></svg>;
    const profile = trailPath(stops, 1000, 100);
    return <main ref={root} className={`mountain-flight ${staticMode ? 'is-static' : ''}`}>
    <div ref={spacer} aria-hidden="true"/>
    <div ref={host} className="flight-world" aria-hidden="true"/>
    <div ref={photograph} className="flight-photograph" aria-hidden="true"><img src="/flight/mountain-upscaled.webp" alt="" fetchPriority="high" onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = originalPhoto; }}/></div>
    <div className="flight-vignette" aria-hidden="true"/>
    <div className="article-veil" aria-hidden="true"/>
    <canvas ref={particles} className="flight-particles" aria-hidden="true"/>
    <h2 ref={contactTitle} className="contact-title">Let’s connect.</h2>
    <nav ref={contactLinks} className="contact-links" aria-label="Get in touch" inert>
      <a {...contactInteraction(0)} href="https://www.linkedin.com/in/niklas-kornev-ba268133a/" target="_blank" rel="noopener noreferrer" aria-label="Connect with Niklas on LinkedIn">{contactIcon('linkedin')}<span>LinkedIn ↗</span></a>
      <a {...contactInteraction(1)} href="mailto:niklas@go-findus.tech" aria-label="Email Niklas at niklas@go-findus.tech">{contactIcon('email')}<span>Email ↗</span></a>
      <a {...contactInteraction(2)} href="https://soundcloud.com/jigglniggl" target="_blank" rel="noopener noreferrer" aria-label="Listen to S0N!K on SoundCloud">{contactIcon('soundcloud')}<span>SoundCloud ↗</span></a>
    </nav>
    <nav ref={trailNav} className="flight-trail" aria-label="Sections" inert>
      <p className="trail-name" aria-hidden="true">{active >= 0 && <><span>{stopNumber(active)}</span>{ARTICLE_SECTIONS[active].title}</>}</p>
      <svg className="trail-ground" viewBox="0 0 1000 100" preserveAspectRatio="none" aria-hidden="true"><path d={profile}/></svg>
      <div className="trail-walked" aria-hidden="true">
        <svg viewBox="0 0 1000 100" preserveAspectRatio="none">
          <defs><linearGradient id="trail-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f4b953" stopOpacity=".34"/><stop offset="1" stopColor="#f4b953" stopOpacity="0"/></linearGradient></defs>
          <path className="trail-area" d={trailPath(stops, 1000, 100, true)}/>
          <path d={profile}/>
        </svg>
      </div>
      <span className="trail-marker" aria-hidden="true"/>
      {ARTICLE_SECTIONS.map((section, index) => <button key={section.id} type="button" className={index === active ? 'is-current' : index < active ? 'is-passed' : undefined} style={{ left: `${stops[index] * 100}%`, '--summit': trailHeight(stops, stops[index]) } as CSSProperties} aria-label={section.title} aria-current={index === active ? 'step' : undefined} onClick={() => visitStop(index)}><i/>{stopNumber(index)}</button>)}
    </nav>
    <div className="flight-progress" aria-hidden="true"/>
    <div ref={intro} className="flight-intro">
      <h1 className="sr-only">Hi! I'm Niklas Kornev.</h1>
      <button className="flight-begin" onClick={readArticle}><span>{ready ? 'get to kow me' : 'PREPARING THE VIEW'}</span><span aria-hidden="true">↓</span></button>
    </div>
    <article ref={article} className="portfolio-article" aria-labelledby="article-title">
      <header className="article-heading">
        <p className="article-byline">I provide you with.</p>
        <h2 id="article-title">Hi!<br />I'm Nik.</h2>
        <p className="article-deck">I'm a 20 year old dual datascience student from Munich with the ambition to build cool shit. With that said here are some of my recent projects.</p>
      </header>
      {ARTICLE_SECTIONS.map((section, index) => <section key={section.id} id={section.id} ref={node => { if (node)
            sections.current[index] = node; }} className="article-section" data-shape={section.shape}>
        <SectionMark index={index} number={stopNumber(index)}/>
        <h3 className="reveal">{section.href ? <a href={section.href} target="_blank" rel="noopener noreferrer">{section.title}</a> : section.title}</h3>
        {section.paragraphs.map((paragraph, i) => <p key={i} className={section.id === 'things' ? 'article-things reveal' : 'reveal'}>{section.id === 'music' ? <>{paragraph.split('SoundCloud')[0]}<a href="https://soundcloud.com/jigglniggl" target="_blank" rel="noopener noreferrer">SoundCloud</a>{paragraph.split('SoundCloud')[1]}</>
            : section.id === 'things' ? paragraph.split(', ').map((thing, n, things) => <span key={n} style={{ '--i': n } as CSSProperties}>{thing}{n < things.length - 1 ? ', ' : ''}</span>)
                : paragraph}</p>)}
        {section.tracks?.map(track => <div key={track.id} className="article-player" aria-label={track.label + ' on SoundCloud'}>
          <iframe title={track.label + ' on SoundCloud'} width="100%" height="120" loading="lazy" scrolling="no" frameBorder="0" allow="autoplay; encrypted-media" src={'https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/soundcloud%253Atracks%253A' + track.id + '&color=%234b4e3d&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true'}/>
          <a href={track.href} target="_blank" rel="noopener noreferrer">{track.label} ↗</a>
        </div>)}
      </section>)}
      <footer className="article-ending"><SectionMark index={0}/><p className="reveal">With that said <a href="mailto:niklas@go-findus.tech">Hit me up</a> if you've want to build, do or yap about something sick.</p><p className="reveal">I wish you a wonderful day :)</p></footer>
    </article>
    <div className="article-fade" aria-hidden="true"/>
  </main>;
}
