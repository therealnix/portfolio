import { motion, useScroll, useTransform } from "framer-motion";
import profilePic from "./assets/profile picture.jpeg";
import { FaInstagram, FaLinkedin, FaEnvelope } from "react-icons/fa";
import { Card, CardContent } from "./components/ui/card";

function App() {
  // We will use scrollYProgress (0 to 1) for consistent responsive animation pacing across the 3 sections.
  const { scrollYProgress } = useScroll();

  // SECTION 1: Image & "Hi! I'm Nik"
  // Explicitly mapping 0 to 1 to prevent any extrapolation bugs causing it to reappear!
  const s1Scale = useTransform(scrollYProgress, [0, 0.15, 0.3, 1], [1, 1, 1.5, 1.5]);
  const s1Blur = useTransform(scrollYProgress, [0, 0.15, 0.3, 1], ["blur(0px)", "blur(0px)", "blur(20px)", "blur(20px)"]);
  const s1Opacity = useTransform(scrollYProgress, [0, 0.15, 0.3, 1], [1, 1, 0, 0]);
  // Use display: none to force the browser to completely remove the layer after it fades out, 
  // bypassing any WebKit compositing bugs with mix-blend-mode and opacity: 0.
  const s1Display = useTransform(scrollYProgress, (val) => (val > 0.5 ? "none" : "flex"));

  // SECTION 2: Paragraph
  // Explicitly mapping from 0 to 1 to keep it hidden before and after its designated scroll window.
  const s2Opacity = useTransform(scrollYProgress, [0, 0.25, 0.4, 0.6, 0.75, 1], [0, 0, 1, 1, 0, 0]);
  const s2Y = useTransform(scrollYProgress, [0, 0.25, 0.4, 1], [40, 40, 0, 0]);
  // Only allow clicking the link when Section 2 is actually visible
  const s2PointerEvents = useTransform(scrollYProgress, (val) => (val > 0.45 && val < 1 ? "auto" : "none"));

  // // SECTION 3: Spotify
  const s3Opacity = useTransform(scrollYProgress, [0, 0.75, 0.9, 1], [0, 0, 1, 1]);
  const s3Y = useTransform(scrollYProgress, [0, 0.75, 0.9, 1], [80, 80, 0, 0]);
  const s3Scale = useTransform(scrollYProgress, [0, 0.75, 0.9, 1], [0.95, 0.95, 1, 1]);
  const s3PointerEvents = useTransform(scrollYProgress, (val) => (val > 0.8 ? "auto" : "none"));

  return (
    <div className="relative w-full bg-black min-h-[400vh] font-sans">
      {/* Background Layer (kept black for crisp blending) */}
      <div className="fixed inset-0 z-0 bg-black"></div>

      {/* Foreground Content Layer */}
      {/* Container is fixed so it stays in viewport while we scroll the body */}
      <div className="fixed inset-0 z-10 flex flex-col items-center justify-center pointer-events-none overflow-hidden">
        
        {/* ================= SECTION 1: Image & Greeting ================= */}
        <motion.div 
          style={{ scale: s1Scale, filter: s1Blur, opacity: s1Opacity, display: s1Display }}
          className="absolute items-center justify-center w-full h-full"
        >
          {/* Relative wrapper sets the size of the image so text can be positioned relative to its edges */}
          <div className="relative w-64 h-80 md:w-80 md:h-[400px]">
            
            {/* The Image (has overflow-hidden for rounded corners) */}
            <div className="absolute inset-0 rounded-[2rem] overflow-hidden shadow-2xl brightness-75">
              <img src={profilePic} alt="Profile" className="w-full h-full object-cover" />
            </div>

            {/* The Text Layer (Mix Blend Difference to invert image) */}
            <div className="absolute inset-0 mix-blend-difference text-white pointer-events-none">
              
              {/* "Hi!" Top Quarter, Overlaps Left by ~50% */}
              <div className="absolute top-[10%] md:top-[12%] left-0 -translate-x-[45%]">
                <h1 className="text-7xl md:text-[9rem] font-black uppercase tracking-tighter drop-shadow-md leading-none">
                  Hi!
                </h1>
              </div>

              {/* "I'm Nik" Bottom Quarter, Overlaps Right by ~50% */}
              <div className="absolute bottom-[10%] md:bottom-[12%] right-0 translate-x-[45%] text-right">
                <h1 className="text-6xl md:text-[7rem] font-black uppercase tracking-tighter drop-shadow-md leading-none">
                  
                </h1>
              </div>

            </div>
          </div>
        </motion.div>

        {/* ================= SECTION 2: Paragraph ================= */}
        <motion.div 
          style={{ opacity: s2Opacity, y: s2Y, pointerEvents: s2PointerEvents }}
          className="absolute flex flex-col items-center justify-center px-6 w-full max-w-3xl"
        >
          <p className="text-2xl md:text-5xl font-black text-white text-center tracking-wide leading-tight drop-shadow-xl">
            
            
            <span className="text-white/70  text-xl  mt-4 block">
            I'm Nik. <br/>
            I want to build something sick.<br/>
            If that sounds good to you, <br/> 
            <a 
              href="https://www.linkedin.com/in/niklas-kornev-ba268133a/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-white hover:text-white/80 underline decoration-2 underline-offset-4 transition-colors"
            >
              hit me up :)
            </a>
            </span>
          </p>
        </motion.div>

        {/* ================= SECTION 3: Spotify ================= */}
        <motion.div
          style={{ opacity: s3Opacity, y: s3Y, scale: s3Scale, pointerEvents: s3PointerEvents }}
          className="absolute flex flex-col items-center justify-center px-6 w-full max-w-2xl"
        >
          <p className="text-white/70 text-xl mt-4 block text-center tracking-wide leading-tight font-black drop-shadow-xl mb-6">
            Here's some music
          </p>
          <Card className="w-full border-white/5 backdrop-blur-2xl shadow-2xl p-2 rounded-3xl overflow-hidden transition-all duration-500">
            <CardContent className="p-0">
              <iframe 
                data-testid="embed-iframe" 
                className="rounded-[1.25rem] w-full" 
                src="https://open.spotify.com/embed/playlist/6Y0nGullYvZh4ORGIsbOc9?utm_source=generator&theme=0&si=e227ab3b72314388" 
                width="100%" 
                height="352" 
                frameBorder="0" 
                allowFullScreen={false} 
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                loading="lazy">
              </iframe>
            </CardContent>
          </Card>
        </motion.div>

        {/* Action Buttons / Footer (Always visible) */}
        <div className="absolute bottom-8 left-0 w-full flex items-center justify-center gap-8 pointer-events-auto z-50">
          <a 
            href="https://instagram.com/s0nik.wav" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-white/60 hover:text-white transition-transform hover:scale-110 duration-300"
            aria-label="Instagram"
          >
            <FaInstagram className="w-7 h-7" />
          </a>

          <a 
            href="https://www.linkedin.com/in/niklas-kornev-ba268133a/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-white/60 hover:text-white transition-transform hover:scale-110 duration-300"
            aria-label="LinkedIn"
          >
            <FaLinkedin className="w-7 h-7" />
          </a>

          <a 
            href="mailto:niklaskornev@gmx.net"
            className="text-white/60 hover:text-white transition-transform hover:scale-110 duration-300"
            aria-label="Email"
          >
            <FaEnvelope className="w-7 h-7" />
          </a>
        </div>
        
      </div>
    </div>
  );
}

export default App;
