import React, { useState, useEffect, useRef } from 'react';
import { X, Trophy, RefreshCw, UserPlus } from 'lucide-react';

interface CarRaceProps {
  onClose?: () => void;
}

const CarRace: React.FC<CarRaceProps> = ({ onClose }) => {
  const [carPosition, setCarPosition] = useState(1); // 0: left, 1: center, 2: right
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [obstacles, setObstacles] = useState<{ id: number; pos: number; top: number }[]>([]);
  
  const requestRef = useRef<number>(0);

  const spawnObstacle = () => {
    setObstacles(prev => [...prev, { id: Date.now(), pos: Math.floor(Math.random() * 3), top: -10 }]);
  };

  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(spawnObstacle, 1200);
    return () => clearInterval(interval);
  }, [gameOver]);

  useEffect(() => {
    const moveObstacles = () => {
      setObstacles(prev => {
        const next = prev.map(o => ({ ...o, top: o.top + 0.8 })); // Using % increments
        
        // Collision check at roughly 75% height
        const hit = next.find(o => o.top > 70 && o.top < 85 && o.pos === carPosition);
        if (hit) {
            setGameOver(true);
            return next;
        }

        const filtered = next.filter(o => {
            if (o.top > 100) {
                setScore(s => s + 10);
                return false;
            }
            return true;
        });
        return filtered;
      });
      requestRef.current = requestAnimationFrame(moveObstacles);
    };

    requestRef.current = requestAnimationFrame(moveObstacles);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [carPosition, gameOver]);

  return (
    <div className="relative w-full h-full bg-[#050505] overflow-hidden flex flex-col pt-12">
      {/* FIXED BRANDING HEADER */}
      <div className="w-full flex items-center justify-between mb-8 px-6 z-30 relative shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-[#0f111a] flex items-center justify-center border border-[#1e2235] shadow-2xl ring-1 ring-white/5">
             <span className="text-2xl">🏎️</span>
          </div>
          <div className="flex flex-col text-left">
            <h2 className="text-sm font-black uppercase tracking-[3px] text-white leading-none">Car Race</h2>
            <div className="flex items-center space-x-1.5 mt-1.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></div>
              <span className="text-[8px] text-white/30 font-black uppercase tracking-widest">Live Arena</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2.5">
          <button className="w-11 h-11 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all active:scale-95 group flex items-center justify-center shadow-lg">
            <UserPlus size={18} className="text-white/40 group-hover:text-white transition-colors" />
          </button>
          <button 
            onClick={onClose}
            className="h-11 px-5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all active:scale-95 group shadow-lg flex items-center"
          >
            <span className="text-[9px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">Quit</span>
          </button>
        </div>
      </div>

      {/* Road Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 flex justify-around border-x border-white/5">
            <div className="w-[1px] h-full bg-white/5" />
            <div className="w-[1px] h-full bg-white/5" />
        </div>
        <div className="absolute inset-0 animate-[road-lines_0.8s_linear_infinite]" style={{
            backgroundImage: 'linear-gradient(to bottom, transparent 50%, rgba(255,255,255,0.03) 50%)',
            backgroundSize: '100% 15%'
        }}></div>
      </div>

      {/* HUD Overlay - Centered */}
      <div className="absolute top-[160px] inset-x-0 flex justify-center z-20">
         <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl px-6 py-2 shadow-2xl">
            <span className="text-[10px] font-black uppercase text-white/40 tracking-[3px] block mb-0.5 text-center">Score</span>
            <span className="text-3xl font-black italic text-white tracking-tighter">{score}</span>
         </div>
      </div>
      
      {/* Obstacles Layer */}
      {obstacles.map(obs => (
        <div 
            key={obs.id}
            className="absolute transition-all duration-75 flex items-center justify-center text-4xl"
            style={{ 
                top: `${obs.top}%`, 
                left: `${obs.pos * 33.33}%`,
                width: '33.33%'
            }}
        >
            <div className="w-14 h-14 bg-gradient-to-br from-red-500/80 to-red-700/80 rounded-2xl shadow-xl flex items-center justify-center text-2xl border border-red-400/20">
                🚧
            </div>
        </div>
      ))}

      {/* Player Car Layer */}
      <div 
        className="absolute bottom-[20%] text-6xl transition-all duration-150 ease-out z-20"
        style={{ 
            left: `${carPosition * 33.33}%`,
            width: '33.33%',
            textAlign: 'center'
        }}
      >
        <div className="relative inline-block scale-110 drop-shadow-[0_0_20px_rgba(59,130,246,0.3)]">
            🏎️
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-2 bg-blue-500/30 blur-md rounded-full" />
        </div>
      </div>

      {/* Responsive Touch Controls */}
      <div className="absolute bottom-10 inset-x-0 flex justify-around px-8 z-30">
        <button 
            onPointerDown={() => setCarPosition(p => Math.max(0, p - 1))}
            className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-3xl text-white active:bg-white/20 active:scale-90 transition-all border border-white/20 shadow-2xl"
        >
            ←
        </button>
        <button 
            onPointerDown={() => setCarPosition(p => Math.min(2, p + 1))}
            className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-3xl text-white active:bg-white/20 active:scale-90 transition-all border border-white/20 shadow-2xl"
        >
            →
        </button>
      </div>

      {/* Game Over Modal */}
      {gameOver && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center z-50 p-10 animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-red-500 rounded-[1.8rem] flex items-center justify-center mb-8 shadow-2xl shadow-red-500/30">
                <X size={40} className="text-white" />
            </div>
            <h3 className="text-4xl font-black text-white mb-2 italic tracking-tighter uppercase">Wrecked</h3>
            <p className="text-[10px] font-black text-white/30 mb-12 uppercase tracking-[5px]">Points Earned: {score}</p>
            <button 
                onClick={() => {setGameOver(false); setScore(0); setObstacles([]); setCarPosition(1);}}
                className="w-full max-w-xs bg-white text-black py-5 rounded-[1.5rem] font-black uppercase tracking-widest active:scale-95 transition-all shadow-2xl text-xs flex items-center justify-center space-x-3"
            >
                <RefreshCw size={16} />
                <span>Restart Race</span>
            </button>
        </div>
      )}

      <style>{`
        @keyframes road-lines {
            from { background-position: 0 0; }
            to { background-position: 0 100%; }
        }
      `}</style>
    </div>
  );
};

export default CarRace;