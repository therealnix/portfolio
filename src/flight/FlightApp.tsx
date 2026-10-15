import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { ARTICLE_SECTIONS } from './article-content';
import { journeyAt, journeyMetrics, remapJourneyOffset } from './journey';
import type { JourneyMetrics } from './journey';
import { ridgePath, trailHeight, trailPath } from './ridges';
import { CONTACT_SKETCHES, SKETCHES, strokes } from './sketches';
import originalPhoto from '../assets/niklas-mountains.jpeg';
import './flight.css';
const stopNumber = (index: number) => String(index + 1).padStart(2, '0');
// Every section opens with one of the photograph's own ridgelines, drawn in as it arrives.
const SectionMark = ({ index, number }: { index: number; number?: string }) => <div className="section-mark reveal" aria-hidden="true">
    {number && <span>{number}</span>}
    <svg viewBox="0 0 600 26" preserveAspectRatio="none"><path d={ridgePath(index, 600, 26)} pathLength={1}/></svg>
  </div>;
// A line drawing that draws itself stroke by stroke once its parent is marked as in view.
const Sketch = ({ d, className }: { d: string; className: string }) => <svg className={`sketch ${className}`} viewBox="0 0 256 256" aria-hidden="true">
    {strokes(d).map((stroke, n) => <path key={n} d={stroke} pathLength={1} style={{ '--n': n } as CSSProperties}/>)}
  </svg>;
// A small tile of paper tooth, made once and repeated by CSS.
function paperGrain() {
    const tile = document.createElement('canvas');
    tile.width = tile.height = 160;
    const ctx = tile.getContext('2d');
    if (!ctx)
        return '';
    const pixels = ctx.createImageData(160, 160);
    for (let i = 0; i < pixels.data.length; i += 4) {
        const speck = Math.random();
        pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = speck < .5 ? 40 : 255;
        pixels.data[i + 3] = Math.random() * 16;
    }
    ctx.putImageData(pixels, 0, 0);
    return `url(${tile.toDataURL()})`;
}
export default function FlightApp() {
    const root = useRef<HTMLElement>(null), host = useRef<HTMLDivElement>(null), greeting = useRef<HTMLCanvasElement>(null), front = useRef<HTMLCanvasElement>(null);
    const photograph = useRef<HTMLDivElement>(null), vignette = useRef<HTMLDivElement>(null), veil = useRef<HTMLDivElement>(null), intro = useRef<HTMLDivElement>(null), spacer = useRef<HTMLDivElement>(null);
    const article = useRef<HTMLElement>(null), contact = useRef<HTMLDivElement>(null), contactLinks = useRef<HTMLElement>(null), sections = useRef<HTMLElement[]>([]);
    const trailNav = useRef<HTMLElement>(null), trailProfile = useRef<HTMLDivElement>(null), trailWalked = useRef<HTMLDivElement>(null), trailMarker = useRef<HTMLSpanElement>(null), progressBar = useRef<HTMLDivElement>(null);
    const input = useRef({ phase: 0, horizon: 0, reduced: false });
    const engine = useRef<{ wake: () => void }>(null);
    const metrics = useRef<JourneyMetrics>(journeyMetrics(window.innerHeight, 4000));
    const route = useRef<number[]>([]), offsets = useRef<number[]>([]);
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
    useEffect(() => { input.current.reduced = staticMode; engine.current?.wake(); }, [staticMode]);
    useEffect(() => { root.current!.style.setProperty('--grain', paperGrain()); }, []);
    useEffect(() => {
        document.body.classList.add('flight-mode');
        document.documentElement.classList.remove('dark');
        const previous = history.scrollRestoration;
        history.scrollRestoration = 'manual';
        let initialized = false, current = -1, trailWidth = 0, trailHeightPx = 0;
        // Scrolling only writes a style when its value actually changed, and never reads layout.
        const shown: Record<string, string | boolean> = {};
        const put = (key: string, value: string | boolean, apply: (value: never) => void) => { if (shown[key] !== value) {
            shown[key] = value;
            apply(value as never);
        } };
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
            const state = journeyAt(y, m), away = state.contact.toFixed(3);
            put('top', `${Math.floor(y / m.length) * m.length + m.approach + m.viewport}px`, (value: string) => { article.current!.style.top = value; });
            put('reading', state.reading, (value: boolean) => { article.current!.inert = !value; });
            put('trail', state.reveal.toFixed(3), (value: string) => {
                trailNav.current!.style.opacity = progressBar.current!.style.opacity = value;
                trailNav.current!.style.visibility = progressBar.current!.style.visibility = value === '0.000' ? 'hidden' : 'visible';
                trailNav.current!.inert = +value < .8;
            });
            put('route', state.progress.toFixed(4), (value: string) => {
                progressBar.current!.style.transform = `scaleX(${value})`;
                trailWalked.current!.style.clipPath = `inset(-12px ${((1 - +value) * 100).toFixed(2)}% -4px 0)`;
                trailMarker.current!.style.transform = `translate(${(+value * trailWidth).toFixed(1)}px,${(-trailHeight(route.current, +value) * trailHeightPx).toFixed(1)}px)`;
            });
            put('contact', away, (value: string) => { contact.current!.style.opacity = value; contact.current!.style.visibility = +value > .01 ? 'visible' : 'hidden'; });
            put('linked', state.contact >= .8, (value: boolean) => { contactLinks.current!.inert = !value; });
            // The contact drawings are drawn when the stage arrives and reset once it has left.
            if (state.contact > .3)
                put('drawn', true, () => contact.current!.classList.add('is-in'));
            else if (state.contact < .02)
                put('drawn', false, () => contact.current!.classList.remove('is-in'));
            let stop = -1;
            if (state.reading)
                offsets.current.forEach((top, index) => { if (state.readOffset > top + m.viewport * .58)
                    stop = index; });
            if (stop !== current)
                setActive(current = stop);
            input.current.phase = state.phase;
            input.current.horizon = state.horizon;
            engine.current?.wake();
        };
        const resize = () => {
            if (!article.current)
                return;
            if (staticMode) {
                article.current!.style.cssText = '';
                article.current!.inert = false;
                return;
            }
            const before = metrics.current, next = journeyMetrics(window.innerHeight, article.current!.offsetHeight);
            const offset = initialized ? remapJourneyOffset(window.scrollY, before, next) : 0;
            metrics.current = next;
            spacer.current!.style.height = `${next.length * 2 + next.viewport}px`;
            // A section becomes the current stop when its title reaches the reading line.
            offsets.current = sections.current.map(section => section.offsetTop);
            const marks = offsets.current.map(top => Math.min(1, (top + next.viewport * .58) / next.reading));
            if (marks.join() !== route.current.join()) {
                route.current = marks;
                setStops(marks);
            }
            trailWidth = trailProfile.current!.offsetWidth;
            trailHeightPx = trailProfile.current!.offsetHeight;
            delete shown.route;
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
        // Titles rise into place and drawings are drawn once, the first time they are scrolled into view.
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
            const flight = createMountainFlight({ host: host.current!, greeting: greeting.current!, front: front.current!, photograph: photograph.current!, vignette: vignette.current!, intro: intro.current!, input: input.current, onReady: () => setReady(true), onError: () => setFallback(true) });
            engine.current = flight;
            dispose = flight.dispose;
        }).catch(() => { if (!cancelled) {
            setFallback(true);
            setReady(true);
        } });
        return () => { cancelled = true; engine.current = null; dispose?.(); };
    }, []);
    const readArticle = () => {
        const m = metrics.current;
        window.scrollTo({ top: m.length + m.approach + m.viewport * .8, behavior: 'smooth' });
    };
    const visitStop = (index: number) => {
        const m = metrics.current;
        window.scrollTo({ top: Math.floor(window.scrollY / m.length) * m.length + m.approach + offsets.current[index] + m.viewport * .78, behavior: 'smooth' });
    };
    const profile = trailPath(stops, 1000, 100);
    return <main ref={root} className={`mountain-flight ${staticMode ? 'is-static' : ''}`}>
    <div ref={spacer} aria-hidden="true"/>
    <div ref={host} className="flight-world" aria-hidden="true"/>
    <div ref={photograph} className="flight-photograph" aria-hidden="true"><img src="/flight/mountain-upscaled.webp" alt="" fetchPriority="high" onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = originalPhoto; }}/></div>
    <div ref={vignette} className="flight-vignette" aria-hidden="true"/>
    <div ref={veil} className="article-veil" aria-hidden="true"/>
    <canvas ref={greeting} className="flight-greeting" aria-hidden="true"/>
    <canvas ref={front} className="flight-front" aria-hidden="true"/>
    <div ref={contact} className="contact-stage">
      <h2 className="contact-title">Let’s connect.</h2>
      <nav ref={contactLinks} className="contact-links" aria-label="Get in touch" inert>
        <a href="https://www.linkedin.com/in/niklas-kornev-ba268133a/" target="_blank" rel="noopener noreferrer" aria-label="Connect with Niklas on LinkedIn"><Sketch d={CONTACT_SKETCHES.linkedin} className="contact-sketch"/><span>LinkedIn ↗</span></a>
        <a href="mailto:niklas@go-findus.tech" aria-label="Email Niklas at niklas@go-findus.tech"><Sketch d={CONTACT_SKETCHES.email} className="contact-sketch"/><span>Email ↗</span></a>
        <a href="https://substack.com/@s0medude" target="_blank" rel="noopener noreferrer" aria-label="Read Niklas on Substack"><Sketch d={CONTACT_SKETCHES.substack} className="contact-sketch"/><span>Substack ↗</span></a>
      </nav>
    </div>
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
        <Sketch d={SKETCHES[section.shape]} className="section-sketch reveal"/>
        <h3 className="reveal">{section.href ? <a href={section.href} target="_blank" rel="noopener noreferrer">{section.title}</a> : section.title}</h3>
        {section.paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
        {section.tracks?.map(track => <div key={track.id} className="article-player" aria-label={track.label + ' on SoundCloud'}>
          <iframe title={track.label + ' on SoundCloud'} width="100%" height="120" loading="lazy" scrolling="no" frameBorder="0" allow="autoplay; encrypted-media" src={'https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/soundcloud%253Atracks%253A' + track.id + '&color=%234b4e3d&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true'}/>
          <a href={track.href} target="_blank" rel="noopener noreferrer">{track.label} ↗</a>
        </div>)}
      </section>)}
      <footer className="article-ending"><SectionMark index={0}/><p>With that said <a href="mailto:niklas@go-findus.tech">Hit me up</a> if you've want to build, do or yap about something sick.</p><p>I wish you a wonderful day :)</p></footer>
    </article>
    <nav ref={trailNav} className="flight-trail" aria-label="Sections" inert>
      <div ref={trailProfile} className="trail-profile" aria-hidden="true">
        <svg className="trail-ground" viewBox="0 0 1000 100" preserveAspectRatio="none"><path d={profile}/></svg>
        <div ref={trailWalked} className="trail-walked"><svg viewBox="0 0 1000 100" preserveAspectRatio="none"><path d={profile}/></svg></div>
        <span ref={trailMarker} className="trail-marker"/>
      </div>
      {ARTICLE_SECTIONS.map((section, index) => <button key={section.id} type="button" className={index === active ? 'is-current' : index < active ? 'is-passed' : undefined} style={{ left: `${stops[index] * 100}%` }} aria-label={section.title} aria-current={index === active ? 'step' : undefined} onClick={() => visitStop(index)}>{stopNumber(index)}</button>)}
    </nav>
    <div ref={progressBar} className="flight-progress" aria-hidden="true"/>
  </main>;
}
