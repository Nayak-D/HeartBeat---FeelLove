
import React, { useState } from 'react';
import { Track, Friend } from '../types';
import MusicSection from './Fire/MusicSection';
import { Music, Radio, Disc, UserPlus, Heart, Sparkles, Zap, MapPin, HandMetal } from 'lucide-react';

interface PeopleTabProps {
  userProfile: { name: string; avatar: string };
}

const PeopleTab: React.FC<PeopleTabProps> = ({ userProfile }) => {
  const [wavingAt, setWavingAt] = useState<Set<string>>(new Set());

  const discoveryPeople: Friend[] = [
    { id: 'u1', name: 'Aria', avatar: 'https://i.pravatar.cc/150?u=aria', status: 'online', lastSeen: 'Active now', bio: 'Music lover & gamer' },
    { id: 'u2', name: 'Leo', avatar: 'https://i.pravatar.cc/150?u=leo', status: 'online', lastSeen: 'Active now', bio: 'Let\'s play Tic Tac Toe!' },
    { id: 'u3', name: 'Mila', avatar: 'https://i.pravatar.cc/150?u=mila', status: 'busy', lastSeen: 'Streaming', bio: 'Finding the vibe.' },
    { id: 'u4', name: 'Zane', avatar: 'https://i.pravatar.cc/150?u=zane', status: 'online', lastSeen: 'Active now', bio: 'Heartbeat explorer.' },
  ];

  const tracks: Track[] = [
    { id: 'p1', title: 'Starboy', artist: 'The Weeknd', youtubeId: '34Na4j8AVgA', cover: 'https://img.youtube.com/vi/34Na4j8AVgA/mqdefault.jpg' },
    { id: 'p2', title: 'Peaches', artist: 'Justin Bieber', youtubeId: 'tQ0yjYUFKAE', cover: 'https://img.youtube.com/vi/tQ0yjYUFKAE/mqdefault.jpg' },
  ];

  const handleWave = (id: string) => {
    if (wavingAt.has(id)) return;
    const next = new Set(wavingAt);
    next.add(id);
    setWavingAt(next);
    if (navigator.vibrate) navigator.vibrate([10, 40]);
  };

  return (
    <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Dynamic Header */}
      <div className="flex justify-between items-center px-1">
        <div>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">Social Hub</h2>
          <div className="flex items-center space-x-2 mt-1">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]" />
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[3px]">4.2K Online</p>
          </div>
        </div>
        <div className="flex -space-x-3">
           {[1, 2, 3].map(i => (
             <img 
               key={i}
               src={`https://i.pravatar.cc/100?u=active${i}`} 
               className="w-10 h-10 rounded-2xl border-2 border-black ring-1 ring-white/10" 
               alt="Active User" 
             />
           ))}
           <div className="w-10 h-10 rounded-2xl bg-indigo-500 flex items-center justify-center border-2 border-black text-[9px] font-black shadow-xl">+12</div>
        </div>
      </div>

      {/* Discover Section */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xs font-black uppercase tracking-[4px] text-indigo-400">Discover Friends</h3>
          <Zap size={14} className="text-amber-400 animate-bounce" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
           {discoveryPeople.map(person => (
             <div key={person.id} className="bg-white/5 border border-white/10 rounded-[2.5rem] p-5 space-y-4 transition-all hover:bg-white/[0.08] hover:border-white/20 group">
                <div className="relative">
                  <img src={person.avatar} className="w-16 h-16 rounded-[1.8rem] object-cover mx-auto shadow-2xl border border-white/10" alt="" />
                  <div className={`absolute bottom-0 right-1/2 translate-x-4 w-4 h-4 rounded-full border-4 border-black ${person.status === 'online' ? 'bg-green-500' : 'bg-amber-500'}`} />
                </div>
                <div className="text-center">
                  <h4 className="font-black text-sm uppercase tracking-tight text-white mb-1">{person.name}</h4>
                  <p className="text-[9px] text-white/30 font-medium line-clamp-1 italic">"{person.bio}"</p>
                </div>
                <button 
                  onClick={() => handleWave(person.id)}
                  className={`w-full py-3 rounded-2xl font-black uppercase text-[8px] tracking-widest transition-all flex items-center justify-center space-x-2 ${
                    wavingAt.has(person.id) ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white text-black active:scale-95'
                  }`}
                >
                  {wavingAt.has(person.id) ? (
                    <Sparkles size={12} fill="currentColor" />
                  ) : (
                    <HandMetal size={12} fill="currentColor" />
                  )}
                  <span>{wavingAt.has(person.id) ? 'Waved!' : 'Wave'}</span>
                </button>
             </div>
           ))}
        </div>
      </section>

      {/* Synchronized Experience Card */}
      <div className="relative h-48 rounded-[3rem] overflow-hidden group border border-white/5 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/40 via-purple-600/20 to-transparent z-0" />
        <div className="absolute top-0 right-0 p-8 opacity-20 z-0">
          <Disc size={160} className="animate-[spin_12s_linear_infinite]" />
        </div>
        
        <div className="relative z-10 p-8 flex flex-col h-full justify-center">
          <div className="flex items-center space-x-2 mb-2">
            <Radio size={14} className="text-indigo-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Live Together</span>
          </div>
          <h3 className="text-3xl font-black italic uppercase text-white leading-none tracking-tighter">The Pulse</h3>
          <p className="text-xs text-white/50 mt-3 font-medium max-w-[200px]">Synchronize your heartbeat and music with people worldwide.</p>
        </div>
      </div>

      {/* Global Music */}
      <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
        <MusicSection tracks={tracks} />
      </div>

      <div className="px-1 text-center py-6 opacity-20">
        <p className="text-[10px] font-black text-white uppercase tracking-[6px]">Connect. Share. Play.</p>
      </div>
    </div>
  );
};

export default PeopleTab;
