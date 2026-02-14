
import React, { useState, useRef, useEffect } from 'react';
import { Track } from '../../types';
import { Play, Search, Plus, Users, Pause, SkipBack, SkipForward, Music, Heart, Share2, Radio, AlertCircle, RefreshCw, Volume2, VolumeX, Wifi, Loader2 } from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";

interface MusicSectionProps {
  tracks: Track[];
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

const MusicSection: React.FC<MusicSectionProps> = ({ tracks: initialTracks }) => {
  const [search, setSearch] = useState('');
  const [displayTracks, setDisplayTracks] = useState<Track[]>(initialTracks);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPartyMode, setIsPartyMode] = useState(false);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [playerReady, setPlayerReady] = useState(false);

  const playerRef = useRef<any>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Resilient Player Initialization
  const createPlayer = () => {
    if (playerRef.current) return;

    try {
      if (!window.YT || !window.YT.Player) return;

      playerRef.current = new window.YT.Player('yt-player-target', {
        height: '200',
        width: '200',
        videoId: '',
        playerVars: {
          playsinline: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          autoplay: 0,
          rel: 0,
          showinfo: 0,
          iv_load_policy: 3,
          origin: window.location.origin
        },
        events: {
          onReady: (event: any) => {
            setPlayerReady(true);
            event.target.setVolume(volume);
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.ENDED) {
              playNext();
            } else if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              setIsBuffering(false);
              setDuration(playerRef.current.getDuration());
              startTimer();
            } else if (event.data === window.YT.PlayerState.BUFFERING) {
              setIsBuffering(true);
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
              stopTimer();
            }
          },
          onError: (e: any) => {
            console.warn("Music Player Error Code:", e.data);
            setIsBuffering(false);
            // Error 101/150 means the uploader doesn't allow embedding.
            if (e.data === 101 || e.data === 150 || e.data === 2) {
              playNext();
            }
          }
        }
      });
    } catch (err) {
      console.error("Failed to create YT player:", err);
    }
  };

  useEffect(() => {
    // Poll for the YT API to be available
    const checkInterval = setInterval(() => {
      if (window.YT && window.YT.Player) {
        createPlayer();
        clearInterval(checkInterval);
      }
    }, 500);

    // Backup: standard callback
    window.onYouTubeIframeAPIReady = createPlayer;

    return () => {
      clearInterval(checkInterval);
      stopTimer();
    };
  }, []);

  const playNext = () => {
    const currentIndex = displayTracks.findIndex(t => t.youtubeId === currentTrack?.youtubeId);
    const nextIndex = (currentIndex + 1) % displayTracks.length;
    togglePlay(displayTracks[nextIndex]);
  };

  const playPrevious = () => {
    const currentIndex = displayTracks.findIndex(t => t.youtubeId === currentTrack?.youtubeId);
    const prevIndex = (currentIndex - 1 + displayTracks.length) % displayTracks.length;
    togglePlay(displayTracks[prevIndex]);
  };

  const startTimer = () => {
    stopTimer();
    timerRef.current = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        try {
          const current = playerRef.current.getCurrentTime();
          const total = playerRef.current.getDuration();
          setCurrentTime(current);
          if (total > 0) setProgress((current / total) * 100);
        } catch (e) {}
      }
    }, 500);
  };

  const stopTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = search.trim();
    if (!query || isSearching) return;

    setIsSearching(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Search for high-quality OFFICIAL AUDIO tracks for: "${query}". Return a JSON list of 8 results with 'title', 'artist', 'youtubeId'. Favor results that allow embedding.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                artist: { type: Type.STRING },
                youtubeId: { type: Type.STRING }
              },
              required: ["title", "artist", "youtubeId"]
            }
          }
        }
      });

      const results = JSON.parse(response.text || '[]');
      const newTracks: Track[] = results.map((res: any, idx: number) => ({
        id: `yt-${res.youtubeId}-${idx}`,
        title: res.title,
        artist: res.artist,
        youtubeId: res.youtubeId,
        cover: `https://img.youtube.com/vi/${res.youtubeId}/mqdefault.jpg`,
      }));

      if (newTracks.length > 0) {
        setDisplayTracks(newTracks);
        togglePlay(newTracks[0]);
      }
    } catch (err: any) {
      if (String(err).includes('429')) {
        setIsRateLimited(true);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const togglePlay = (track: Track) => {
    if (currentTrack?.youtubeId === track.youtubeId) {
      if (isPlaying) {
        playerRef.current?.pauseVideo();
      } else {
        playerRef.current?.playVideo();
      }
    } else {
      setCurrentTrack(track);
      setIsBuffering(true);
      
      // Ensure player is ready before loading
      if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
        playerRef.current.loadVideoById(track.youtubeId);
        playerRef.current.playVideo();
        if (navigator.vibrate) navigator.vibrate(20);
      } else {
        // Queue load if player wasn't quite ready
        const retryInterval = setInterval(() => {
           if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
             playerRef.current.loadVideoById(track.youtubeId);
             playerRef.current.playVideo();
             clearInterval(retryInterval);
           }
        }, 500);
        setTimeout(() => clearInterval(retryInterval), 5000);
      }
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current || !progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * playerRef.current.getDuration();
    playerRef.current.seekTo(newTime, true);
    setProgress(percentage * 100);
  };

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <section className="space-y-6">
      <div id="yt-player-container" className="fixed top-[-1000px] left-[-1000px] opacity-0 pointer-events-none" aria-hidden="true">
        <div id="yt-player-target"></div>
      </div>
      
      <div className="flex justify-between items-center px-1">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-500/20 rounded-2xl flex items-center justify-center border border-indigo-500/20">
            <Music size={20} className="text-indigo-400" />
          </div>
          <div>
            <h3 className="text-xl font-black italic tracking-tight uppercase">Music Lounge</h3>
            <p className="text-[10px] font-black text-white/30 uppercase tracking-[2px]">Tap to Stream</p>
          </div>
        </div>
        <div className="flex items-center bg-white/5 rounded-2xl p-1 border border-white/5">
           <button 
             onClick={() => setIsPartyMode(false)}
             className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${!isPartyMode ? 'bg-white text-black shadow-lg' : 'text-white/40'}`}
           >
             Solo
           </button>
           <button 
             onClick={() => setIsPartyMode(true)}
             className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isPartyMode ? 'bg-indigo-500 text-white shadow-lg' : 'text-white/40'}`}
           >
             Party
           </button>
        </div>
      </div>

      <form onSubmit={handleSearch} className="relative group px-1">
        <input 
          type="text" 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Artist, track or vibe..."
          className="w-full bg-[#111] border border-white/5 rounded-2xl py-4 pl-12 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all"
        />
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-indigo-400 transition-colors" size={20} />
        <button type="submit" className="absolute right-5 top-1/2 -translate-y-1/2 text-indigo-500 hover:text-indigo-400 p-1">
          {isSearching ? <RefreshCw size={18} className="animate-spin" /> : <Plus size={20} />}
        </button>
      </form>

      {isRateLimited && (
        <div className="p-4 mx-1 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center space-x-3 text-orange-400 animate-in fade-in">
          <AlertCircle size={18} />
          <p className="text-[10px] font-black uppercase tracking-widest">AI Overload... Try again soon</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 max-h-[320px] overflow-y-auto custom-scrollbar pr-1">
        {displayTracks.map((track) => (
          <div 
            key={track.id} 
            onClick={() => togglePlay(track)}
            className={`flex items-center space-x-4 p-3 rounded-2xl transition-all cursor-pointer group/item ${currentTrack?.youtubeId === track.youtubeId ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-white/5 hover:bg-white/[0.08] border border-transparent'}`}
          >
            <div className="relative w-14 h-14 shrink-0 overflow-hidden rounded-xl shadow-lg">
              <img src={track.cover} alt="" className="w-full h-full object-cover group-hover/item:scale-110 transition-transform duration-500" />
              {currentTrack?.youtubeId === track.youtubeId && (isPlaying || isBuffering) && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  {isBuffering ? (
                    <Loader2 size={24} className="text-white animate-spin" />
                  ) : (
                    <div className="flex items-end space-x-1 h-5 pb-1">
                      <div className="w-1.5 bg-indigo-400 animate-[music-bar_0.8s_ease-in-out_infinite]"></div>
                      <div className="w-1.5 bg-indigo-400 animate-[music-bar_1s_ease-in-out_infinite_0.2s]"></div>
                      <div className="w-1.5 bg-indigo-400 animate-[music-bar_0.7s_ease-in-out_infinite_0.4s]"></div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-black text-sm truncate text-white/90">{track.title}</h4>
              <p className="text-[10px] text-white/40 font-black uppercase tracking-[2px] truncate">{track.artist}</p>
            </div>
            <button className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${currentTrack?.youtubeId === track.youtubeId ? 'bg-indigo-500 text-white scale-90 shadow-lg' : 'bg-white/5 text-white/30 group-hover/item:bg-white/10 group-hover/item:text-white'}`}>
              {currentTrack?.youtubeId === track.youtubeId && isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            </button>
          </div>
        ))}
      </div>

      {currentTrack && (
        <div className="p-6 bg-gradient-to-br from-[#111] to-[#0a0a0a] rounded-[2.5rem] border border-white/5 shadow-2xl space-y-5 animate-in slide-in-from-bottom-4 duration-500 mx-1">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 shadow-2xl ring-2 ring-white/5">
              <img src={currentTrack.cover} className="w-full h-full object-cover" alt="" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <Wifi size={10} className="text-green-500 animate-pulse" />
                <span className="text-[9px] font-black uppercase text-white/40 tracking-[2px]">Streaming Live</span>
              </div>
              <h5 className="font-black text-base truncate text-white leading-tight">{currentTrack.title}</h5>
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400/60 truncate">{currentTrack.artist}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div 
              ref={progressBarRef}
              onClick={handleSeek}
              className="h-2 w-full bg-white/5 rounded-full cursor-pointer relative group overflow-hidden"
            >
              <div 
                className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute right-0 top-0 w-2 h-full bg-white/20" />
              </div>
            </div>
            <div className="flex justify-between text-[10px] font-black uppercase text-white/20 tracking-widest">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-around">
            <button className="text-white/20 hover:text-white transition-colors"><Radio size={18} /></button>
            <button onClick={playPrevious} className="text-white/30 hover:text-white transition-all active:scale-90"><SkipBack size={24} fill="currentColor" /></button>
            <button 
              onClick={() => togglePlay(currentTrack)}
              className="w-16 h-16 bg-white text-black rounded-3xl flex items-center justify-center shadow-2xl active:scale-90 transition-all hover:scale-105"
            >
              {isBuffering ? (
                <Loader2 size={32} className="animate-spin" />
              ) : isPlaying ? (
                <Pause size={32} fill="black" />
              ) : (
                <Play size={32} fill="black" className="ml-1" />
              )}
            </button>
            <button onClick={playNext} className="text-white/30 hover:text-white transition-all active:scale-90"><SkipForward size={24} fill="currentColor" /></button>
            <button onClick={() => { if (playerRef.current) { const newMute = !isMuted; if (newMute) playerRef.current.mute(); else playerRef.current.unMute(); setIsMuted(newMute); } }} className="text-white/20 hover:text-white transition-colors">
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes music-bar {
          0%, 100% { height: 6px; }
          50% { height: 18px; }
        }
      `}</style>
    </section>
  );
};

export default MusicSection;
