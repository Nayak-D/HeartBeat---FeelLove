
import React, { useState, useMemo } from 'react';
import { MapPin, Navigation, Zap, Heart, Sparkles } from 'lucide-react';

interface DistanceTrackerProps {
  theme: 'light' | 'dark';
  userAvatar: string;
  partner: { name: string; avatar: string; code: string } | null;
}

const PawIcon = ({ color, size = 10, className = "" }: { color: string, size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} className={className}>
    <circle cx="12" cy="16" r="6" />
    <circle cx="5" cy="8" r="3.5" />
    <circle cx="11" cy="4" r="3.5" />
    <circle cx="19" cy="7" r="3.5" />
  </svg>
);

const DistanceTracker: React.FC<DistanceTrackerProps> = ({ theme, userAvatar, partner }) => {
  const [distance] = useState(4.2);
  const [isPinging, setIsPinging] = useState(false);
  const isLight = theme === 'light';

  const handlePing = () => {
    if (isPinging) return;
    setIsPinging(true);
    if (navigator.vibrate) navigator.vibrate([20, 60, 20]);
    setTimeout(() => setIsPinging(false), 2400);
  };

  // SVG S-Curve Path Math
  const svgWidth = 300;
  const svgHeight = 120;
  const startX = 45;
  const startY = 60;
  const endX = 255;
  const endY = 60;
  const cp1x = 120, cp1y = -20; // Arches high
  const cp2x = 180, cp2y = 140; // Dips low
  
  const pathD = `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`;

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex justify-between items-center px-1">
        <h3 className={`text-xl font-black italic tracking-tighter uppercase ${isLight ? 'text-pink-600' : 'text-white'}`}>Cuddle Track</h3>
        <div className="flex items-center space-x-2 bg-pink-500/10 px-2 py-1 rounded-lg">
            <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500"></span>
            </span>
            <span className="text-[8px] font-black uppercase tracking-widest text-pink-500">Syncing Hearts</span>
        </div>
      </div>

      <div className={`rounded-[3rem] p-6 border transition-all duration-500 shadow-2xl overflow-hidden relative ${
        isLight ? 'bg-white border-pink-50 shadow-pink-100' : 'bg-white/5 border-white/5 shadow-black/40'
      }`}>
        
        {/* Connection Layer */}
        <div className="relative h-32 mb-4">
            {/* SVG S-Curve Path */}
            <svg 
              viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
              className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
              preserveAspectRatio="none"
            >
                <defs>
                    <linearGradient id="cuteGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6366f1" />
                        <stop offset="50%" stopColor="#ff2d55" />
                        <stop offset="100%" stopColor="#ffb6c1" />
                    </linearGradient>
                    <filter id="cuteGlow">
                        <feGaussianBlur stdDeviation="3" result="blur"/>
                        <feMerge>
                            <feMergeNode in="blur"/>
                            <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                    </filter>
                </defs>
                
                {/* Path Background */}
                <path 
                  d={pathD}
                  fill="none" 
                  stroke={isLight ? "rgba(255,182,193,0.15)" : "rgba(255,255,255,0.05)"}
                  strokeWidth="8"
                  strokeLinecap="round"
                />

                {/* The Dotted/Paw Trail */}
                <path 
                  d={pathD}
                  fill="none" 
                  stroke="url(#cuteGradient)"
                  strokeWidth="3"
                  strokeDasharray="0, 12"
                  strokeLinecap="round"
                  className="animate-flow-paws"
                  filter="url(#cuteGlow)"
                />

                {/* Travelling Paws */}
                {[0, 0.25, 0.5, 0.75].map((delay, i) => (
                    <g key={i} className="animate-paw-travel" style={{ animationDelay: `${delay * 3}s` }}>
                        <PawIcon color="#ff2d55" size={14} className="opacity-80" />
                    </g>
                ))}

                {/* Love Blast on Ping */}
                {isPinging && (
                  <path 
                    d={pathD}
                    fill="none" 
                    stroke="white"
                    strokeWidth="6"
                    strokeLinecap="round"
                    className="animate-ping-burst"
                  />
                )}
            </svg>

            {/* Avatar Me */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 z-10 group cursor-pointer">
                <div className={`w-20 h-20 rounded-[2.2rem] overflow-hidden border-4 transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${isLight ? 'border-white shadow-xl shadow-indigo-100' : 'border-white/10 shadow-2xl'}`}>
                    <img src={userAvatar} className="w-full h-full object-cover" alt="Me" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-indigo-500 p-2 rounded-2xl border-2 border-white shadow-lg">
                    <Sparkles size={12} className="text-white fill-current" />
                </div>
            </div>

            {/* Distance Overlay */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                <div className={`px-4 py-2 rounded-full border shadow-2xl transition-all duration-500 ${isLight ? 'bg-white/80 border-pink-100 text-pink-600 backdrop-blur-md' : 'bg-black/90 border-white/10 text-white'}`}>
                    <div className="flex flex-col items-center">
                        <span className="text-sm font-black italic tracking-tighter">{distance} km</span>
                        <span className="text-[7px] font-black uppercase tracking-widest opacity-50">Apart</span>
                    </div>
                </div>
            </div>

            {/* Avatar Partner */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 z-10 group cursor-pointer">
                <div className={`w-20 h-20 rounded-[2.2rem] overflow-hidden border-4 transition-all duration-500 group-hover:scale-110 group-hover:-rotate-6 ${isLight ? 'border-white shadow-xl shadow-pink-100' : 'border-white/10 shadow-2xl'}`}>
                    <img src={partner?.avatar || "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=200&h=200&fit=crop"} className="w-full h-full object-cover" alt="Partner" />
                </div>
                <div className="absolute -bottom-1 -left-1 bg-[#ff2d55] p-2 rounded-2xl border-2 border-white shadow-lg">
                    <Heart size={12} className="text-white fill-current" />
                </div>
            </div>
        </div>

        {/* Footer Info & Actions */}
        <div className={`mt-4 pt-6 border-t flex items-center justify-between transition-colors ${isLight ? 'border-pink-50' : 'border-white/5'}`}>
           <div className="flex flex-col">
              <span className={`text-[9px] font-black uppercase tracking-[2px] ${isLight ? 'text-pink-300' : 'opacity-20'}`}>Daily Status</span>
              <div className="flex items-center space-x-1.5">
                 <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
                 <span className={`text-[10px] font-black italic uppercase ${isLight ? 'text-slate-500' : 'text-white'}`}>Wagging Tails</span>
              </div>
           </div>
           
           <button 
             onClick={handlePing}
             className={`group flex items-center space-x-3 px-6 py-3 rounded-[1.5rem] font-black uppercase tracking-widest text-[9px] transition-all active:scale-95 shadow-xl ${
               isLight ? 'bg-indigo-600 text-white shadow-indigo-100' : 'bg-white text-black shadow-white/5'
             }`}
           >
             <div className={isPinging ? 'animate-bounce' : 'group-hover:scale-110 transition-transform'}>
                <PawIcon color={isLight ? 'white' : 'black'} size={14} />
             </div>
             <span>{isPinging ? 'Nudging...' : 'Send Nudge'}</span>
           </button>
        </div>
      </div>

      <style>{`
        @keyframes flow-paws-anim {
          from { stroke-dashoffset: 24; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes ping-burst-anim {
          0% { stroke-dasharray: 0 1000; opacity: 0; }
          10% { opacity: 1; }
          50% { stroke-dasharray: 150 1000; }
          100% { stroke-dasharray: 1000 0; opacity: 0; stroke-dashoffset: -500; }
        }
        @keyframes paw-travel-anim {
           0% { offset-distance: 0%; opacity: 0; }
           10% { opacity: 1; }
           90% { opacity: 1; }
           100% { offset-distance: 100%; opacity: 0; }
        }
        .animate-flow-paws {
          animation: flow-paws-anim 3s linear infinite;
        }
        .animate-ping-burst {
          animation: ping-burst-anim 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .animate-paw-travel {
           offset-path: path('${pathD}');
           animation: paw-travel-anim 3s linear infinite;
           position: absolute;
        }
      `}</style>
    </div>
  );
};

export default DistanceTracker;
