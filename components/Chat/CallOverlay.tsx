import React, { useEffect, useState } from 'react';
import { PhoneOff, Mic, MicOff, Video, VideoOff, Volume2 } from 'lucide-react';

interface CallOverlayProps {
  type: 'voice' | 'video';
  name: string;
  onEnd: () => void;
}

const CallOverlay: React.FC<CallOverlayProps> = ({ type, name, onEnd }) => {
  const [muted, setMuted] = useState(false);
  const [videoOn, setVideoOn] = useState(type === 'video');
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTimer(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 z-[100] bg-[#0a0a0a] flex flex-col items-center justify-between py-24 px-8 overflow-hidden">
      {/* Video Background Mock */}
      {type === 'video' && videoOn && (
        <div className="absolute inset-0 z-[-1] opacity-40">
            <img src={`https://picsum.photos/1080/1920?random=${name}`} className="w-full h-full object-cover blur-sm scale-110" alt="" />
        </div>
      )}

      <div className="flex flex-col items-center space-y-6">
        <div className="relative">
            <div className="w-32 h-32 rounded-full border-4 border-white/10 p-1">
                <img src={`https://i.pravatar.cc/300?u=${name}`} alt={name} className="w-full h-full rounded-full object-cover" />
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-green-500 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                On Call
            </div>
        </div>
        <div className="text-center">
            <h2 className="text-4xl font-black mb-2">{name}</h2>
            <p className="text-white/60 font-medium tracking-[4px]">{formatTime(timer)}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8 w-full max-w-sm">
        <button 
            onClick={() => setMuted(!muted)}
            className={`p-6 rounded-full flex flex-col items-center space-y-2 transition-all ${muted ? 'bg-white text-black' : 'bg-white/10 text-white'}`}
        >
            {muted ? <MicOff /> : <Mic />}
            <span className="text-[10px] font-black uppercase tracking-widest">Mute</span>
        </button>
        <button 
            onClick={onEnd}
            className="p-6 bg-red-500 text-white rounded-full flex flex-col items-center space-y-2 shadow-[0_0_30px_rgba(239,68,68,0.4)] active:scale-95 transition-all"
        >
            <PhoneOff />
            <span className="text-[10px] font-black uppercase tracking-widest">End</span>
        </button>
        <button 
            onClick={() => setVideoOn(!videoOn)}
            className={`p-6 rounded-full flex flex-col items-center space-y-2 transition-all ${videoOn ? 'bg-white text-black' : 'bg-white/10 text-white'}`}
        >
            {videoOn ? <Video /> : <VideoOff />}
            <span className="text-[10px] font-black uppercase tracking-widest">Video</span>
        </button>
      </div>

      <div className="flex space-x-8 text-white/30">
        <Volume2 size={24} />
      </div>
    </div>
  );
};

export default CallOverlay;