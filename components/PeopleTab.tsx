
import React from 'react';
import { Track } from '../types';
import MusicSection from './Fire/MusicSection';
import { Music, Radio, Disc } from 'lucide-react';

// Define the props interface to match the usage in App.tsx
interface PeopleTabProps {
  userProfile: { name: string; avatar: string };
}

const PeopleTab: React.FC<PeopleTabProps> = ({ userProfile }) => {
  // Sample tracks for the People dashboard music lounge
  const tracks: Track[] = [
    { id: 'p1', title: 'Starboy', artist: 'The Weeknd', youtubeId: '34Na4j8AVgA', cover: 'https://img.youtube.com/vi/34Na4j8AVgA/mqdefault.jpg' },
    { id: 'p2', title: 'Peaches', artist: 'Justin Bieber', youtubeId: 'tQ0yjYUFKAE', cover: 'https://img.youtube.com/vi/tQ0yjYUFKAE/mqdefault.jpg' },
    { id: 'p3', title: 'Cruel Summer', artist: 'Taylor Swift', youtubeId: 'ic8j13piAhQ', cover: 'https://img.youtube.com/vi/ic8j13piAhQ/mqdefault.jpg' },
    { id: 'p4', title: 'As It Was', artist: 'Harry Styles', youtubeId: 'H5v3kku4y6Q', cover: 'https://img.youtube.com/vi/H5v3kku4y6Q/mqdefault.jpg' },
  ];

  return (
    <div className="space-y-8 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Refined Header for the Hub */}
      <div className="flex justify-between items-center px-1">
        <div>
          <h2 className="text-3xl font-black italic tracking-tighter uppercase text-white">Hub</h2>
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[3px]">Global Music Lounge</p>
        </div>
        <div className="flex -space-x-2">
           {[1, 2, 3].map(i => (
             <img 
               key={i}
               src={`https://i.pravatar.cc/100?u=user${i}`} 
               className="w-8 h-8 rounded-full border-2 border-black ring-2 ring-indigo-500/20" 
               alt="Active User" 
             />
           ))}
           <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center border-2 border-black text-[8px] font-black">+12</div>
        </div>
      </div>

      {/* Hero Interactive Card */}
      <div className="relative h-44 rounded-[2.5rem] overflow-hidden group border border-white/5 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent z-0" />
        <div className="absolute top-0 right-0 p-8 opacity-20 z-0">
          <Disc size={120} className="animate-[spin_8s_linear_infinite]" />
        </div>
        
        <div className="relative z-10 p-8 flex flex-col h-full justify-center">
          <div className="flex items-center space-x-2 mb-2">
            <Radio size={14} className="text-indigo-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">Listening Now</span>
          </div>
          <h3 className="text-2xl font-black italic uppercase text-white leading-none">The Collective</h3>
          <p className="text-xs text-white/40 mt-2 font-medium max-w-[180px]">Join the synchronized stream with friends around the globe.</p>
        </div>
      </div>

      {/* The Music Section */}
      <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
        <MusicSection tracks={tracks} />
      </div>

      <div className="px-1 text-center py-4">
        <p className="text-[9px] font-black text-white/10 uppercase tracking-[5px]">Experience the heartbeat of sound</p>
      </div>
    </div>
  );
};

export default PeopleTab;
