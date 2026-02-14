
import React, { useState } from 'react';
import { Game } from '../types';
import ArcadeCard from './Fire/ArcadeCard';
import { Gamepad2, Sparkles, Flame, Trophy } from 'lucide-react';

interface ArcadeTabProps {
  onSelectGame: (game: Game) => void;
  theme: 'light' | 'dark';
  userProfile: { name: string; avatar: string };
}

const ArcadeTab: React.FC<ArcadeTabProps> = ({ onSelectGame, theme, userProfile }) => {
  const [filter, setFilter] = useState<'all' | 'strategy' | 'action'>('all');
  const isLight = theme === 'light';

  const games: Game[] = [
    { id: 'draw-duel', title: 'draw duel', description: 'Draw to guess challenge.', icon: '⚔️', color: 'from-[#ff6d1e] to-[#ff5d00]', locked: false },
    { id: 'tic-tac-toe', title: 'tic tac toe', description: 'Classic strategy game.', icon: '⭕', color: 'from-purple-500 to-purple-600', locked: false },
    { id: 'maze-run', title: 'maze run', description: 'Escape the labyrinth.', icon: '🌀', color: 'from-cyan-500 to-blue-600', locked: false },
    { id: 'arrow-out', title: 'arrow out', description: 'Solve the direction puzzle.', icon: '🏹', color: 'from-indigo-600 to-violet-700', locked: false },
    { id: 'carrom', title: 'carrom pro', description: 'Strike the coins.', icon: '🎱', color: 'from-amber-600 to-amber-700', locked: false },
    { id: 'archery', title: 'archery king', description: 'Aim for the bullseye.', icon: '🏹', color: 'from-teal-500 to-teal-600', locked: false },
    { id: 'pool-pro', title: 'pool pro', description: 'Master the table.', icon: '🎱', color: 'from-slate-700 to-slate-900', locked: false },
    { id: 'word-search', title: 'word search', description: 'Find the hidden letters.', icon: '🔍', color: 'from-rose-500 to-rose-600', locked: false },
  ];

  return (
    <div className="space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Room */}
      <div className="flex justify-between items-end px-1">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <Gamepad2 size={16} className={isLight ? 'text-pink-500' : 'text-indigo-400'} />
            <span className={`text-[10px] font-black uppercase tracking-[4px] ${isLight ? 'text-pink-600' : 'text-white/40'}`}>Game Center</span>
          </div>
          <h2 className={`text-3xl font-black italic tracking-tighter uppercase ${isLight ? 'text-slate-800' : 'text-white'}`}>Arcade</h2>
        </div>
      </div>

      {/* Featured Block */}
      <section className="relative">
         <div className={`rounded-[2.5rem] p-8 overflow-hidden relative border transition-all duration-500 shadow-2xl ${
           isLight ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-white/10'
         }`}>
            <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 scale-150">
               <Flame size={120} fill="currentColor" />
            </div>
            <div className="relative z-10 space-y-4">
               <div className="flex items-center space-x-2 bg-black/20 backdrop-blur-md w-fit px-3 py-1 rounded-full border border-white/10">
                  <Sparkles size={12} fill="white" />
                  <span className="text-[9px] font-black uppercase tracking-widest">New Release</span>
               </div>
               <div>
                  <h3 className="text-2xl font-black italic uppercase leading-none">Arrow Out</h3>
                  <p className="text-xs opacity-70 mt-2 font-medium max-w-[180px]">Challenge your brain with the ultimate direction-based puzzle.</p>
               </div>
               <button 
                onClick={() => onSelectGame(games.find(g => g.id === 'arrow-out')!)}
                className={`px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl active:scale-95 transition-all ${
                  isLight ? 'bg-white text-indigo-600' : 'bg-white text-black'
                }`}
               >
                 Play Now
               </button>
            </div>
         </div>
      </section>

      {/* Grid of Games */}
      <section className="space-y-4">
          <div className="flex justify-between items-center px-1">
             <div className="flex space-x-4">
                <button 
                  onClick={() => setFilter('all')}
                  className={`text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'all' ? (isLight ? 'text-indigo-600' : 'text-white border-b-2 border-indigo-500') : 'text-white/20'}`}
                >
                  All
                </button>
                <button 
                  onClick={() => setFilter('strategy')}
                  className={`text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'strategy' ? (isLight ? 'text-indigo-600' : 'text-white border-b-2 border-indigo-500') : 'text-white/20'}`}
                >
                  Strategy
                </button>
                <button 
                  onClick={() => setFilter('action')}
                  className={`text-[10px] font-black uppercase tracking-widest transition-all ${filter === 'action' ? (isLight ? 'text-indigo-600' : 'text-white border-b-2 border-indigo-500') : 'text-white/20'}`}
                >
                  Action
                </button>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {games.map(game => (
              <ArcadeCard key={game.id} game={game} onClick={() => onSelectGame(game)} />
            ))}
          </div>
      </section>

      <div className="px-1 text-center py-4 opacity-10">
        <p className="text-[9px] font-black uppercase tracking-[6px]">Powered by HeartBeat Arcade v2</p>
      </div>
    </div>
  );
};

export default ArcadeTab;
