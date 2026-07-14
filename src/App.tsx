import { useState, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import profilePic from "./assets/profile picture.jpeg";
import { FaInstagram, FaLinkedin, FaEnvelope, FaMoon, FaSun, FaChevronDown } from "react-icons/fa";
import { Button } from "./components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "./components/ui/card";
import ClickSpark from "./components/ui/ClickSpark";

// Easy to edit array for Section 3 Cards. 
// Adding or removing items will automatically recalculate their positions in the circle!
// You can use `offsetDegrees` to add a bit of random displacement (e.g. -10 to 10 degrees).
// You can use `radiusOffset` to push cards further in or out from the center circle (e.g. -5 to 5).
// You can use `shadowClass` to simulate different floating heights (e.g. shadow-md, shadow-lg, shadow-xl, shadow-2xl).
export const CARDS_DATA: any[] = [
  { 
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
    title: "Cool things", 
    desc: "Some things I find cool", 
    offsetDegrees: -8, 
    radiusOffset: 0, 
    shadowClass: "shadow-xl",
    isModal: true,
    modalContent: "Beluga lentils, Adam Audio T7V, Traktor Controll MX-2, Hyperlite Pleasure, Lowa Cadin II, Arizona Iced Tea, Paracord, Luma, Niagara Launcher, BMW f87, ScreenZen, Billabong Boardshorts, Ikea, Rossignol Ski Boots, Nosebutter 360s, Sendlinger Spezialkebab, Victorinox, U3 Universität, FL Studio updates, myradl"
  },

  { 
    title: "My CV", 
    desc: "Download my resume", 
    offsetDegrees: -10, 
    radiusOffset: 0, 
    shadowClass: "shadow-lg",
    isModal: true,
    modalContent: "Here you can download my CV to learn more about my experience and skills.",
    download: true,
    href: "/cv.pdf"
  },
];

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedCard, setSelectedCard] = useState<any>(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  // We will use scrollYProgress (0 to 1) for consistent responsive animation pacing across the 3 sections.
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 150, damping: 25, restDelta: 0.001 });

  // SECTION 1: Image & "Hi! I'm Nik"
  const s1Scale = useTransform(smoothProgress, [0, 0.2, 0.4, 1], [1, 1, 0.85, 0.85]);
  const s1Y = useTransform(smoothProgress, [0, 0.2, 0.4, 1], [0, 0, -80, -80]);
  const s1Blur = useTransform(smoothProgress, [0, 0.2, 0.4, 1], ["blur(0px)", "blur(0px)", "blur(20px)", "blur(20px)"]);
  const s1Opacity = useTransform(smoothProgress, [0, 0.2, 0.4, 1], [1, 1, 0, 0]);
  // Use display: none to force the browser to completely remove the layer after it fades out
  const s1Display = useTransform(smoothProgress, (val) => (val > 0.45 ? "none" : "flex"));

  // SECTION 2: Paragraph
  const s2Opacity = useTransform(smoothProgress, [0, 0.25, 0.4, 0.55, 0.7, 1], [0, 0, 1, 1, 0, 0]);
  const s2Y = useTransform(smoothProgress, [0, 0.25, 0.4, 0.55, 0.7, 1], [80, 80, 0, 0, -80, -80]);
  const s2PointerEvents = useTransform(smoothProgress, (val) => (val > 0.35 && val < 0.65 ? "auto" : "none"));
  const s2Display = useTransform(smoothProgress, (val) => (val > 0.75 ? "none" : "flex"));

  // SECTION 3: What I Do
  const s3Opacity = useTransform(smoothProgress, [0, 0.75, 0.9, 1], [0, 0, 1, 1]);
  const s3Y = useTransform(smoothProgress, [0, 0.75, 0.9, 1], [80, 80, 0, 0]);
  const s3PointerEvents = useTransform(smoothProgress, (val) => (val > 0.8 ? "auto" : "none"));
  const s3CardsRotate = useTransform(smoothProgress, [0.75, 1], [90, 0]);
  const s3CardsScale = useTransform(smoothProgress, [0.75, 1], [0.5, 1]);
  const s3CardsCounterRotate = useTransform(s3CardsRotate, (val) => -val);

  return (
    <ClickSpark 
      sparkColor={isDarkMode ? '#fff' : '#000'} 
      sparkSize={12} 
      sparkRadius={20} 
      sparkCount={8} 
      duration={600}
    >
      <div className="relative w-full dark:bg-black bg-white min-h-[300vh] font-sans transition-colors duration-500">
      
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
                  {selectedCard.href && !selectedCard.download && (
                    <Button 
                      variant="secondary"
                      onClick={() => window.open(selectedCard.href.startsWith('http') ? selectedCard.href : `https://${selectedCard.href}`, '_blank')}
                    >
                      Check it out!
                    </Button>
                  )}
                  {selectedCard.href && selectedCard.download && (
                    <a href={selectedCard.href} download>
                      <Button variant="secondary">
                        Download CV
                      </Button>
                    </a>
                  )}
                  <Button onClick={() => setSelectedCard(null)}>Close</Button>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Background Layer */}
      <div className="fixed inset-0 z-0 dark:bg-black bg-white transition-colors duration-500"></div>

      {/* Foreground Content Layer */}
      {/* Container is fixed so it stays in viewport while we scroll the body */}
      <div className="fixed inset-0 z-10 flex flex-col items-center justify-center pointer-events-none overflow-hidden">
        
        {/* ================= SECTION 1: Image & Greeting ================= */}
        <motion.div 
          style={{ y: s1Y, scale: s1Scale, filter: s1Blur, opacity: s1Opacity, display: s1Display }}
          className="absolute items-center justify-center w-full h-full"
        >
          {/* Relative wrapper sets the size of the image so text can be positioned relative to its edges */}
          <div className="relative @container w-[60vw] h-auto md:w-auto md:h-[60vh] aspect-[4/5]">
            
            {/* The Image (has overflow-hidden for rounded corners) */}
            <div className="absolute inset-0 rounded-[2rem] overflow-hidden shadow-2xl brightness-75">
              <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
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
              animate={{ y: [0, 10, 0, 10, 0, 0] }}
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

        {/* ================= SECTION 2: Paragraph ================= */}
        <motion.div 
          style={{ opacity: s2Opacity, y: s2Y, pointerEvents: s2PointerEvents, display: s2Display }}
          className="absolute flex flex-col items-start justify-center w-[90%] md:w-[50vw]"
        >
          <p className="text-xl md:text-2xl font-medium dark:text-white text-black leading-relaxed text-left">
            I'm Nik. <br/>
            I currently study Datascience at HM and BMW. Apart from that I'd like to build something sick.<br/>
            If that sounds good to you, <br/> 
            <a 
              href="https://www.linkedin.com/in/niklas-kornev-ba268133a/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="dark:text-white text-black hover:opacity-80 underline decoration-2 underline-offset-4 transition-opacity mt-2 inline-block font-bold"
            >
              hit me up :)
            </a>
          </p>
        </motion.div>

        {/* ================= SECTION 3: What I Do ================= */}
        <motion.div 
          style={{ opacity: s3Opacity, y: s3Y, pointerEvents: s3PointerEvents }}
          className="absolute inset-0 flex items-center justify-center w-full h-full"
        >
          <div className="relative w-full h-full max-w-6xl mx-auto flex items-center justify-center mb-[30px]">
            
            {/* Desktop Center Text */}
            <p className="hidden md:block text-xl md:text-2xl font-medium dark:text-white text-black leading-relaxed text-center px-4 z-10">
              Here's what I do
            </p>
            
            {/* Desktop: Floating Cards Spinning Container */}
            <motion.div 
              style={{ rotate: s3CardsRotate, scale: s3CardsScale }} 
              className="hidden md:block absolute inset-0 w-full h-full"
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
                    key={index}
                    style={{ 
                      left, 
                      top, 
                      x: "-50%", 
                      y: "-50%",
                      rotate: s3CardsCounterRotate 
                    }} 
                    whileHover={{ scale: 1.1, zIndex: 50 }} 
                    className={`absolute w-56 md:w-64 cursor-pointer rounded-xl ${card.shadowClass || 'shadow-xl'} hover:shadow-none transition-shadow duration-300`}
                    onClick={() => {
                      if (card.isModal) setSelectedCard(card);
                      else if (card.href) window.open(card.href, '_blank');
                    }}
                  >
                    <Card className="dark:bg-black/40 bg-white/40 dark:text-white text-black border-black/10 dark:border-white/10 backdrop-blur-md p-2 overflow-hidden dark:hover:bg-white/5 transition-colors h-full">
                      {card.content ? card.content : (
                        <CardHeader className="h-full flex flex-col justify-center">
                          <CardTitle>{card.title}</CardTitle>
                          <CardDescription>{card.desc}</CardDescription>
                        </CardHeader>
                      )}
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Mobile: Vertical Stack */}
            <motion.div
              style={{ scale: s3CardsScale }}
              className="md:hidden absolute inset-0 w-full h-full flex flex-col items-center gap-6 px-4 pt-[15vh] pb-32 overflow-y-auto pointer-events-auto hide-scrollbar"
            >
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-xl font-medium dark:text-white text-black leading-relaxed text-center shrink-0 mt-[10vh] mb-4"
              >
                Here's what I do
              </motion.p>
              {CARDS_DATA.map((card, index) => (
                <motion.div 
                  key={`mobile-${index}`}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className={`w-full max-w-sm shrink-0 cursor-pointer rounded-xl ${card.shadowClass || 'shadow-xl'} transition-shadow duration-300`}
                  onClick={() => {
                    if (card.isModal) setSelectedCard(card);
                    else if (card.href) window.open(card.href, '_blank');
                  }}
                >
                  <Card className="dark:bg-black/40 bg-white/40 dark:text-white text-black border-black/10 dark:border-white/10 backdrop-blur-md p-2 overflow-hidden dark:hover:bg-white/5 transition-colors h-full w-full">
                    {card.content ? card.content : (
                      <CardHeader className="h-full flex flex-col justify-center">
                        <CardTitle>{card.title}</CardTitle>
                        <CardDescription>{card.desc}</CardDescription>
                      </CardHeader>
                    )}
                  </Card>
                </motion.div>
              ))}
            </motion.div>

          </div>
        </motion.div>



        {/* Action Buttons / Footer (Always visible) */}
        <div className="absolute bottom-8 left-0 w-full flex items-center justify-center gap-6 pointer-events-auto z-50">
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
            href="mailto:niklaskornev@gmx.net"
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
    </ClickSpark>
  );
}

export default App;
