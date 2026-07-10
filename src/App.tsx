import { useState, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import profilePic from "./assets/profile picture.jpeg";
import { FaInstagram, FaLinkedin, FaEnvelope, FaMoon, FaSun, FaChevronDown } from "react-icons/fa";
import { Button } from "./components/ui/button";

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

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

  // SECTION 1: Image & "Hi! I'm Nik"
  const s1Scale = useTransform(scrollYProgress, [0, 0.3, 0.6, 1], [1, 1, 0.85, 0.85]);
  const s1Y = useTransform(scrollYProgress, [0, 0.3, 0.6, 1], [0, 0, -80, -80]);
  const s1Blur = useTransform(scrollYProgress, [0, 0.3, 0.6, 1], ["blur(0px)", "blur(0px)", "blur(20px)", "blur(20px)"]);
  const s1Opacity = useTransform(scrollYProgress, [0, 0.3, 0.6, 1], [1, 1, 0, 0]);
  // Use display: none to force the browser to completely remove the layer after it fades out
  const s1Display = useTransform(scrollYProgress, (val) => (val > 0.7 ? "none" : "flex"));

  // SECTION 2: Paragraph
  // Animates continuously until the very bottom of the scroll (1.0) so there is no dead space
  const s2Opacity = useTransform(scrollYProgress, [0, 0.4, 0.8, 1], [0, 0, 1, 1]);
  const s2Y = useTransform(scrollYProgress, [0, 0.4, 1], [80, 80, 0]);
  const s2PointerEvents = useTransform(scrollYProgress, (val) => (val > 0.5 ? "auto" : "none"));

  return (
    <div className="relative w-full dark:bg-black bg-white min-h-[200vh] font-sans transition-colors duration-500">
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
          <div className="relative @container w-[80vw] h-auto md:w-auto md:h-[60vh] aspect-[4/5]">
            
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
          style={{ opacity: s2Opacity, y: s2Y, pointerEvents: s2PointerEvents }}
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
  );
}

export default App;
