import React from 'react';
import { Track } from '../types';
import MusicSection from './Fire/MusicSection';
import { Radio, Disc } from 'lucide-react';

interface PeopleTabProps {
  userProfile: { name: string; avatar: string };
}

const PeopleTab: React.FC<PeopleTabProps> = ({ userProfile }) => {
  const tracks: Track[] = [
    { id: 'p1', title: 'Starboy', artist: 'The Weeknd', youtubeId: '34Na4j8AVgA', cover: 'https://img.youtube.com/vi/34Na4j8AVgA/mqdefault.jpg' },
    { id: 'p2', title: 'Peaches', artist: 'Justin Bieber', youtubeId: 'tQ0yjYUFKAE', cover: 'https://img.youtube.com/vi/tQ0yjYUFKAE/mqdefault.jpg' },
    { id: 'p3', title: 'Blinding Lights', artist: 'The Weeknd', youtubeId: '4NRXx6U8ABQ', cover: 'https://img.youtube.com/vi/4NRXx6U8ABQ/mqdefault.jpg' },
  ];

  return (
    <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Synchronized Experience Card (The Pulse) */}
      <div className="relative h-56 rounded-[3rem] overflow-hidden group border border-white/5 shadow-2xl bg-gradient-to-br from-[#1a1a2e] to-[#0a0a1a]">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-900/40 to-transparent z-0" />
        
        {/* Large Decorative Vinyl/Disc */}
        <div className="absolute -right-12 -bottom-12 opacity-20 z-0">
          <div className="relative flex items-center justify-center">
             <Disc size={280} className="text-white animate-[spin_20s_linear_infinite]" />
             <div className="absolute w-12 h-12 bg-black rounded-full border-4 border-white/10" />
          </div>
        </div>
        
        <div className="relative z-10 p-10 flex flex-col h-full justify-center">
          <div className="flex items-center space-x-2 mb-3">
            <Radio size={16} className="text-indigo-400 animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-widest text-indigo-300">Live Together</span>
          </div>
          <h3 className="text-4xl font-black italic uppercase text-white leading-none tracking-tighter">The Pulse</h3>
          <p className="text-sm text-white/50 mt-4 font-medium max-w-[220px] leading-relaxed">
            Synchronize your heartbeat and music with your love.
          </p>
        </div>
      </div>

      {/* Music Lounge Section */}
      <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
        <MusicSection tracks={tracks} />
      </div>

      <div className="px-1 text-center py-6 opacity-20">
        <p className="text-[10px] font-black text-white uppercase tracking-[6px]">Sync. Listen. Feel.</p>
      </div>
    </div>
  );
};

export default PeopleTab;