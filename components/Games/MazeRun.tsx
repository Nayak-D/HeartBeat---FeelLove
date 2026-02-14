
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RefreshCw, Heart, Trophy, UserPlus, Info, Zap } from 'lucide-react';

interface MazeRunProps {
  onClose?: () => void;
}

const ROWS = 25;
const COLS = 21;

type CellType = 'wall' | 'path' | 'start' | 'end' | 'trap';

const MazeRun: React.FC<MazeRunProps> = ({ onClose }) => {
  const [maze, setMaze] = useState<CellType[][]>([]);
  const [player, setPlayer] = useState({ x: 1, y: 1 });
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [message, setMessage] = useState('Explore the Heart!');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(true);

  // Heart mask function for level 1 shape
  const isInsideHeart = (x: number, y: number) => {
    // Normalizing coordinates to center the heart formula
    const nx = (x - COLS / 2) / (COLS / 2.8);
    const ny = (y - ROWS / 2.5) / (ROWS / 2.8);
    // Standard heart equation
    return Math.pow(nx * nx + ny * ny - 1, 3) - nx * nx * ny * ny * ny <= 0;
  };

  const generateMaze = useCallback(() => {
    setIsGenerating(true);
    const newMaze: CellType[][] = Array.from({ length: ROWS }, () => Array(COLS).fill('wall'));

    const directions = [
      [0, 2], [0, -2], [2, 0], [-2, 0]
    ];

    const shuffle = (array: any[]) => array.sort(() => Math.random() - 0.5);

    const carve = (x: number, y: number) => {
      newMaze[y][x] = 'path';
      const dirs = shuffle([...directions]);

      for (const [dx, dy] of dirs) {
        const nx = x + dx;
        const ny = y + dy;

        if (ny > 0 && ny < ROWS - 1 && nx > 0 && nx < COLS - 1 && newMaze[ny][nx] === 'wall') {
          // In Level 1, we only carve if the destination is inside the heart
          if (level === 1 && !isInsideHeart(nx, ny)) continue;
          
          newMaze[y + dy / 2][x + dx / 2] = 'path';
          carve(nx, ny);
        }
      }
    };

    // Level 1 starting point should be inside the heart
    let startX = 1, startY = 1;
    if (level === 1) {
      startX = Math.floor(COLS / 2);
      startY = Math.floor(ROWS / 4);
      while (!isInsideHeart(startX, startY)) startY++;
    }

    carve(startX, startY);

    // Set Start and End
    newMaze[startY][startX] = 'start';
    
    // Find a far away end point
    let endX = startX, endY = startY;
    let maxDist = 0;
    for (let y = 1; y < ROWS - 1; y++) {
      for (let x = 1; x < COLS - 1; x++) {
        if (newMaze[y][x] === 'path') {
          const dist = Math.hypot(x - startX, y - startY);
          if (dist > maxDist) {
            maxDist = dist;
            endX = x;
            endY = y;
          }
        }
      }
    }
    newMaze[endY][endX] = 'end';

    // Add Traps (only after level 1 to keep level 1 clean and focused on the shape)
    if (level > 1) {
      let trapCount = 2 + Math.floor(level * 1.5);
      while (trapCount > 0) {
        const tx = Math.floor(Math.random() * (COLS - 2)) + 1;
        const ty = Math.floor(Math.random() * (ROWS - 2)) + 1;
        if (newMaze[ty][tx] === 'path' && !(tx === startX && ty === startY) && !(tx === endX && ty === endY)) {
          newMaze[ty][tx] = 'trap';
          trapCount--;
        }
      }
    }

    setMaze(newMaze);
    setPlayer({ x: startX, y: startY });
    setIsGenerating(false);
    setMessage(level === 1 ? 'Heart Labyrinth' : `Level ${level}`);
  }, [level]);

  useEffect(() => {
    generateMaze();
  }, [generateMaze]);

  const movePlayer = (dx: number, dy: number) => {
    if (gameOver || won || isGenerating) return;

    const nx = player.x + dx;
    const ny = player.y + dy;

    if (ny >= 0 && ny < ROWS && nx >= 0 && nx < COLS && maze[ny][nx] !== 'wall') {
      const cell = maze[ny][nx];
      
      if (cell === 'trap') {
        if (navigator.vibrate) navigator.vibrate(100);
        setLives(l => {
          const newLives = l - 1;
          if (newLives <= 0) {
            setGameOver(true);
            setMessage("Game Over!");
          } else {
            setMessage("Blocked!");
            const startX = maze.findIndex(row => row.includes('start'));
            const startY = maze[startX].indexOf('start');
            setPlayer({ x: startY, y: startX }); 
          }
          return newLives;
        });
        return;
      }

      setPlayer({ x: nx, y: ny });

      if (cell === 'end') {
        if (navigator.vibrate) navigator.vibrate([50, 50, 50]);
        setWon(true);
        setMessage("Labyrinth Solved!");
      }
    }
  };

  const nextLevel = () => {
    setLevel(l => l + 1);
    setWon(false);
    generateMaze();
  };

  const restartGame = () => {
    setLevel(1);
    setLives(3);
    setGameOver(false);
    setWon(false);
    generateMaze();
  };

  // Canvas Rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || maze.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const renderCellSize = Math.min(canvas.width / COLS, canvas.height / ROWS);
    const xOffset = (canvas.width - renderCellSize * COLS) / 2;
    const yOffset = (canvas.height - renderCellSize * ROWS) / 2;

    maze.forEach((row, y) => {
      row.forEach((cell, x) => {
        const cx = xOffset + x * renderCellSize;
        const cy = yOffset + y * renderCellSize;

        if (cell === 'wall') {
          if (level === 1) {
            // Invisible walls for the heart level to make it feel more "traced" like the image
            return;
          }
          ctx.fillStyle = '#1e293b'; 
          ctx.fillRect(cx, cy, renderCellSize + 0.5, renderCellSize + 0.5);
          ctx.fillStyle = '#334155';
          ctx.fillRect(cx + 2, cy + 2, renderCellSize - 4, renderCellSize - 4);
        } else {
          // Path Rendering
          ctx.fillStyle = '#111';
          ctx.fillRect(cx, cy, renderCellSize, renderCellSize);
          
          if (level === 1) {
            // Draw an arrow design mimicking the provided image for level 1
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx + renderCellSize / 2, cy);
            ctx.lineTo(cx + renderCellSize / 2, cy + renderCellSize);
            ctx.moveTo(cx, cy + renderCellSize / 2);
            ctx.lineTo(cx + renderCellSize, cy + renderCellSize / 2);
            ctx.stroke();

            // Decorative arrow head for path cells
            if (cell === 'path' || cell === 'start') {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.beginPath();
                ctx.moveTo(cx + renderCellSize / 2, cy + 4);
                ctx.lineTo(cx + renderCellSize / 2 + 4, cy + 10);
                ctx.lineTo(cx + renderCellSize / 2 - 4, cy + 10);
                ctx.fill();
            }
          }

          if (cell === 'end') {
            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.arc(cx + renderCellSize/2, cy + renderCellSize/2, renderCellSize/2.5, 0, Math.PI * 2);
            ctx.fill();
            // Glow
            ctx.shadowBlur = 10; ctx.shadowColor = '#22c55e';
            ctx.stroke(); ctx.shadowBlur = 0;
          }
          
          if (cell === 'trap') {
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(cx + renderCellSize/2, cy + renderCellSize/2, renderCellSize/3, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      });
    });

    // Draw Player
    const px = xOffset + player.x * renderCellSize;
    const py = yOffset + player.y * renderCellSize;
    
    const gradient = ctx.createRadialGradient(
        px + renderCellSize/2, py + renderCellSize/2, renderCellSize * 0.1,
        px + renderCellSize/2, py + renderCellSize/2, renderCellSize * 1.2
    );
    gradient.addColorStop(0, 'rgba(6, 182, 212, 0.9)'); 
    gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(px - renderCellSize, py - renderCellSize, renderCellSize * 3, renderCellSize * 3);

    ctx.fillStyle = '#22d3ee';
    ctx.beginPath();
    ctx.arc(px + renderCellSize/2, py + renderCellSize/2, renderCellSize/3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke();

  }, [maze, player, level]);

  return (
    <div className="flex flex-col w-full h-full bg-[#050505] relative pt-12">
       {/* BRANDING HEADER */}
       <div className="w-full flex items-center justify-between mb-4 px-6 z-30 relative shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-[#0f111a] flex items-center justify-center border border-[#1e2235] shadow-2xl ring-1 ring-white/5">
             <span className="text-2xl">{level === 1 ? '💖' : '🌀'}</span>
          </div>
          <div className="flex flex-col text-left">
            <h2 className="text-sm font-black uppercase tracking-[3px] text-white leading-none">Maze Run</h2>
            <div className="flex items-center space-x-1.5 mt-1.5">
              <div className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_8px_#06b6d4]"></div>
              <span className="text-[8px] text-white/30 font-black uppercase tracking-widest">
                  {level === 1 ? 'Arrow Heart' : 'Arena Challenge'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2.5">
          <button onClick={onClose} className="h-11 px-5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all active:scale-95 group shadow-lg flex items-center">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">Quit</span>
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex justify-between items-center px-8 mb-4">
        <div className="flex items-center space-x-1">
            {Array.from({ length: 3 }).map((_, i) => (
                <Heart key={i} size={20} className={i < lives ? "text-red-500 fill-red-500" : "text-white/10"} />
            ))}
        </div>
        <div className="px-4 py-1.5 bg-white/5 rounded-full border border-white/5 shadow-inner">
            <span className="text-[10px] font-black uppercase text-white/80 tracking-widest">{message}</span>
        </div>
        <div className="flex items-center space-x-2">
            <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Lv {level}</span>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 relative flex items-center justify-center bg-[#0a0a0a] border-y border-white/5 overflow-hidden">
        <canvas 
            ref={canvasRef} 
            width={340} 
            height={460} 
            className="w-full h-full object-contain"
        />
        
        {(gameOver || won) && (
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-in zoom-in duration-300">
                {won ? (
                    <div className="text-center px-10">
                        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl border border-green-500/30">
                            <Trophy size={48} className="text-green-500 animate-bounce" />
                        </div>
                        <h3 className="text-4xl font-black italic uppercase text-white mb-2 tracking-tighter">Conquered</h3>
                        <p className="text-white/40 font-black text-[10px] uppercase tracking-[4px] mb-12">Next Arena Awaits</p>
                        <button onClick={nextLevel} className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center space-x-2">
                            <span>Proceed</span>
                            <ArrowRight size={18} />
                        </button>
                    </div>
                ) : (
                    <div className="text-center px-10">
                        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl border border-red-500/30">
                            <Zap size={48} className="text-red-500" />
                        </div>
                        <h3 className="text-4xl font-black italic uppercase text-white mb-2 tracking-tighter">Blocked</h3>
                        <p className="text-white/40 font-black text-[10px] uppercase tracking-[4px] mb-12">Heart Lost</p>
                        <button onClick={restartGame} className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center space-x-2">
                             <RefreshCw size={16} /> <span>Try Again</span>
                        </button>
                    </div>
                )}
            </div>
        )}
      </div>

      {/* Controls */}
      <div className="h-48 shrink-0 flex items-center justify-center pb-10 pt-4">
        <div className="grid grid-cols-3 gap-3">
            <div />
            <button 
                onPointerDown={() => movePlayer(0, -1)}
                className="w-16 h-16 bg-white/5 rounded-[1.5rem] border border-white/10 flex items-center justify-center active:bg-white/20 active:scale-90 transition-all shadow-lg"
            >
                <ArrowUp size={28} className="text-white/80" />
            </button>
            <div />
            <button 
                onPointerDown={() => movePlayer(-1, 0)}
                className="w-16 h-16 bg-white/5 rounded-[1.5rem] border border-white/10 flex items-center justify-center active:bg-white/20 active:scale-90 transition-all shadow-lg"
            >
                <ArrowLeft size={28} className="text-white/80" />
            </button>
            <button 
                onPointerDown={() => movePlayer(0, 1)}
                className="w-16 h-16 bg-white/5 rounded-[1.5rem] border border-white/10 flex items-center justify-center active:bg-white/20 active:scale-90 transition-all shadow-lg"
            >
                <ArrowDown size={28} className="text-white/80" />
            </button>
            <button 
                onPointerDown={() => movePlayer(1, 0)}
                className="w-16 h-16 bg-white/5 rounded-[1.5rem] border border-white/10 flex items-center justify-center active:bg-white/20 active:scale-90 transition-all shadow-lg"
            >
                <ArrowRight size={28} className="text-white/80" />
            </button>
        </div>
      </div>
    </div>
  );
};

export default MazeRun;
