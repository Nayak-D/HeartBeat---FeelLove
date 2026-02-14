
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Trash2, RotateCcw, CheckCircle2, Trophy, Swords, Target, RefreshCw, Clock, Star, Heart, UserPlus, Zap, AlertTriangle } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const CHALLENGE_POOL = [
  { word: 'banana', hint: 'A yellow crescent', color: 'from-[#ffcc00] to-[#ffb300]' },
  { word: 'cat', hint: 'Triangle ears', color: 'from-[#ff6d1e] to-[#e65100]' },
  { word: 'apple', hint: 'Round fruit with a stem', color: 'from-red-500 to-red-600' },
  { word: 'house', hint: 'Square with a triangle roof', color: 'from-blue-500 to-blue-600' },
  { word: 'sun', hint: 'Circle with rays', color: 'from-yellow-300 to-orange-400' },
  { word: 'tree', hint: 'Stick with a cloud on top', color: 'from-green-500 to-emerald-700' },
  { word: 'car', hint: 'Box with two circles', color: 'from-indigo-500 to-purple-600' },
  { word: 'umbrella', hint: 'A curve with a J-hook', color: 'from-pink-400 to-rose-600' },
  { word: 'star', hint: 'Five points of light', color: 'from-amber-400 to-yellow-600' },
  { word: 'mountain', hint: 'Big triangles with snow', color: 'from-slate-400 to-slate-600' },
  { word: 'heart', hint: 'Symbol of love', color: 'from-red-400 to-pink-600' },
  { word: 'butterfly', hint: 'B-shape with a body', color: 'from-cyan-400 to-blue-500' },
  { word: 'pizza', hint: 'A triangle with spots', color: 'from-orange-400 to-red-500' },
  { word: 'rocket', hint: 'Pointy tube going up', color: 'from-indigo-600 to-blue-700' },
  { word: 'cup', hint: 'U-shape with a handle', color: 'from-teal-400 to-teal-600' },
  { word: 'smiley', hint: 'Circle with a big curve', color: 'from-yellow-400 to-yellow-500' },
];

const TIME_LIMIT = 90;
const CELEBRATION_DURATION = 3;

interface DrawDuelProps {
  onClose?: () => void;
}

const DrawDuel: React.FC<DrawDuelProps> = ({ onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [level, setLevel] = useState(1);
  const [levelTimer, setLevelTimer] = useState(0);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [aiGuess, setAiGuess] = useState('');
  const [matchScore, setMatchScore] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [celebrationTimeLeft, setCelebrationTimeLeft] = useState(CELEBRATION_DURATION);
  const [isGameFinished, setIsGameFinished] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [paths, setPaths] = useState<ImageData[]>([]);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [sessionChallenges, setSessionChallenges] = useState<any[]>([]);
  const [celebrationParticles, setCelebrationParticles] = useState<any[]>([]);
  
  const analysisTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAnalysisTimeRef = useRef<number>(0);

  const remainingTime = Math.max(0, TIME_LIMIT - levelTimer);

  const initSession = useCallback(() => {
    const shuffled = [...CHALLENGE_POOL].sort(() => 0.5 - Math.random());
    const selected = [];
    for (let i = 0; i < 5; i++) {
      selected.push({
        first: shuffled[i * 2],
        second: shuffled[i * 2 + 1]
      });
    }
    setSessionChallenges(selected);
    setLevel(1);
    setLevelTimer(0);
    setIsGameFinished(false);
    setIsTimeUp(false);
    setSelectedWord(null);
    setMatchScore(0);
    setAiGuess('');
  }, []);

  const triggerGrandCelebration = () => {
    const hearts = Array.from({ length: 25 }).map((_, i) => ({
      id: `heart-${Date.now()}-${i}`,
      type: 'heart',
      left: Math.random() * 100,
      delay: Math.random() * 2,
      scale: 0.8 + Math.random() * 2,
      color: '#ff2d55',
      rotate: Math.random() * 360,
    }));
    setCelebrationParticles(hearts);
  };

  useEffect(() => {
    let interval: any;
    if (gameStarted && selectedWord && !isCelebrating && !isGameFinished) {
      interval = setInterval(() => {
        setLevelTimer(prev => {
          const next = prev + 0.1;
          if (next >= TIME_LIMIT) {
            setIsGameFinished(true);
            setIsTimeUp(true);
            return TIME_LIMIT;
          }
          return next;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [gameStarted, selectedWord, isCelebrating, isGameFinished]);

  useEffect(() => {
    let interval: any;
    if (isCelebrating) {
      interval = setInterval(() => {
        setCelebrationTimeLeft(prev => {
          if (prev <= 0.1) {
            setIsCelebrating(false);
            setCelebrationTimeLeft(CELEBRATION_DURATION);
            if (level >= 5) {
              setIsGameFinished(true);
              triggerGrandCelebration();
            } else {
              setLevel(prevLevel => prevLevel + 1);
              setSelectedWord(null); 
              setLevelTimer(0);
              setMatchScore(0);
            }
            return 0;
          }
          return prev - 0.1;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isCelebrating, level]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gameStarted || !selectedWord || isCelebrating) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        let temp: ImageData | null = null;
        try { temp = ctx.getImageData(0, 0, canvas.width, canvas.height); } catch(e) {}
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        if (temp) ctx.putImageData(temp, 0, 0);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#ffffff';
      }
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [gameStarted, selectedWord, isCelebrating]);

  const analyzeDrawing = useCallback(async (isFinal = false) => {
    const now = Date.now();
    const timeSinceLast = now - lastAnalysisTimeRef.current;
    
    if (!isFinal && timeSinceLast < 2500) return;
    if (isCelebrating || isAnalyzing || isGameFinished || isRateLimited || !canvasRef.current || !selectedWord) return;

    setIsAnalyzing(true);
    lastAnalysisTimeRef.current = now;

    try {
      const canvas = canvasRef.current;
      const base64Image = canvas.toDataURL('image/jpeg', 0.4).split(',')[1];
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{
          role: 'user',
          parts: [
            { text: `You are an extremely toxic, impatient, and sarcastic gamer AI judge. The user is drawing a "${selectedWord}". Output ONLY JSON with "guess" (insulting gamer-slang feedback, max 10 words) and "matchPercentage" (0-100). BE BRUTALLY STRICT. If it's anything less than perfect, keep it low. ONLY give >50% if it is undeniably a "${selectedWord}".` },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Image,
              },
            },
          ],
        }],
        config: { 
            responseMimeType: "application/json",
            thinkingConfig: { thinkingBudget: 0 }
        }
      });

      const result = JSON.parse(response.text || '{}');
      if (result.guess) setAiGuess(result.guess);
      const score = result.matchPercentage || 0;
      setMatchScore(score);

      if (score >= 50) {
        if (navigator.vibrate) navigator.vibrate([150, 50, 150]);
        clearCanvas();
        setIsCelebrating(true);
      }
    } catch (err: any) {
      console.error("Analysis error:", err);
      const errorMsg = err?.message || String(err);
      if (errorMsg.includes('Requested entity was not found')) {
        setAiGuess("Invalid API Key. Re-select project.");
        if ((window as any).aistudio?.openSelectKey) {
          await (window as any).aistudio.openSelectKey();
        }
      } else if (errorMsg.includes('429')) {
        setIsRateLimited(true);
        setAiGuess("L + Ratio + Rate Limited. Stop spamming.");
        setTimeout(() => setIsRateLimited(false), 10000);
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedWord, isGameFinished, isCelebrating, isAnalyzing, isRateLimited]);

  const savePath = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      setPaths(prev => [...prev, ctx.getImageData(0, 0, canvas.width, canvas.height)]);
    }
  };

  const undo = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx && paths.length > 0) {
      const newPaths = [...paths];
      const lastState = newPaths.pop();
      setPaths(newPaths);
      if (lastState) ctx.putImageData(lastState, 0, 0);
      else ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const startDrawing = (e: React.PointerEvent) => {
    if (!gameStarted || !selectedWord || isGameFinished || isCelebrating) return;
    savePath();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx?.beginPath();
    ctx?.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.PointerEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    const rect = canvas?.getBoundingClientRect();
    if (rect && ctx) {
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.stroke();
      if (analysisTimeoutRef.current) clearTimeout(analysisTimeoutRef.current);
      analysisTimeoutRef.current = setTimeout(() => analyzeDrawing(), 1500);
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (analysisTimeoutRef.current) clearTimeout(analysisTimeoutRef.current);
    analyzeDrawing(true);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setPaths([]);
    }
  };

  const selectChallenge = (word: string) => {
    setSelectedWord(word);
    setAiGuess("Analyzing your mid-tier art skills...");
    setMatchScore(0);
    setLevelTimer(0);
  };

  const startNewGame = () => {
    initSession();
    setGameStarted(true);
  };

  const currentLevelData = sessionChallenges[level - 1] || sessionChallenges[0];

  return (
    <div className="flex flex-col h-full w-full bg-[#050505] relative overflow-hidden pt-12">
      <div className="w-full flex items-center justify-between mb-8 px-6 z-[110] relative shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-[#0f111a] flex items-center justify-center border border-[#1e2235] shadow-2xl ring-1 ring-white/5">
             <span className="text-2xl">⚔️</span>
          </div>
          <div className="flex flex-col text-left">
            <h2 className="text-sm font-black uppercase tracking-[3px] text-white leading-none">Draw Duel</h2>
            <div className="flex items-center space-x-1.5 mt-1.5">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_#ef4444]"></div>
              <span className="text-[8px] text-white/30 font-black uppercase tracking-widest">Hardcore Mode</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2.5">
          <button className="w-11 h-11 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all active:scale-95 group flex items-center justify-center shadow-lg">
            <UserPlus size={18} className="text-white/40 group-hover:text-white transition-colors" />
          </button>
          <button onClick={onClose} className="h-11 px-5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all active:scale-95 group shadow-lg flex items-center">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">Quit</span>
          </button>
        </div>
      </div>

      {!gameStarted ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in">
           <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl mb-6 animate-pulse">
              <Swords size={40} className="text-white" />
          </div>
          <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-2 text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Draw Duel</h2>
          <p className="text-white/40 font-black tracking-[4px] uppercase text-[10px] mb-10 italic">Strict Gamer AI Edition</p>
          <button onClick={startNewGame} className="w-full py-5 bg-white text-black rounded-[1.5rem] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all text-sm">Challenge AI</button>
        </div>
      ) : isGameFinished ? (
        <div className="flex-1 flex flex-col items-center justify-center p-10 text-center animate-in zoom-in duration-500 relative overflow-hidden">
          {celebrationParticles.map(p => (
            <div key={p.id} className="fixed pointer-events-none z-[300] animate-[particle-fly_4s_ease-out_forwards]" style={{ left: `${p.left}%`, bottom: '-40px', animationDelay: `${p.delay}s`, transform: `scale(${p.scale}) rotate(${p.rotate}deg)`, color: p.color }}>
              <Heart fill="currentColor" size={24} />
            </div>
          ))}

          <div className={`w-24 h-24 ${level >= 5 && !isTimeUp ? 'bg-indigo-500' : 'bg-red-500'} rounded-[2.5rem] flex items-center justify-center shadow-2xl mb-6 z-10`}>
              {level >= 5 && !isTimeUp ? <Trophy size={48} className="text-white" /> : <Clock size={48} className="text-white" />}
          </div>
          <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-2 text-white z-10">
            {level >= 5 && !isTimeUp ? 'ARENA MASTERED' : 'BOZO FAILED'}
          </h2>
          <p className="text-white/40 font-black tracking-[4px] uppercase text-[10px] mb-12 italic z-10">
            {level >= 5 && !isTimeUp ? 'You actually have talent' : `Skill Issue at Level ${level}`}
          </p>
          
          <button onClick={startNewGame} className="w-full max-w-xs py-5 bg-white text-black rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-2xl active:scale-95 transition-all z-10">
            Draw Again
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col relative px-6 justify-center">
          {isCelebrating && (
            <div className="absolute inset-0 z-[120] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center text-center p-8 animate-in zoom-in duration-200">
              <div className="w-24 h-24 bg-red-500 rounded-[2.5rem] flex items-center justify-center shadow-2xl mb-8 animate-[bounce_0.5s_infinite]">
                <CheckCircle2 size={48} className="text-white" />
              </div>
              <h3 className="text-5xl font-black italic tracking-tighter uppercase mb-2 text-red-500">CLEAN!</h3>
              <p className="text-white/40 font-black tracking-[4px] uppercase text-[10px] mb-12">ROUND {level} COMPLETED</p>
              <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 w-full max-w-xs">
                <span className="text-6xl font-black italic text-white">{Math.ceil(celebrationTimeLeft)}</span>
              </div>
            </div>
          )}

          {selectedWord && !isCelebrating && (
            <div className="absolute top-0 left-0 right-0 h-1 z-[115]">
              <div className={`h-full transition-all duration-300 ${remainingTime < 15 ? 'bg-red-500 animate-pulse' : 'bg-indigo-500'}`} style={{ width: `${(Math.max(0, TIME_LIMIT - levelTimer) / TIME_LIMIT) * 100}%` }} />
            </div>
          )}

          {!selectedWord ? (
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="mb-4 text-center">
                <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10"><Zap size={20} className="text-red-500" fill="currentColor" /></div>
                <h4 className="text-[10px] font-black uppercase tracking-[5px] text-white/30">Level {level} - Select Target</h4>
              </div>
              <button onClick={() => selectChallenge(currentLevelData.first.word)} className={`w-full p-8 rounded-[2.5rem] bg-gradient-to-br ${currentLevelData.first.color} shadow-2xl active:scale-[0.98] transition-all text-center relative overflow-hidden group`}>
                <h5 className="text-2xl font-black italic uppercase mb-1 text-black">{currentLevelData.first.word}</h5>
                <p className="text-[9px] font-black uppercase tracking-widest text-black/60 italic">{currentLevelData.first.hint}</p>
              </button>
              <button onClick={() => selectChallenge(currentLevelData.second.word)} className={`w-full p-8 rounded-[2.5rem] bg-gradient-to-br ${currentLevelData.second.color} shadow-2xl active:scale-[0.98] transition-all text-center relative overflow-hidden group`}>
                <h5 className="text-2xl font-black italic uppercase mb-1 text-black">{currentLevelData.second.word}</h5>
                <p className="text-[9px] font-black uppercase tracking-widest text-black/60 italic">{currentLevelData.second.hint}</p>
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col pt-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black italic text-white uppercase">{selectedWord}</h3>
                <div className={`px-4 py-2 rounded-2xl border ${remainingTime < 15 ? 'bg-red-500 border-red-500/40 text-white' : 'bg-white/5 border-white/5 text-red-500'}`}>
                  <span className="text-sm font-black italic">{Math.max(0, TIME_LIMIT - levelTimer).toFixed(1)}s</span>
                </div>
              </div>

              <div className="bg-[#0a0a0c] rounded-[3rem] flex-1 min-h-[300px] relative border border-white/5 overflow-hidden shadow-inner group mb-6">
                <canvas ref={canvasRef} className="w-full h-full touch-none cursor-crosshair" onPointerDown={startDrawing} onPointerMove={draw} onPointerUp={stopDrawing} onPointerLeave={stopDrawing} />
                {isAnalyzing && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center space-x-2 backdrop-blur-md z-20">
                    <RefreshCw size={12} className="animate-spin" />
                    <span>Roasting...</span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-4 mb-6">
                 <div className="flex-1 bg-white/5 rounded-3xl p-4 border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 left-0 h-full bg-red-500/20 transition-all duration-500" style={{ width: `${matchScore}%` }} />
                    <div className="relative flex justify-between items-center">
                      <span className="text-[9px] font-black uppercase text-white/40 tracking-widest">Accuracy (Needs 50%+)</span>
                      <span className={`text-sm font-black italic ${matchScore >= 50 ? 'text-green-500' : 'text-white'}`}>{matchScore}%</span>
                    </div>
                 </div>
                 <button onClick={undo} className="p-4 bg-white/5 rounded-2xl active:scale-90 transition-all hover:bg-white/10"><RotateCcw size={20} /></button>
                 <button onClick={clearCanvas} className="p-4 bg-red-500/10 text-red-500 rounded-2xl active:scale-90 transition-all hover:bg-red-500/20"><Trash2 size={20} /></button>
              </div>

              <div className="bg-red-500/10 border border-red-500/20 rounded-[2rem] p-5 mb-10 min-h-[80px] animate-in slide-in-from-bottom duration-300">
                <p className="text-sm font-black italic text-red-100/90 leading-relaxed uppercase">"{aiGuess || 'Hurry up and draw, slowpoke.'}"</p>
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes particle-fly { 0% { transform: translateY(0) scale(0.5) rotate(0); opacity: 0; } 10% { opacity: 1; } 100% { transform: translateY(-1000px) scale(1.5) rotate(720deg); opacity: 0; } }
      `}</style>
    </div>
  );
};

export default DrawDuel;
