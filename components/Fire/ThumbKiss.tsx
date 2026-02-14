
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Info, ChevronDown, X, Heart, Fingerprint, Sparkles, BellRing } from 'lucide-react';

interface Particle {
  id: number;
  angle?: number;
  velocity?: number;
  size: number;
  color: string;
  rotation: number;
  type: 'burst' | 'float' | 'queue' | 'stuck' | 'pop-ring';
  xOffset?: number; 
  yOffset?: number;
  duration?: number;
  delay?: number;
  index?: number;
  curveX?: number; 
  targetX?: number; 
  targetY?: number; 
}

const EMOJI_MESSAGES: Record<string, string> = {
    '❤️': "I'm waiting for your love... ❤️",
    '💋': "Sending you a big virtual kiss! Mwah! 💋",
    '🤝': "Supporting you always! Let's hold hands. 🤝",
    '🐥': "I really wanna hug you right now! 🐥",
    '🔥': "You're looking so hot today! 🔥",
    '✨': "You make my whole world sparkle. ✨",
    '🍕': "Thinking of a pizza date with you... 🍕",
    '🦋': "You still give me butterflies every single time. 🦋",
    '🌈': "You're the rainbow in my life! 🌈",
    '🍀': "I'm so lucky to have you! 🍀",
    '🛸': "You're out of this world! 🛸",
    '🎮': "Wanna play games later? 🎮",
    '🎸': "You rock my world! 🎸",
    '🎨': "You're my masterpiece. 🎨",
    '📸': "Let's take a cute selfie next time we meet! 📸",
    '🎈': "Celebrating you today! 🎈",
    '🧸': "Sending you a huge warm bear hug! 🧸",
    '🍭': "You're so sweet! 🍭",
    '🌊': "Riding the wave of love with you. 🌊",
    '🪐': "I love you to Saturn and back. 🪐",
    '🌸': "You're blooming more beautifully every day. 🌸",
    '💎': "You're my precious diamond. 💎",
    '🍩': "I'm 'donut' know what I'd do without you! 🍩",
    ' foxes': "Stay foxy, babe! 🦊"
};

interface ThumbKissProps {
    onComplete?: (message: string) => void;
    partnerConnected?: boolean;
}

const ThumbKiss: React.FC<ThumbKissProps> = ({ onComplete, partnerConnected }) => {
  const [isPressing, setIsPressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState({ icon: '❤️', label: 'Heart' });
  const [particles, setParticles] = useState<Particle[]>([]);
  const [fillCount, setFillCount] = useState(0);
  
  // Cinematic states for the 4th fill (Infinite Zoom)
  const [logoPopPhase, setLogoPopPhase] = useState<'none' | 'emerge' | 'split' | 'pop' | 'clear'>('none');
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const emojis = [
    { icon: '❤️', label: 'Heart' }, { icon: '💋', label: 'Kiss' }, { icon: '🤝', label: 'Handshake' },
    { icon: '🐥', label: 'Chick' }, { icon: '🔥', label: 'Fire' }, { icon: '✨', label: 'Sparkle' },
    { icon: '🍕', label: 'Pizza' }, { icon: '🦋', label: 'Butterfly' }, { icon: '🌈', label: 'Rainbow' },
    { icon: '🍀', label: 'Clover' }, { icon: '🛸', label: 'UFO' }, { icon: '🎮', label: 'Gaming' },
    { icon: '🎸', label: 'Rock' }, { icon: '🎨', label: 'Art' }, { icon: '📸', label: 'Snap' },
    { icon: '🎈', label: 'Party' }, { icon: '🧸', label: 'Teddy' }, { icon: '🍭', label: 'Candy' },
    { icon: '🌊', label: 'Wave' }, { icon: '🪐', label: 'Saturn' }, { icon: '🌸', label: 'Bloom' },
    { icon: '💎', label: 'Gem' }, { icon: '🍩', label: 'Donut' }, { icon: '🦊', label: 'Fox' },
  ];

  const triggerAnimation = useCallback((count: number) => {
    const colors = ['#ff2d55', '#ff4d6d', '#ff758f', '#ffb3c1', '#ffffff'];
    const mode = count % 4; 

    if (onComplete) {
        const msg = EMOJI_MESSAGES[selectedEmoji.icon] || `Thinking of you! ${selectedEmoji.icon}`;
        onComplete(msg);
    }

    if (mode === 0) {
      const newParticles = Array.from({ length: 45 }).map((_, i) => ({
        id: Date.now() + i,
        angle: Math.random() * Math.PI * 2,
        velocity: 220 + Math.random() * 350,
        size: 14 + Math.random() * 26,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        type: 'burst' as const
      }));
      setParticles(newParticles);
      setTimeout(() => setParticles([]), 1200);
    } else if (mode === 1) {
      const newParticles = Array.from({ length: 30 }).map((_, i) => ({
        id: Date.now() + i,
        size: 12 + Math.random() * 22,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        xOffset: (Math.random() - 0.5) * 300, 
        duration: 1.8 + Math.random() * 2.2,
        type: 'float' as const
      }));
      setParticles(newParticles);
      setTimeout(() => setParticles([]), 4000);
    } else if (mode === 2) {
      const particleCount = 28;
      const newParticles = Array.from({ length: particleCount }).map((_, i) => {
        const size = 38 + Math.random() * 12;
        const t = (i / particleCount) * Math.PI * 2;
        const targetX = 16 * Math.pow(Math.sin(t), 3) * 6.5;
        const targetY = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t)) * 6.5;
        const curveX = 110 + Math.sin((i / particleCount) * Math.PI) * 45;
        return {
          id: Date.now() + i,
          size: size,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: (Math.random() - 0.5) * 20,
          index: i,
          type: 'queue' as const,
          xOffset: (Math.random() - 0.5) * 10, 
          yOffset: (Math.random() - 0.5) * 10,
          curveX: curveX,
          targetX: targetX,
          targetY: targetY,
          delay: i * 0.05, 
        };
      });
      setParticles(newParticles);
      setTimeout(() => {
        const logo = document.getElementById('main-logo');
        if (logo) {
          logo.classList.add('logo-glow');
          if (navigator.vibrate) navigator.vibrate([20, 80, 20]);
          setTimeout(() => logo.classList.remove('logo-glow'), 2000);
        }
      }, 5200);
      setTimeout(() => setParticles([]), 7500);
    } else {
      // MODE 3: CINEMATIC 8-SECOND HEARTBEAT REVEAL
      const giantHeart: Particle[] = [{
        id: Date.now(),
        size: 300, 
        color: '#ff2d55', 
        rotation: 0, 
        type: 'stuck' as const,
        delay: 0, 
      }];
      setParticles(giantHeart);
      
      // 1. Heart expands (CSS handle)
      
      // 2. Logo emerges with Bloom Effect (3.2s)
      setTimeout(() => setLogoPopPhase('emerge'), 3200);
      
      // 3. The letter 't' detaches and SPINS 360 (5.5s)
      setTimeout(() => setLogoPopPhase('split'), 5500);
      
      // 4. The 't' strikes the heart, triggering the pop and burst ring (7s)
      setTimeout(() => {
        setLogoPopPhase('pop');
        if (navigator.vibrate) navigator.vibrate([20, 10, 200]);
        
        // Add white burst ring particles
        const ringParticles = Array.from({ length: 24 }).map((_, i) => ({
            id: Date.now() + i + 1000,
            angle: (i / 24) * Math.PI * 2,
            velocity: 600,
            size: 15 + Math.random() * 15,
            color: '#ffffff',
            rotation: Math.random() * 360,
            type: 'pop-ring' as const
        }));
        setParticles(prev => [...prev, ...ringParticles]);

        // 5. Screen clears to Reveal App
        setTimeout(() => {
          setLogoPopPhase('clear');
          setParticles([]);
          setTimeout(() => {
            setLogoPopPhase('none');
          }, 800);
        }, 600);
      }, 7200);
    }
  }, [onComplete, selectedEmoji]);

  const startPress = (e: React.PointerEvent) => {
    if (showEmojiPicker || showTutorial || logoPopPhase !== 'none') return;
    setIsPressing(true);
    setShowSuccess(false);
    if (navigator.vibrate) navigator.vibrate([20, 30]);
    timerRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          if (navigator.vibrate) navigator.vibrate([100, 50, 150]);
          setShowSuccess(true);
          const currentCount = fillCount;
          triggerAnimation(currentCount);
          setFillCount(currentCount + 1);
          if (timerRef.current) clearInterval(timerRef.current);
          return 100;
        }
        return prev + 4.5; 
      });
    }, 25);
  };

  const endPress = () => {
    setIsPressing(false);
    if (timerRef.current) clearInterval(timerRef.current);
    if (progress >= 100) {
        setTimeout(() => { setProgress(0); setShowSuccess(false); }, 1500);
    } else {
        setProgress(0);
    }
  };

  return (
    <section className="mb-0">
      <div className="flex justify-between items-center px-1 mb-2">
        <h3 className="text-xl font-black italic tracking-tighter uppercase transition-colors">feel connected</h3>
        <button onClick={() => setShowTutorial(true)} className="p-1.5 bg-white/5 rounded-full text-white/40 hover:text-white transition-colors">
          <Info size={16} />
        </button>
      </div>

      <div 
        ref={containerRef}
        className="bg-[#0f0f13] rounded-[2.5rem] relative border border-white/[0.03] h-64 select-none touch-none shadow-2xl overflow-hidden"
        onPointerDown={startPress}
        onPointerUp={endPress}
        onPointerLeave={endPress}
      >
        <div className="absolute top-6 left-8 right-10 flex justify-between items-center z-20">
            <button onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(!showEmojiPicker); }} className={`flex items-center space-x-3 bg-[#1a1a20] pl-3 pr-4 py-2 rounded-full transition-all border border-white/5 hover:bg-[#25252c] active:scale-95 ${showEmojiPicker ? 'ring-2 ring-white/10' : ''}`}>
                <span className="text-xl leading-none">{selectedEmoji.icon}</span>
                <ChevronDown size={14} className={`text-white transition-opacity duration-300 opacity-60 ${showEmojiPicker ? 'rotate-180' : 'rotate-0'}`} />
            </button>
            <span className="text-white font-normal text-lg tracking-tight pointer-events-none opacity-90 transition-opacity duration-300">
              {progress >= 100 ? 'Sent!' : isPressing ? 'Filling...' : 'Hold Heart'}
            </span>
        </div>

        {showEmojiPicker && (
          <div className="absolute top-20 left-8 right-8 bg-[#1a1a20] border border-white/10 rounded-[2rem] p-4 z-30 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in zoom-in-95 duration-200">
            <div className="grid grid-cols-4 gap-3 max-h-[220px] overflow-y-auto custom-scrollbar">
              {emojis.map((e) => (
                <button
                  key={e.label}
                  onClick={(event) => { event.stopPropagation(); setSelectedEmoji(e); setShowEmojiPicker(false); }}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all ${selectedEmoji.label === e.label ? 'bg-white/10 border border-white/20 scale-105' : 'hover:bg-white/5 border border-transparent'}`}
                >
                  <span className="text-2xl mb-1">{e.icon}</span>
                  <span className="text-[7px] font-black uppercase text-white/40 tracking-tighter text-center">{e.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`relative transition-all duration-300 ${isPressing ? 'scale-110' : 'scale-100 opacity-40'}`}>
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${progress >= 100 ? 'animate-pulse' : ''}`}>
              <defs>
                <clipPath id="heartFillClip"><rect x="0" y={24 - (progress / 100) * 24} width="24" height="24" className="transition-all duration-100" /></clipPath>
              </defs>
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="white" strokeWidth="0.5" />
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#ff2d55" clipPath="url(#heartFillClip)" className="transition-all duration-100" />
            </svg>
            {isPressing && <div className="absolute inset-0 bg-red-600/30 blur-3xl rounded-full transition-all duration-500" style={{ opacity: progress / 100, transform: `scale(${0.5 + (progress / 100)})` }} />}
          </div>

          {particles.map((p) => (
            <div 
              key={p.id}
              className={`absolute ${
                p.type === 'burst' ? 'animate-heart-burst' : 
                p.type === 'float' ? 'animate-heart-float-bottom' : 
                p.type === 'queue' ? 'animate-heart-logo-formation' :
                p.type === 'pop-ring' ? 'animate-heart-pop-ring' :
                'animate-heart-screen-cover'
              }`}
              style={{
                '--burst-angle': p.angle ? `${p.angle}rad` : '0rad',
                '--burst-velocity': p.velocity ? `${p.velocity}px` : '0px',
                '--float-x': p.xOffset ? `${p.xOffset}px` : '0px',
                '--float-duration': p.duration ? `${p.duration}s` : '2s',
                '--queue-index': p.index ?? 0,
                '--spawn-x': p.xOffset ? `${p.xOffset}px` : '0px',
                '--spawn-y': p.yOffset ? `${p.yOffset}px` : '0px',
                '--target-x': p.targetX ? `${p.targetX}px` : '0px',
                '--target-y': p.targetY ? `${p.targetY}px` : '0px',
                '--curve-x': p.curveX ? `${p.curveX}px` : '0px',
                '--stuck-delay': p.delay ? `${p.delay}s` : '0s',
                '--queue-delay': p.delay ? `${p.delay}s` : '0s',
                '--rotation': `${p.rotation}deg`,
                color: p.color,
                zIndex: p.type === 'stuck' ? 9000 : 100 + (p.index ?? 0),
                position: p.type === 'stuck' ? 'fixed' : 'absolute',
                top: p.type === 'stuck' ? '50%' : undefined, 
                left: p.type === 'stuck' ? '50%' : undefined,
                marginTop: p.type === 'stuck' ? '-60px' : undefined, 
                marginLeft: p.type === 'stuck' ? '-60px' : undefined,
                opacity: logoPopPhase === 'clear' ? 0 : 1,
                transition: logoPopPhase === 'clear' ? 'opacity 0.4s ease-out' : undefined
              } as React.CSSProperties}
            >
              {p.type === 'pop-ring' ? (
                <div className="w-4 h-4 bg-white rounded-full blur-[1px]" />
              ) : (
                <Heart 
                  size={p.type === 'stuck' ? 120 : p.size} 
                  fill="currentColor" 
                  stroke="white" 
                  strokeWidth={p.type === 'stuck' ? "0.1" : "0.5"} 
                />
              )}
            </div>
          ))}
        </div>

        {/* Cinematic Logo Pop Overlay */}
        {logoPopPhase !== 'none' && (
          <div className={`fixed inset-0 z-[9500] flex items-center justify-center pointer-events-none transition-opacity duration-300 ${logoPopPhase === 'clear' ? 'opacity-0' : 'opacity-100'}`}>
             <div className="relative flex flex-col items-center">
                <div className={`flex items-center font-serif italic font-bold text-6xl tracking-tighter text-white transition-all duration-1000 ${logoPopPhase === 'emerge' ? 'animate-logo-emerge' : ''}`}>
                   <span className="drop-shadow-[0_0_25px_rgba(255,255,255,0.6)]">HeartBea</span>
                   <span className={`inline-block transition-all ${
                     logoPopPhase === 'split' ? 'animate-letter-t-spin-split text-white' : 
                     logoPopPhase === 'pop' ? 'scale-[10] opacity-0 blur-xl' : 
                     logoPopPhase === 'clear' ? 'opacity-0' : ''
                   }`}>t</span>
                </div>
                
                {/* Pop burst - visible for a frame */}
                {logoPopPhase === 'pop' && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="w-20 h-20 border-8 border-white rounded-full animate-heart-pop-burst" />
                  </div>
                )}
             </div>
          </div>
        )}

        {showSuccess && (
          <div className="absolute bottom-6 left-0 right-0 flex justify-center animate-in slide-in-from-bottom-8 zoom-in duration-500 z-30">
             <div className="bg-white text-black px-6 py-2 rounded-full font-black uppercase text-[8px] tracking-[4px] shadow-[0_10px_40px_rgba(255,45,85,0.4)] border-2 border-[#ff2d55]">
               {fillCount % 4 === 1 ? 'Explosion!' : fillCount % 4 === 2 ? 'Rising Love' : fillCount % 4 === 3 ? 'Logo Synergy' : 'Unlocking...'}
             </div>
          </div>
        )}
      </div>

      {showTutorial && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setShowTutorial(false)} />
          <div className="relative w-full max-w-sm bg-[#111] border border-white/10 rounded-[3.5rem] p-10 space-y-8 shadow-2xl">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-2xl font-black uppercase italic tracking-tighter text-white">How to connect</h4>
                <p className="text-[10px] font-black text-pink-500 uppercase tracking-[3px] mt-1">Nudge your partner</p>
              </div>
              <button onClick={() => setShowTutorial(false)} className="p-2 bg-white/5 rounded-full text-white/40"><X size={20} /></button>
            </div>
            <div className="space-y-6">
              {[
                { 
                  icon: <ChevronDown size={18} className="text-indigo-400" />, 
                  text: 'Select an Emoji', 
                  desc: 'Tap the selector to pick a vibe that represents your feeling.' 
                },
                { 
                  icon: <Fingerprint size={18} className="text-pink-400" />, 
                  text: 'Hold the Heart', 
                  desc: 'Place your thumb on the heart and wait for it to fill completely.' 
                },
                { 
                  icon: <BellRing size={18} className="text-amber-400" />, 
                  text: 'Remind Your Partner', 
                  desc: 'Once filled, a unique notification based on your emoji is sent instantly.' 
                },
                { 
                  icon: <Sparkles size={18} className="text-white" />, 
                  text: 'Dynamic Messages', 
                  desc: 'Heart ❤️ sends: "I\'m waiting for your love..." and more!' 
                }
              ].map((item, idx) => (
                <div key={idx} className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-2xl bg-white/5 text-white flex items-center justify-center shrink-0 border border-white/10">
                    {item.icon}
                  </div>
                  <div>
                    <h5 className="text-white text-xs font-black uppercase tracking-widest mb-1">{item.text}</h5>
                    <p className="text-white/40 text-[10px] font-medium leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowTutorial(false)} className="w-full py-5 bg-white text-black rounded-3xl font-black uppercase tracking-widest text-xs shadow-xl active:scale-95 transition-all">Got it!</button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes heart-burst-anim {
          0% { transform: translate(0, 0) scale(0.5) rotate(0); opacity: 0; }
          15% { opacity: 1; transform: translate(0, 0) scale(1.6) rotate(45deg); }
          100% { transform: translate(calc(cos(var(--burst-angle)) * var(--burst-velocity)), calc(sin(var(--burst-angle)) * var(--burst-velocity))) scale(0.1) rotate(360deg); opacity: 0; }
        }
        @keyframes heart-float-bottom-anim {
          0% { transform: translate(var(--float-x), 220px) scale(0.5); opacity: 0; }
          20% { opacity: 1; transform: translate(calc(var(--float-x) + 10px), 160px) scale(1.1); }
          100% { transform: translate(calc(var(--float-x) - 20px), -240px) scale(0.8) rotate(180deg); opacity: 0; }
        }
        @keyframes heart-logo-formation-anim {
          0% { transform: translate(var(--spawn-x), var(--spawn-y)) scale(0) rotate(0); opacity: 0; }
          8% { opacity: 1; transform: translate(var(--spawn-x), var(--spawn-y)) scale(1.4) rotate(15deg); }
          25% { transform: translate(var(--target-x), var(--target-y)) scale(1.4) rotate(0deg); opacity: 1; }
          40% { transform: translate(var(--target-x), var(--target-y)) scale(1.5) rotate(-5deg); opacity: 1; }
          60% { transform: translate(var(--curve-x), calc(120px - var(--queue-index) * 22px)) scale(1.1); opacity: 1; }
          75% { transform: translate(var(--curve-x), calc(120px - var(--queue-index) * 22px)) scale(1.15) rotate(10deg); opacity: 1; }
          100% { transform: translate(-220px, -640px) scale(0.1) rotate(-240deg); opacity: 0; }
        }
        @keyframes heart-screen-cover-anim {
          0% { transform: scale(0) rotate(0); opacity: 0; }
          10% { transform: scale(1) rotate(0); opacity: 1; }
          40% { transform: scale(35) rotate(10deg); opacity: 1; }
          70% { transform: scale(150) rotate(-10deg); opacity: 1; }
          100% { transform: scale(280) rotate(0); opacity: 1; }
        }
        @keyframes heart-pop-ring-anim {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(calc(cos(var(--burst-angle)) * var(--burst-velocity)), calc(sin(var(--burst-angle)) * var(--burst-velocity))) scale(0); opacity: 0; }
        }

        /* Cinematic Overlays */
        @keyframes logo-emerge {
          0% { opacity: 0; transform: translateY(30px) scale(0.7); filter: blur(20px); }
          100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0); }
        }
        @keyframes letter-t-spin-split {
          0% { transform: translate(0, 0) rotate(0); }
          40% { transform: translate(0, 0) rotate(360deg) scale(1.2); }
          100% { transform: translate(20px, -150px) scale(8) rotate(1080deg); opacity: 0; }
        }
        @keyframes heart-pop-burst {
          0% { transform: scale(0); opacity: 1; border-width: 20px; }
          100% { transform: scale(40); opacity: 0; border-width: 0.1px; }
        }

        .animate-heart-burst { animation: heart-burst-anim 1.2s cubic-bezier(0.1, 0.8, 0.2, 1) forwards; }
        .animate-heart-float-bottom { animation: heart-float-bottom-anim var(--float-duration) ease-out forwards; }
        .animate-heart-logo-formation { animation: heart-logo-formation-anim 6.5s cubic-bezier(0.4, 0, 0.2, 1) var(--queue-delay) forwards; }
        .animate-heart-screen-cover { animation: heart-screen-cover-anim 6.0s cubic-bezier(0.6, 0, 0.4, 1) var(--stuck-delay) forwards; }
        .animate-heart-pop-ring { animation: heart-pop-ring-anim 0.8s cubic-bezier(0.1, 0.8, 0.2, 1) forwards; }
        
        .animate-logo-emerge { animation: logo-emerge 2.0s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .animate-letter-t-spin-split { animation: letter-t-spin-split 1.5s cubic-bezier(0.55, 0.055, 0.675, 0.19) forwards; }
        .animate-heart-pop-burst { animation: heart-pop-burst 0.8s ease-out forwards; }
      `}</style>
    </section>
  );
};

export default ThumbKiss;
