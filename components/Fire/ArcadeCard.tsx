
import React from 'react';
import { Game } from '../../types';
import { Lock, Play, Swords, Heart, ArrowUp, ArrowRight } from 'lucide-react';

interface ArcadeCardProps {
  game: Game;
  onClick: () => void;
}

// Updated Reusable Striker Logo (White Flower Design)
const StrikerLogo = ({ size = 24 }: { size?: number }) => (
  <div 
    style={{ width: size, height: size }} 
    className="rounded-full bg-gradient-to-br from-white via-[#f8f8f8] to-[#e0e0e0] border-[1px] border-black/10 shadow-lg flex items-center justify-center relative overflow-hidden ring-1 ring-white/50"
  >
    {/* Subtle Surface Polish */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,1)_0%,transparent_70%)] opacity-80" />
    
    {/* Flower Pattern (8-point symmetry) */}
    <div className="relative w-[70%] h-[70%] flex items-center justify-center opacity-70">
       <div className="absolute w-[15%] h-[15%] rounded-full bg-red-900/40" />
       {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
         <div 
           key={angle} 
           className="absolute w-[40%] h-[1.5px] bg-red-900/30 rounded-full origin-left left-1/2"
           style={{ transform: `rotate(${angle}deg)` }}
         />
       ))}
       <div className="absolute w-full h-full border-[0.5px] border-red-900/20 rounded-full" />
       <div className="absolute w-[60%] h-[60%] border-[0.5px] border-red-900/15 rounded-full" />
    </div>
    
    {/* Outer Grip Lines */}
    <div className="absolute inset-0 border-[3px] border-transparent border-t-black/5 rounded-full" />
  </div>
);

const ArcadeCard: React.FC<ArcadeCardProps> = ({ game, onClick }) => {
  const getIcon = () => {
    if (game.id === 'draw-duel') return <Swords size={24} className="text-[#ff9d6b]" />;
    if (game.id === 'carrom') return <StrikerLogo size={32} />;
    if (game.id === 'arrow-out') return (
        <div className="relative w-8 h-8 flex items-center justify-center">
            <ArrowUp size={28} className="text-white absolute -top-1" strokeWidth={3} />
            <ArrowRight size={20} className="text-white/30 absolute -right-2 top-1" strokeWidth={2} />
        </div>
    );
    if (game.id === 'perfect-pair') return <div className="flex -space-x-1.5"><Heart size={16} fill="#69f0ff" className="text-[#69f0ff]" /><Heart size={16} fill="#69f0ff" className="text-[#69f0ff]" /></div>;
    return <span className="text-xl">{game.icon}</span>;
  };

  return (
    <div 
      onClick={onClick}
      className={`w-full h-[170px] rounded-[1.8rem] p-4 bg-gradient-to-br ${game.color} relative cursor-pointer active:scale-95 transition-all duration-200 overflow-hidden shadow-xl border border-white/10`}
    >
      <div className="absolute top-3 left-4">
        {game.locked ? <Lock size={12} className="text-white/40" /> : null}
      </div>
      
      <div className="absolute top-3 right-3 flex items-center space-x-1 bg-white/20 backdrop-blur-md rounded-full px-2 py-0.5">
        <span className="text-[7px] font-black uppercase tracking-widest leading-none">
            🥸 Play
        </span>
      </div>

      <div className="mt-8 mb-2">
        {getIcon()}
      </div>

      <div className="space-y-0.5">
        <h4 className="text-xs font-black leading-tight text-white uppercase tracking-tight truncate">{game.title}</h4>
        <p className="text-[9px] text-white font-bold leading-tight opacity-80 line-clamp-2 min-h-[20px]">
          {game.description}
        </p>
      </div>
    </div>
  );
};

export default ArcadeCard;
