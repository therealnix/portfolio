import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { motion, useScroll, useTransform, useSpring, useReducedMotion, useMotionValueEvent, AnimatePresence } from "framer-motion";
import type { MotionStyle } from "framer-motion";
import profilePic from "./assets/niklas-mountains.jpeg";
import { FaInstagram, FaLinkedin, FaEnvelope, FaMoon, FaSun, FaChevronDown } from "react-icons/fa";
import { Button } from "./components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "./components/ui/card";
import ParticleGalaxy from "./components/ParticleGalaxy";
import type { ParticleShape } from "./lib/particle-shapes";
import "./artwork.css";

interface PortfolioCard {
  title?: string;
  desc?: string;
  content?: ReactNode;
  offsetDegrees: number;
  radiusOffset: number;
  shadowClass: string;
  href?: string;
  isModal?: boolean;
  modalContent?: string;
  shape: ParticleShape;
  category: string;
  label: string;
  accent: string;
}

// Easy to edit array for the floating cards.
// Adding or removing items will automatically recalculate their positions in the circle!
// You can use `offsetDegrees` to add a bit of random displacement (e.g. -10 to 10 degrees).
// You can use `radiusOffset` to push cards further in or out from the center circle (e.g. -5 to 5).
// You can use `shadowClass` to simulate different floating heights (e.g. shadow-md, shadow-lg, shadow-xl, shadow-2xl).
const CARDS_DATA: PortfolioCard[] = [
  { 
    shape: "music", category: "SOUND / 01", label: "turntuppp", accent: "137, 96, 204",
    content: (
      <div className="w-full flex flex-col">
        <iframe className="dark:invert dark:hue-rotate-180 transition-[filter] duration-500 rounded-md" width="100%" height="110" scrolling="no" frameBorder="0" allow="autoplay; encrypted-media" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/soundcloud%253Atracks%253A2292371054&color=%234b4e3d&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true"></iframe>
        <div style={{ fontSize: "10px", color: "#cccccc", lineBreak: "anywhere", wordBreak: "normal", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", fontFamily: "Interstate,Lucida Grande,Lucida Sans Unicode,Lucida Sans,Garuda,Verdana,Tahoma,sans-serif", fontWeight: 100, marginTop: "4px" }}>
          <a href="https://soundcloud.com/jigglniggl" title="S0N!K" target="_blank" rel="noopener noreferrer" style={{ color: "#cccccc", textDecoration: "none" }}>S0N!K</a> · <a href="https://soundcloud.com/jigglniggl/turntuppp" title="turntuppp - S0N!K Bootleg" target="_blank" rel="noopener noreferrer" style={{ color: "#cccccc", textDecoration: "none" }}>turntuppp - S0N!K Bootleg</a>
        </div>
      </div>
    ),
    offsetDegrees: -15,
    radiusOffset: 0,
    shadowClass: "shadow-xl"
  },
  { 
    shape: "shop", category: "COMMERCE / 02", label: "Jost-Shop", accent: "188, 117, 54",
    title: "Jost-Shop", 
    desc: "A custom Three.js Shopify store I've built. Check it out!", 
    offsetDegrees: 5,
    href: "https://jost-shop.com",
    radiusOffset: 0,
    shadowClass: "shadow-2xl",
    isModal: true,
    modalContent: "Jost-Shop is the first Shopify store I've built featuring an integrated three.js homepage and some fancy animations. Had a lot of fun on that one. Feel free to take a look :)"
  },
  { 
    shape: "findus", category: "BUILDING / 03", label: "Findus", accent: "52, 151, 127",
    title: "Findus", 
    desc: "What I'm currently working on", 
    offsetDegrees: 0, 
    radiusOffset: 0, 
    shadowClass: "shadow-lg" , 
    href:"https://go-findus.tech",
    isModal: true,
    modalContent: "Findus is an exciting new project I'm currently building. Stay tuned for more updates on this!"
  },
  { 
    shape: "headphones", category: "SOUND / 04", label: "Onedanceee", accent: "137, 96, 204",
    content: (
      <div className="w-full flex flex-col">
        <iframe className="dark:invert dark:hue-rotate-180 transition-[filter] duration-500 rounded-md" width="100%" height="110" scrolling="no" frameBorder="0" allow="autoplay; encrypted-media" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/soundcloud%253Atracks%253A2093814105&color=%234b4e3d&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true"></iframe>
        <div style={{ fontSize: "10px", color: "#cccccc", lineBreak: "anywhere", wordBreak: "normal", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", fontFamily: "Interstate,Lucida Grande,Lucida Sans Unicode,Lucida Sans,Garuda,Verdana,Tahoma,sans-serif", fontWeight: 100, marginTop: "4px" }}>
          <a href="https://soundcloud.com/jigglniggl" title="S0N!K" target="_blank" rel="noopener noreferrer" style={{ color: "#cccccc", textDecoration: "none" }}>S0N!K</a> · <a href="https://soundcloud.com/jigglniggl/lamp-rawmix1" title="Onedanceee - S0N!K Bootleg" target="_blank" rel="noopener noreferrer" style={{ color: "#cccccc", textDecoration: "none" }}>Onedanceee - S0N!K Bootleg</a>
        </div>
      </div>
    ),
    offsetDegrees: -15,
    radiusOffset: 0,
    shadowClass: "shadow-2xl"
  },
  { 
    shape: "spark", category: "OFF THE CLOCK / 05", label: "Cool things", accent: "181, 95, 146",
    title: "Cool things", 
    desc: "Some things I find cool", 
    offsetDegrees: -8, 
    radiusOffset: 0, 
    shadowClass: "shadow-xl",
    isModal: true,
    modalContent: "Beluga lentils, Adam Audio T7V, Traktor Controll MX-2, Hyperlite Pleasure, Lowa Cadin II, Arizona Iced Tea, Paracord, Luma, Niagara Launcher, BMW f87, ScreenZen, Billabong Boardshorts, Ikea, Rossignol Ski Boots, Nosebutter 360s, Sendlinger Spezialkebab, Victorinox, U3 Universität, FL Studio updates, myradl"
  },

  { 
    shape: "modono", category: "ENGINEERING / 06", label: "Modono", accent: "76, 129, 194",
    title: "Modono",
    desc: "First hired engineer, building webshops for business clients.",
    offsetDegrees: -10, 
    radiusOffset: 0, 
    shadowClass: "shadow-lg",
    isModal: true,
    modalContent: "I'm the first hired engineer at Modono, where I build webshops for business clients.",
    href: "https://mondono.eu"
  },
];

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedCard, setSelectedCard] = useState<PortfolioCard | null>(null);
  const [hoveredShape, setHoveredShape] = useState<ParticleShape | null>(null);
  const [focusedShape, setFocusedShape] = useState<ParticleShape | null>(null);
  const [touchShape, setTouchShape] = useState<ParticleShape | null>(null);
  const [cardsActive, setCardsActive] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches);
  const reducedMotion = !!useReducedMotion();
  const activeShape = cardsActive ? selectedCard?.shape ?? hoveredShape ?? focusedShape ?? touchShape : null;
  const activeCard = CARDS_DATA.find(card => card.shape === activeShape);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(media.matches);
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  // Scroll directly from the introduction into the floating cards.
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 150, damping: 25, restDelta: 0.001 });
  const sceneProgress = reducedMotion ? scrollYProgress : smoothProgress;
  useMotionValueEvent(sceneProgress, "change", value => {
    const active = value > 0.55;
    setCardsActive(previous => previous === active ? previous : active);
    if (!active) {
      setHoveredShape(null);
      setFocusedShape(null);
      setTouchShape(null);
    }
  });

  useEffect(() => {
    if (!selectedCard) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedCard(null);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [selectedCard]);

  // SECTION 1: Image & "Hi! I'm Nik"
  const s1Scale = useTransform(smoothProgress, [0, 0.1, 0.5, 1], [1, 1, 0.85, 0.85]);
  const s1Y = useTransform(smoothProgress, [0, 0.1, 0.5, 1], [0, 0, -80, -80]);
  const s1Blur = useTransform(smoothProgress, [0, 0.1, 0.5, 1], ["blur(0px)", "blur(0px)", "blur(20px)", "blur(20px)"]);
  const s1Opacity = useTransform(smoothProgress, [0, 0.1, 0.5, 1], [1, 1, 0, 0]);
  // Use display: none to force the browser to completely remove the layer after it fades out
  const s1Display = useTransform(smoothProgress, (val) => (val > 0.55 ? "none" : "flex"));

  // SECTION 2: What I Do
  const cardsOpacity = useTransform(smoothProgress, [0, 0.2, 0.65, 1], [0, 0, 1, 1]);
  const cardsY = useTransform(smoothProgress, [0, 0.2, 0.65, 1], [80, 80, 0, 0]);
  const cardsPointerEvents = useTransform(smoothProgress, (val) => (val > 0.55 ? "auto" : "none"));
  const cardsRotate = useTransform(smoothProgress, [0.2, 1], [90, 0]);
  const cardsScale = useTransform(smoothProgress, [0.2, 1], [0.5, 1]);
  const cardsCounterRotate = useTransform(cardsRotate, (val) => -val);

  return (
      <div className="portfolio-artwork relative w-full min-h-[200vh] font-sans transition-colors duration-500">
      
      {/* Modal Overlay */}
      <AnimatePresence>
        {selectedCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/10 dark:bg-black/30 backdrop-blur-md pointer-events-auto"
            onClick={() => setSelectedCard(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="!bg-white dark:!bg-[#111] !backdrop-blur-none dark:text-white text-black border-black/10 dark:border-white/10 shadow-2xl p-6">
                <CardHeader className="p-0">
                  <CardTitle className="text-3xl font-bold">{selectedCard.title}</CardTitle>
                  <CardDescription className="text-lg mt-4">{selectedCard.modalContent}</CardDescription>
                </CardHeader>
                <div className="mt-8 flex justify-end gap-3">
                  {selectedCard.href && (
                    <Button asChild variant="secondary">
                      <a href={selectedCard.href} target="_blank" rel="noopener noreferrer">
                        Check it out!
                      </a>
                    </Button>
                  )}
                  <Button onClick={() => setSelectedCard(null)}>Close</Button>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Layer */}
      <div className="artwork-background fixed inset-0 z-0" />
      <ParticleGalaxy progress={sceneProgress} shape={activeShape} dark={isDarkMode} reducedMotion={reducedMotion} />
      <div className="edition-header" aria-hidden="true">
        <span>NIKLAS KORNEV<span className="edition-dot">.</span></span>
        <span>WORK, PLAY & A LITTLE CURIOSITY</span>
      </div>

      {/* Foreground Content Layer */}
      {/* Container is fixed so it stays in viewport while we scroll the body */}
      <div className="fixed inset-0 z-10 flex flex-col items-center justify-center pointer-events-none overflow-hidden">
        
        {/* ================= SECTION 1: Image & Greeting ================= */}
        <motion.div 
          style={{ y: reducedMotion ? 0 : s1Y, scale: reducedMotion ? 1 : s1Scale, filter: reducedMotion ? 'none' : s1Blur, opacity: s1Opacity, display: s1Display }}
          className="absolute items-center justify-center w-full h-full"
        >
          {/* Relative wrapper sets the size of the image so text can be positioned relative to its edges */}
          <div className="hero-photo relative @container w-[60vw] h-auto md:w-auto md:h-[60vh] aspect-[4/5]">
            
            {/* The Image (has overflow-hidden for rounded corners) */}
            <div className="absolute inset-0 rounded-[2rem] overflow-hidden shadow-2xl">
              <img src={profilePic} alt="Niklas in the mountains at sunrise" className="w-full h-full object-cover object-[54%_center]" />
            </div>

            {/* The Text Layer (Mix Blend Difference to invert image) */}
            <div className="absolute inset-0 mix-blend-difference text-white pointer-events-none">
              
              {/* "Hi!" Top Quarter, Overlaps Left by ~50% */}
              <div className="absolute top-[12%] left-0 -translate-x-[45%]">
                <h1 
                  className="font-black uppercase tracking-tighter leading-none"
                  style={{ 
                    fontSize: "45cqw",
                    filter: isDarkMode ? "drop-shadow(0 4px 6px rgba(0,0,0,0.5))" : "drop-shadow(0 15px 35px rgba(0,0,0,0.8))" 
                  }}
                >
                  Hi!
                </h1>
              </div>

              {/* "I'm Nik" Bottom Quarter, Overlaps Right by ~50% */}
              <div className="absolute bottom-[12%] right-0 translate-x-[45%] text-right">
                <h1 className="font-black uppercase tracking-tighter drop-shadow-md leading-none" style={{ fontSize: "35cqw" }}>
                  
                </h1>
              </div>

            </div>
          </div>
          
          {/* Scroll Indicator */}
          <motion.div
            style={{ opacity: s1Opacity }}
            className="absolute bottom-[13vh] flex flex-col items-center"
          >
            <motion.div
              animate={{ y: reducedMotion ? 0 : [0, 10, 0, 10, 0, 0] }}
              transition={{ 
                repeat: Infinity, 
                duration: 4, 
                times: [0, 0.1, 0.2, 0.3, 0.4, 1],
                ease: "easeInOut" 
              }}
            >
              <FaChevronDown className="dark:text-white/50 text-black/50 w-6 h-6" />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* ================= SECTION 2: What I Do ================= */}
        <motion.div 
          style={{ opacity: cardsOpacity, y: reducedMotion ? 0 : cardsY, pointerEvents: cardsPointerEvents }}
          className="absolute inset-0 flex items-center justify-center w-full h-full"
        >
          <div className="orbit-layout relative w-full h-full max-w-6xl mx-auto flex items-center justify-center mb-[30px]" inert={!cardsActive}>
            
            {/* Desktop Center Text */}
            <div className="orbit-center" aria-live="polite">
              <motion.div aria-hidden={!!activeShape} animate={{ opacity: activeShape ? 0 : 1, scale: activeShape ? 0.94 : 1 }} transition={{ duration: reducedMotion ? 0 : 0.3 }}>
                <span className="orbit-eyebrow">A FEW THINGS IN MY ORBIT</span>
                <h2>Here's what I do</h2>
                <p>Explore a little.</p>
              </motion.div>
            </div>
            <div className="orbit-caption">
              <AnimatePresence mode="wait">
                {activeCard && (
                  <motion.div key={activeCard.shape} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} transition={{ duration: reducedMotion ? 0 : 0.2 }}>
                    <span className="orbit-eyebrow">{activeCard.category}</span>
                    <p>{activeCard.label}</p>
                    {touchShape && <button className="back-to-orbit" type="button" onClick={() => { setTouchShape(null); setFocusedShape(null); }}>Back to orbit ↺</button>}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {/* One responsive card list keeps the same SoundCloud instances alive. */}
            <motion.div 
              style={{ rotate: isMobile || reducedMotion ? 0 : cardsRotate, scale: isMobile || reducedMotion ? 1 : cardsScale }}
              className="orbit-cards hide-scrollbar"
            >
              {CARDS_DATA.map((card, index) => {
                // Calculate position along an ellipse with a slight random displacement
                const baseAngle = (index / CARDS_DATA.length) * 2 * Math.PI;
                const offsetRadians = ((card.offsetDegrees || 0) * Math.PI) / 180;
                const angle = baseAngle + offsetRadians;
                
                // Allow dynamic pushing inwards/outwards to prevent overlap without hitting edges
                const radius = 34 + (card.radiusOffset || 0);
                const left = `${50 + Math.cos(angle) * radius}%`;
                const top = `${50 + Math.sin(angle) * radius}%`;

                return (
                  <motion.div 
                    key={card.shape}
                    style={{ 
                      left: isMobile ? 'auto' : left,
                      top: isMobile ? 'auto' : top,
                      x: isMobile ? 0 : "-50%",
                      y: isMobile ? 0 : "-50%",
                      rotate: isMobile || reducedMotion ? 0 : cardsCounterRotate,
                      '--card-accent': card.accent,
                    } as MotionStyle}
                    whileHover={reducedMotion || isMobile ? undefined : { scale: 1.035, zIndex: 50, rotateX: 2, rotateY: -3 }}
                    className={`orbit-card cursor-pointer rounded-xl ${activeShape === card.shape ? 'is-active' : ''}`}
                    data-shape={card.shape}
                    role={card.isModal ? "button" : "group"}
                    aria-label={card.label}
                    tabIndex={0}
                    onPointerEnter={event => { if (event.pointerType === 'mouse') setHoveredShape(card.shape); else setTouchShape(card.shape); }}
                    onPointerLeave={() => setHoveredShape(null)}
                    onFocusCapture={event => { if (event.target.matches(':focus-visible')) setFocusedShape(card.shape); }}
                    onPointerDown={event => { setFocusedShape(null); if (event.pointerType !== 'mouse') setTouchShape(card.shape); }}
                    onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocusedShape(null); }}
                    onKeyDown={event => {
                      if (event.target === event.currentTarget && card.isModal && (event.key === 'Enter' || event.key === ' ')) {
                        event.preventDefault(); setSelectedCard(card);
                      }
                    }}
                    onClick={() => {
                      if (card.isModal) setSelectedCard(card);
                      else if (card.href) window.open(card.href, '_blank');
                    }}
                  >
                    <Card className="orbit-card-surface h-full">
                      <div className="card-meta"><span><i />{card.category}</span><span aria-hidden="true">{card.content ? '♫' : '↗'}</span></div>
                      {card.content ? card.content : (
                        <CardHeader className="flex flex-col justify-center">
                          <CardTitle>{card.title}</CardTitle>
                          <CardDescription>{card.desc}</CardDescription>
                        </CardHeader>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>

          </div>
        </motion.div>



        {/* Action Buttons / Footer (Always visible) */}
        <div className="social-dock absolute bottom-8 flex items-center justify-center gap-6 pointer-events-auto z-50">
          <a 
            href="https://instagram.com/s0nik.wav" 
            target="_blank" 
            rel="noopener noreferrer"
            className="dark:text-white/60 text-black/60 dark:hover:text-white hover:text-black transition-transform hover:scale-110 duration-300"
            aria-label="Instagram"
          >
            <FaInstagram className="w-5 h-5" />
          </a>

          <a 
            href="https://www.linkedin.com/in/niklas-kornev-ba268133a/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="dark:text-white/60 text-black/60 dark:hover:text-white hover:text-black transition-transform hover:scale-110 duration-300"
            aria-label="LinkedIn"
          >
            <FaLinkedin className="w-5 h-5" />
          </a>

          <a 
            href="mailto:niklas@go-findus.tech"
            className="dark:text-white/60 text-black/60 dark:hover:text-white hover:text-black transition-transform hover:scale-110 duration-300"
            aria-label="Email"
          >
            <FaEnvelope className="w-5 h-5" />
          </a>

          <div className="w-[1px] h-6 bg-black/20 dark:bg-white/20 mx-2"></div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-full dark:text-white/60 text-black/60 dark:hover:text-white hover:text-black hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            aria-label="Toggle Theme"
          >
            <FaSun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <FaMoon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
        
      </div>
    </div>
  );
}

export default App;
