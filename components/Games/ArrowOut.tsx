
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ChevronLeft, RotateCcw, Heart, Trophy, XCircle, RefreshCw, Sparkles, MousePointer2, Lightbulb, Zap, Flame, Star } from 'lucide-react';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface Point {
  x: number;
  y: number;
}

interface PathArrow {
  id: string;
  points: Point[]; 
  dir: Direction;  
  clearing: boolean;
  segmentLength: number; 
  fullPathD: string;     
  totalPathLength: number;
  type: 'LARGE' | 'MEDIUM' | 'SMALL' | 'MINI';
  color: string;
}

interface ArrowOutProps {
  onClose: () => void;
}

const GRID_COLS = 16;
const GRID_ROWS = 22;
const EXIT_DURATION = 1.1; 

const SHAPE_CONFIGS: Record<string, { 
    mask: (x: number, y: number, difficulty: number) => boolean, 
    color: string,
    label: string
}> = {
  HEART: {
    mask: (x, y, diff) => {
        const scale = diff === 0 ? 3.2 : 2.5; 
        const nx = (x - GRID_COLS / 2) / scale;
        const ny = (y - GRID_ROWS / 2.2) / scale;
        return Math.pow(nx * nx + ny * ny - 1, 3) - nx * nx * ny * ny * ny <= 0;
    },
    color: '#ff2d55',
    label: 'HEART'
  },
  BRAIN: {
    mask: (x, y, diff) => {
        const scale = diff === 0 ? 0.35 : 0.45;
        const cx = GRID_COLS / 2;
        const cy = GRID_ROWS / 2;
        const dx = (x - cx) / (GRID_COLS * scale);
        const dy = (y - cy) / (GRID_ROWS * scale);
        return (dx * dx + dy * dy) < 1.0;
    },
    color: '#06b6d4',
    label: 'BRAIN'
  },
  STAR: {
    mask: (x, y, diff) => {
        const scale = diff === 0 ? 3.8 : 2.6;
        const cx = GRID_COLS / 2, cy = GRID_ROWS / 2;
        const px = x - cx, py = y - cy;
        const r = Math.sqrt(px * px + py * py) / scale;
        const angle = Math.atan2(py, px);
        const s = 0.5 + 0.5 * Math.sin(5 * angle);
        return r <= s;
    },
    color: '#fbbf24',
    label: 'STAR'
  }
};

const SHAPE_KEYS = Object.keys(SHAPE_CONFIGS);

const ArrowOut: React.FC<ArrowOutProps> = ({ onClose }) => {
  // Persistence
  const savedLevel = parseInt(localStorage.getItem('arrow_out_level') || '0');
  const savedStreak = parseInt(localStorage.getItem('arrow_out_streak') || '0');

  const [level, setLevel] = useState(savedLevel);
  const [streak, setStreak] = useState(savedStreak);
  const [arrows, setArrows] = useState<PathArrow[]>([]);
  const [totalInitialArrows, setTotalInitialArrows] = useState(0);
  const [lives, setLives] = useState(3);
  const [hintsLeft, setHintsLeft] = useState(3);
  const [hintedId, setHintedId] = useState<string | null>(null);
  const [isWon, setIsWon] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [showTutorial, setShowTutorial] = useState(level === 0);
  const [shakingId, setShakingId] = useState<string | null>(null);
  const [isErrorFlash, setIsErrorFlash] = useState(false);
  const [showFullShape, setShowFullShape] = useState(false);
  
  // Combo Logic
  const [combo, setCombo] = useState(0);
  const lastTapTime = useRef(0);

  const shapeKey = SHAPE_KEYS[level % SHAPE_KEYS.length];
  const currentShape = SHAPE_CONFIGS[shapeKey];

  // Difficulty Tiering
  const difficultyTier = level < 2 ? 'TUTORIAL' : level < 5 ? 'EASY' : level < 10 ? 'MEDIUM' : 'MASTER';
  const isHighStreak = streak >= 3;

  const generateLevel = useCallback((currentLevel: number) => {
    const tier = currentLevel < 2 ? 'TUTORIAL' : currentLevel < 5 ? 'EASY' : currentLevel < 10 ? 'MEDIUM' : 'MASTER';
    const key = SHAPE_KEYS[currentLevel % SHAPE_KEYS.length];
    const { mask } = SHAPE_CONFIGS[key];
    const occupied = new Set<string>();
    const newArrows: PathArrow[] = [];

    const isInside = (x: number, y: number) => x >= 0 && x < GRID_COLS && y >= 0 && y < GRID_ROWS && mask(x, y, tier === 'TUTORIAL' ? 0 : 1);

    // Difficulty params
    const density = tier === 'TUTORIAL' ? 40 : tier === 'EASY' ? 100 : tier === 'MEDIUM' ? 180 : 280;
    const maxLen = tier === 'TUTORIAL' ? 2 : tier === 'EASY' ? 3 : tier === 'MEDIUM' ? 5 : 8;

    let attempts = 0;
    while (attempts < 6000 && occupied.size < density) {
      const startX = Math.floor(Math.random() * GRID_COLS);
      const startY = Math.floor(Math.random() * GRID_ROWS);

      if (isInside(startX, startY) && !occupied.has(`${startX},${startY}`)) {
        let length = Math.max(2, Math.floor(Math.random() * maxLen) + (tier === 'MASTER' ? 3 : 1));
        if (tier === 'TUTORIAL') length = 2;

        const cx = GRID_COLS / 2, cy = GRID_ROWS / 2;
        const possibleDirs: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
        const exitDir = possibleDirs.sort((a, b) => {
          const scoreA = (a === 'LEFT' ? -(startX-cx) : a === 'RIGHT' ? (startX-cx) : a === 'UP' ? -(startY-cy) : (startY-cy));
          const scoreB = (b === 'LEFT' ? -(startX-cx) : b === 'RIGHT' ? (startX-cx) : b === 'UP' ? -(startY-cy) : (startY-cy));
          return scoreB - scoreA;
        })[Math.random() > 0.3 ? 0 : Math.floor(Math.random() * 4)];

        const points: Point[] = [{ x: startX, y: startY }];
        let curX = startX, curY = startY;
        const growBackwards = { UP: [0, 1], DOWN: [0, -1], LEFT: [1, 0], RIGHT: [-1, 0] }[exitDir];

        for (let i = 1; i < length; i++) {
          const options: [number, number][] = [growBackwards as [number, number]];
          if (tier !== 'TUTORIAL') {
             options.push([growBackwards![1], growBackwards![0]]);
             options.push([-growBackwards![1], -growBackwards![0]]);
          }

          let placed = false;
          for (const [ogx, ogy] of options) {
            const nx = curX + ogx, ny = curY + ogy;
            if (isInside(nx, ny) && !occupied.has(`${nx},${ny}`)) {
              curX = nx; curY = ny;
              points.push({ x: curX, y: curY });
              placed = true;
              break;
            }
          }
          if (!placed) break;
        }

        if (points.length >= 2) {
          points.forEach(p => occupied.add(`${p.x},${p.y}`));
          const actualPoints = [...points].reverse();
          const head = actualPoints[actualPoints.length - 1];
          const segmentLengthValue = (actualPoints.length - 1) * 10;
          const exitExtent = 400; 
          const exitPoint = { 
            x: exitDir === 'LEFT' ? head.x - exitExtent : exitDir === 'RIGHT' ? head.x + exitExtent : head.x,
            y: exitDir === 'UP' ? head.y - exitExtent : exitDir === 'DOWN' ? head.y + exitExtent : head.y
          };

          let d = `M ${actualPoints[0].x * 10 + 5} ${actualPoints[0].y * 10 + 5}`;
          for (let i = 1; i < actualPoints.length; i++) d += ` L ${actualPoints[i].x * 10 + 5} ${actualPoints[i].y * 10 + 5}`;
          d += ` L ${exitPoint.x * 10 + 5} ${exitPoint.y * 10 + 5}`;

          const type = actualPoints.length > 5 ? 'LARGE' : actualPoints.length > 3 ? 'MEDIUM' : actualPoints.length > 2 ? 'SMALL' : 'MINI';
          
          // Color reflects streak mode
          const baseColor = type === 'MINI' ? '#06b6d4' : type === 'SMALL' ? '#22d3ee' : type === 'MEDIUM' ? '#3b82f6' : '#0f172a';
          const color = isHighStreak ? '#f59e0b' : baseColor;

          newArrows.push({
            id: `arrow-${Math.random().toString(36).substr(2, 9)}`,
            points: actualPoints,
            dir: exitDir,
            clearing: false,
            segmentLength: segmentLengthValue,
            fullPathD: d,
            totalPathLength: segmentLengthValue + exitExtent * 10,
            type,
            color
          });
        }
      }
      attempts++;
    }
    setArrows(newArrows);
    setTotalInitialArrows(newArrows.length);
    setIsWon(false);
    setIsGameOver(false);
    setShowFullShape(false);
    setLives(3);
    setHintsLeft(isHighStreak ? 4 : 3); // Mastery Perk
    setHintedId(null);
    setCombo(0);
    
    // Save progress
    localStorage.setItem('arrow_out_level', currentLevel.toString());
  }, [isHighStreak]);

  useEffect(() => {
    generateLevel(level);
  }, [generateLevel, level]);

  const checkCollisionDirect = (arrow: PathArrow, currentArrows: PathArrow[]) => {
    const head = arrow.points[arrow.points.length - 1];
    let tx = head.x, ty = head.y;
    const dx = arrow.dir === 'LEFT' ? -1 : arrow.dir === 'RIGHT' ? 1 : 0;
    const dy = arrow.dir === 'UP' ? -1 : arrow.dir === 'DOWN' ? 1 : 0;

    while (true) {
      tx += dx; ty += dy;
      if (tx < 0 || tx >= GRID_COLS || ty < 0 || ty >= GRID_ROWS) return null;
      const blocker = currentArrows.find(other => !other.clearing && other.id !== arrow.id && other.points.some(p => p.x === tx && p.y === ty));
      if (blocker) return blocker.id;
    }
  };

  const useHint = () => {
    if (hintsLeft <= 0 || isWon || isGameOver || showTutorial || hintedId) return;
    const validArrow = arrows.find(a => !a.clearing && checkCollisionDirect(a, arrows) === null);
    if (validArrow) {
      if (navigator.vibrate) navigator.vibrate(50);
      setHintsLeft(prev => prev - 1);
      setHintedId(validArrow.id);
      setTimeout(() => setHintedId(null), 2500);
    }
  };

  const handleTap = (id: string) => {
    if (isWon || isGameOver || showTutorial) return;

    setArrows(prev => {
      const arrow = prev.find(a => a.id === id);
      if (!arrow || arrow.clearing) return prev;

      const blockingId = checkCollisionDirect(arrow, prev);
      
      if (!blockingId) {
        if (navigator.vibrate) navigator.vibrate(10);
        if (hintedId === id) setHintedId(null);
        
        // Combo update
        const now = Date.now();
        if (now - lastTapTime.current < 800) setCombo(c => c + 1);
        else setCombo(1);
        lastTapTime.current = now;

        const nextState = prev.map(a => a.id === id ? { ...a, clearing: true } : a);
        
        setTimeout(() => {
          setArrows(final => {
            const filtered = final.filter(a => a.id !== id);
            if (filtered.length === 0 && final.length > 0) triggerWinSequence();
            return filtered;
          });
        }, EXIT_DURATION * 1000 + 50);

        return nextState;
      } else {
        setShakingId(id);
        setIsErrorFlash(true);
        setCombo(0);
        if (navigator.vibrate) navigator.vibrate([30, 40, 30]);
        setLives(l => {
          const nextLives = l - 1;
          if (nextLives <= 0) {
              setIsGameOver(true);
              setStreak(0);
              localStorage.setItem('arrow_out_streak', '0');
          }
          return nextLives;
        });
        setTimeout(() => { setShakingId(null); setIsErrorFlash(false); }, 400);
        return prev;
      }
    });
  };

  const triggerWinSequence = () => {
    setShowFullShape(true);
    const newStreak = streak + 1;
    setStreak(newStreak);
    localStorage.setItem('arrow_out_streak', newStreak.toString());
    
    if (navigator.vibrate) navigator.vibrate([10, 50, 10, 50]);
    setTimeout(() => { setIsWon(true); }, 800);
  };

  const progress = totalInitialArrows > 0 ? ((totalInitialArrows - arrows.length) / totalInitialArrows) * 100 : 0;

  const renderArrowPath = (arrow: PathArrow) => {
    const { segmentLength, fullPathD, totalPathLength, clearing } = arrow;
    const isHinted = hintedId === arrow.id;

    return (
      <g 
        key={arrow.id}
        className={`transition-all duration-300 ${shakingId === arrow.id ? 'animate-shake-snappy' : ''}`}
        style={{ opacity: clearing ? 0 : 1 }}
      >
        {isHinted && (
          <path 
            d={fullPathD.split(' L ').slice(0, arrow.points.length).join(' L ')}
            stroke={isHighStreak ? "#fcd34d" : "#fbbf24"} strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none" 
            className="animate-pulse opacity-40 blur-sm"
          />
        )}
        <path 
          d={fullPathD} 
          stroke={isHinted ? "#fbbf24" : arrow.color} 
          strokeWidth={arrow.type === 'MINI' ? "1.4" : "1.8"} 
          strokeLinecap="round" strokeLinejoin="round" fill="none" 
          className="transition-colors duration-300"
          style={{
            strokeDasharray: `${segmentLength} ${totalPathLength * 2}`,
            strokeDashoffset: clearing ? -totalPathLength : 0,
            transition: `stroke-dashoffset ${EXIT_DURATION}s cubic-bezier(0.4, 0, 0.2, 1)`
          }}
        />
        <g 
          style={{
            offsetPath: `path('${fullPathD}')`,
            offsetDistance: clearing ? '100%' : `${(segmentLength / totalPathLength) * 100}%`,
            offsetRotate: 'auto',
            transition: `offset-distance ${EXIT_DURATION}s cubic-bezier(0.4, 0, 0.2, 1)`,
            opacity: clearing ? 0 : 1
          }}
        >
          <path d="M -2.5,-3.5 L 4.5,0 L -2.5,3.5 Z" fill={isHinted ? "#fbbf24" : arrow.color} stroke={isHinted ? "#fbbf24" : arrow.color} strokeWidth="0.4" strokeLinejoin="round" />
        </g>
        <path 
          d={fullPathD.split(' L ').slice(0, arrow.points.length).join(' L ')} 
          stroke="transparent" strokeWidth="24" fill="none" className="cursor-pointer touch-none"
          onPointerDown={(e) => { e.stopPropagation(); handleTap(arrow.id); }}
        />
      </g>
    );
  };

  return (
    <div className={`flex flex-col h-full w-full relative font-sans select-none overflow-hidden touch-none transition-colors duration-300 ${isErrorFlash ? 'bg-red-50' : isHighStreak ? 'bg-orange-50/20' : 'bg-white'}`}>
      
      {/* Dynamic Grid Background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '10px 10px' }} />

      {/* Streak Particles */}
      {isHighStreak && (
          <div className="absolute inset-0 pointer-events-none z-0">
             {Array.from({ length: 15 }).map((_, i) => (
                 <div 
                    key={i} 
                    className="absolute bottom-[-20px] bg-orange-500/10 rounded-full animate-ember"
                    style={{
                        left: `${Math.random() * 100}%`,
                        width: `${4 + Math.random() * 6}px`,
                        height: `${4 + Math.random() * 6}px`,
                        animationDelay: `${Math.random() * 4}s`,
                        animationDuration: `${3 + Math.random() * 4}s`
                    }}
                 />
             ))}
          </div>
      )}

      {/* Header HUD */}
      <div className="pt-14 px-6 flex justify-between items-center w-full z-20 shrink-0">
        <button onClick={onClose} className="w-12 h-12 bg-indigo-50/50 rounded-2xl flex items-center justify-center text-indigo-400 active:scale-90 transition-transform shadow-sm">
          <ChevronLeft size={28} strokeWidth={2.5} />
        </button>
        
        <div className="flex flex-col items-center">
          <div className="flex items-center space-x-2 mb-1">
             <span className={`${isHighStreak ? 'text-orange-500' : 'text-cyan-500'} font-black text-[10px] uppercase tracking-[4px] transition-colors`}>{currentShape.label}</span>
             <div className="bg-slate-100 px-2 py-0.5 rounded-full flex items-center space-x-1">
                {isHighStreak && <Flame size={8} className="text-orange-500" fill="currentColor" />}
                <span className="text-slate-400 font-black text-[8px] uppercase tracking-widest">{difficultyTier}</span>
             </div>
          </div>
          <div className="flex space-x-1.5">
            {[1, 2, 3].map(i => (
              <Heart key={i} size={18} fill={i <= lives ? "#ff2d55" : "none"} className={`${i <= lives ? "text-[#ff2d55]" : "text-slate-200"} transition-all duration-300`} />
            ))}
          </div>
        </div>

        <div className="flex space-x-2">
            <button 
                onClick={useHint} 
                disabled={hintsLeft <= 0 || hintedId !== null}
                className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center transition-all shadow-sm relative active:scale-90 ${hintsLeft > 0 ? 'bg-amber-50 text-amber-500' : 'bg-slate-50 text-slate-300 opacity-50'}`}
            >
                <Lightbulb size={20} strokeWidth={2.5} />
                <span className="text-[8px] font-black absolute -top-1 -right-1 bg-amber-500 text-white w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">{hintsLeft}</span>
            </button>
            <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center transition-all shadow-sm relative ${isHighStreak ? 'bg-orange-500 text-white' : 'bg-indigo-50 text-indigo-400'}`}>
                <Flame size={20} strokeWidth={2.5} fill={isHighStreak ? "white" : "none"} className={isHighStreak ? "animate-pulse" : ""} />
                <span className="text-[8px] font-black absolute -top-1 -right-1 bg-black text-white w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">{streak}</span>
            </div>
        </div>
      </div>

      {/* Progress & Combo UI */}
      <div className="px-10 mt-6 z-20 flex flex-col items-center">
        <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full transition-all duration-700 shadow-[0_0_10px_rgba(6,182,212,0.5)]" style={{ width: `${progress}%`, backgroundColor: isHighStreak ? '#f59e0b' : currentShape.color }} />
        </div>
        {combo > 1 && (
          <div className="mt-3 bg-indigo-500 text-white px-3 py-1 rounded-full text-[10px] font-black flex items-center space-x-1.5 animate-in slide-in-from-top duration-300 shadow-xl">
            <Zap size={10} fill="white" />
            <span className="uppercase tracking-widest">{combo}x VIBE STREAK</span>
          </div>
        )}
      </div>

      {/* Play Area */}
      <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
        <div className="w-full h-full max-w-[420px] max-h-[600px] flex items-center justify-center relative">
            <svg 
              viewBox={`0 0 ${GRID_COLS * 10} ${GRID_ROWS * 10}`} 
              className={`w-full h-full transition-all duration-700 ${showTutorial ? 'opacity-30' : 'opacity-100'}`}
            >
              {(showFullShape || showTutorial) && (
                  <g className={showFullShape ? "animate-shape-reveal" : ""}>
                    {Array.from({ length: GRID_ROWS }).map((_, r) => (
                      Array.from({ length: GRID_COLS }).map((_, c) => {
                        if (currentShape.mask(c, r, 1)) {
                          return (
                            <rect 
                                key={`m-${r}-${c}`} x={c * 10 + 2.5} y={r * 10 + 2.5} width="5" height="5" rx="1.5"
                                fill={showFullShape ? (isHighStreak ? '#f59e0b' : currentShape.color) : "rgba(15, 23, 42, 0.04)"}
                                className="transition-colors duration-700"
                            />
                          );
                        }
                        return null;
                      })
                    ))}
                  </g>
              )}
              {arrows.map(arrow => renderArrowPath(arrow))}
            </svg>

            {showTutorial && (
              <div 
                onClick={() => setShowTutorial(false)}
                className="absolute inset-0 z-50 flex flex-col items-center justify-center text-center p-6 animate-in fade-in zoom-in duration-500 bg-white/10 backdrop-blur-sm rounded-[3rem]"
              >
                <div className="relative mb-8">
                  <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping"></div>
                  <div className="w-20 h-20 bg-[#0f172a] rounded-3xl flex items-center justify-center shadow-2xl relative z-10">
                    <MousePointer2 size={38} className="text-white animate-pulse" />
                  </div>
                </div>
                <h2 className="text-2xl font-black text-[#0f172a] uppercase italic tracking-tighter mb-2 leading-none">Tap to Clear</h2>
                <p className="text-slate-400 font-bold uppercase tracking-[4px] text-[9px] mb-8 leading-relaxed max-w-[180px]">Maintain your streak for bonuses. Master the {SHAPE_KEYS.length} daily shapes.</p>
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowTutorial(false); }}
                  className="px-8 py-4 bg-[#0f172a] text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl active:scale-95 transition-all"
                >
                  Enter Arena
                </button>
              </div>
            )}
        </div>
      </div>

      {/* Screens */}
      {isWon && (
        <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-12 text-center overflow-hidden">
          <div className="animate-shape-pop relative mb-12">
            <svg viewBox={`0 0 ${GRID_COLS * 10} ${GRID_ROWS * 10}`} className="w-48 h-48 filter drop-shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
                {Array.from({ length: GRID_ROWS }).map((_, r) => (
                    Array.from({ length: GRID_COLS }).map((_, c) => {
                    if (currentShape.mask(c, r, 1)) {
                        return <rect key={`win-m-${r}-${c}`} x={c * 10 + 1} y={r * 10 + 1} width="8" height="8" rx="2" fill={isHighStreak ? '#f59e0b' : currentShape.color} />;
                    }
                    return null;
                    })
                ))}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles size={48} className="text-white opacity-40 animate-pulse" />
            </div>
          </div>
          <h2 className="text-5xl font-black text-[#0f172a] uppercase italic tracking-tighter mb-2 leading-none animate-in slide-in-from-bottom-8 duration-700">CLEARED</h2>
          <div className="flex items-center space-x-2 bg-orange-500 text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-[4px] mb-12 shadow-2xl animate-in fade-in duration-1000">
             <Flame size={14} fill="currentColor" />
             <span>STREAK {streak}</span>
          </div>
          <button 
            onClick={() => { setLevel(prev => prev + 1); setIsWon(false); }} 
            className="w-full max-w-[240px] py-6 bg-[#0f172a] text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl active:scale-95 transition-all flex items-center justify-center space-x-3 animate-in fade-in duration-1000"
          >
            <span>Level {level + 2}</span>
            <ChevronLeft className="rotate-180" size={18} />
          </button>
        </div>
      )}

      {isGameOver && (
        <div className="absolute inset-0 z-[60] bg-white/95 backdrop-blur-md flex flex-col items-center justify-center animate-in zoom-in duration-500 p-12 text-center">
          <div className="w-28 h-28 bg-red-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl mb-10">
            <XCircle size={56} className="text-white" />
          </div>
          <h2 className="text-5xl font-black text-red-600 uppercase italic tracking-tighter mb-4 leading-none">BLOCKED</h2>
          <p className="text-slate-400 font-bold uppercase tracking-[4px] text-[10px] mb-4 italic">Streak Lost!</p>
          <div className="flex items-center space-x-1 mb-12 opacity-40">
            {[1, 2, 3, 4, 5].map(i => <Star key={i} size={12} fill={i <= streak ? "#94a3b8" : "none"} className="text-slate-400" />)}
          </div>
          <button 
            onClick={() => generateLevel(level)} 
            className="w-full max-w-[240px] py-6 bg-red-600 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl active:scale-95 transition-all flex items-center justify-center space-x-3"
          >
            <RefreshCw size={16} />
            <span>Try Again</span>
          </button>
        </div>
      )}

      <style>{`
        @keyframes shake-snappy {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        @keyframes shape-reveal {
          0% { opacity: 0.1; transform: scale(0.95); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes shape-pop {
          0% { transform: scale(0.2) rotate(-10deg); opacity: 0; }
          60% { transform: scale(1.1) rotate(2deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes ember {
            0% { transform: translateY(0) scale(1); opacity: 0; }
            20% { opacity: 0.6; }
            100% { transform: translateY(-300px) scale(0); opacity: 0; }
        }
        .animate-shake-snappy {
          animation: shake-snappy 0.15s ease-in-out both;
        }
        .animate-shape-reveal {
          animation: shape-reveal 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        .animate-shape-pop {
          animation: shape-pop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        .animate-ember {
            animation: ember linear infinite;
        }
      `}</style>
    </div>
  );
};

export default ArrowOut;
