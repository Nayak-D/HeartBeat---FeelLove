
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, Trophy, ArrowUp, RotateCcw, Zap, Flame, Target as TargetIcon, Move, Sparkles } from 'lucide-react';

const CANVAS_WIDTH = 340;
const CANVAS_HEIGHT = 500;
const GRAVITY = 0.08;

interface Arrow {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  active: boolean;
}

interface TargetHeart {
  id: string;
  x: number;
  y: number;
  size: number;
  speed: number;
  drift: number;
  points: number;
  color: string;
  popped: boolean;
  type: 'slow' | 'medium' | 'fast';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

interface ArcheryProps {
  onClose?: () => void;
}

const Archery: React.FC<ArcheryProps> = ({ onClose }) => {
  const [score, setScore] = useState(0);
  const [arrowsRemaining, setArrowsRemaining] = useState(15);
  const [isAiming, setIsAiming] = useState(false);
  const [aimPoint, setAimPoint] = useState<{ x: number, y: number } | null>(null);
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [hearts, setHearts] = useState<TargetHeart[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [lastScoreText, setLastScoreText] = useState<{ text: string, x: number, y: number } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);

  const initGame = useCallback(() => {
    setScore(0);
    setArrowsRemaining(15);
    setArrows([]);
    setHearts([]);
    setParticles([]);
    setGameOver(false);
    setLastScoreText(null);
  }, []);

  const spawnHeart = useCallback(() => {
    if (gameOver || hearts.length > 12) return;
    
    const rand = Math.random();
    let type: 'slow' | 'medium' | 'fast' = 'slow';
    let size = 32;
    let speed = 0.8 + Math.random() * 0.5;
    let points = 10;
    let color = '#ff758f';

    if (rand > 0.85) {
      type = 'fast';
      size = 14;
      speed = 2.8 + Math.random() * 1.2;
      points = 50;
      color = '#fbbf24'; // Golden fast heart
    } else if (rand > 0.5) {
      type = 'medium';
      size = 22;
      speed = 1.6 + Math.random() * 0.7;
      points = 25;
      color = '#ff2d55'; // Standard hot pink
    }

    const newHeart: TargetHeart = {
      id: Math.random().toString(),
      x: 40 + Math.random() * (CANVAS_WIDTH - 80),
      y: CANVAS_HEIGHT + 20,
      size,
      speed,
      drift: (Math.random() - 0.5) * 0.8,
      points,
      color,
      popped: false,
      type
    };

    setHearts(prev => [...prev, newHeart]);
  }, [gameOver, hearts.length]);

  useEffect(() => {
    const timer = setInterval(spawnHeart, 1200);
    return () => clearInterval(timer);
  }, [spawnHeart]);

  const createExplosion = (x: number, y: number, color: string) => {
    const newParticles = Array.from({ length: 12 }).map(() => ({
      x, y,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.5) * 5,
      life: 1.0,
      color,
      size: 2 + Math.random() * 3
    }));
    setParticles(prev => [...prev, ...newParticles]);
  };

  const update = useCallback(() => {
    if (gameOver) return;

    // Update Particles
    setParticles(prev => prev.map(p => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      life: p.life - 0.04
    })).filter(p => p.life > 0));

    // Update Hearts
    setHearts(prev => prev.map(h => ({
      ...h,
      y: h.y - h.speed,
      x: h.x + h.drift
    })).filter(h => h.y > -50 && !h.popped));

    // Update Arrows
    setArrows(prev => {
      const next = prev.map(a => {
        if (!a.active) return a;
        
        let nx = a.x + a.vx;
        let ny = a.y + a.vy;
        let nvx = a.vx;
        let nvy = a.vy + GRAVITY;
        let nAngle = Math.atan2(nvy, nvx);

        // Check Collision with Hearts
        let hit = false;
        setHearts(currentHearts => {
          let updated = false;
          const nextHearts = currentHearts.map(h => {
            if (h.popped) return h;
            const dist = Math.hypot(nx - h.x, ny - h.y);
            if (dist < h.size + 4) {
              hit = true;
              updated = true;
              setScore(s => s + h.points);
              setLastScoreText({ text: `+${h.points}`, x: h.x, y: h.y });
              createExplosion(h.x, h.y, h.color);
              if (navigator.vibrate) navigator.vibrate(h.type === 'fast' ? [30, 20, 30] : 15);
              return { ...h, popped: true };
            }
            return h;
          });
          return updated ? nextHearts : currentHearts;
        });

        if (hit || nx < -20 || nx > CANVAS_WIDTH + 20 || ny > CANVAS_HEIGHT + 20 || ny < -100) {
          return { ...a, active: false };
        }

        return { ...a, x: nx, y: ny, vx: nvx, vy: nvy, angle: nAngle };
      });
      return next.filter(a => a.active);
    });

    requestRef.current = requestAnimationFrame(update);
  }, [gameOver]);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(update);
    return () => cancelAnimationFrame(requestRef.current);
  }, [update]);

  const drawHeart = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.shadowBlur = size / 3;
    ctx.shadowColor = color;
    ctx.beginPath();
    ctx.moveTo(0, size / 4);
    ctx.bezierCurveTo(0, 0, -size, 0, -size, size / 2);
    ctx.bezierCurveTo(-size, size, 0, size * 1.2, 0, size * 1.5);
    ctx.bezierCurveTo(0, size * 1.2, size, size, size, size / 2);
    ctx.bezierCurveTo(size, 0, 0, 0, 0, size / 4);
    ctx.fill();
    ctx.restore();
  };

  const drawArcher = (ctx: CanvasRenderingContext2D, x: number, y: number, angle: number, pull: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Arm (Stylized shadow)
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.ellipse(-20, 0, 40, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bow Limbs
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -60);
    ctx.quadraticCurveTo(30, 0, 0, 60);
    ctx.stroke();

    // String
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -60);
    ctx.lineTo(-pull * 0.7, 0);
    ctx.lineTo(0, 60);
    ctx.stroke();

    ctx.restore();
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Grid Background
    ctx.strokeStyle = 'rgba(255,255,255,0.02)';
    ctx.lineWidth = 1;
    for (let i = 0; i < CANVAS_HEIGHT; i += 40) {
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(CANVAS_WIDTH, i); ctx.stroke();
    }

    // Draw Particles
    particles.forEach(p => {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Draw Hearts
    hearts.forEach(h => drawHeart(ctx, h.x, h.y, h.size, h.color));

    // Draw Arrows
    arrows.forEach(a => {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(0, 0); ctx.stroke();
      ctx.fillStyle = '#ff2d55';
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-8, -3); ctx.lineTo(-8, 3); ctx.fill();
      ctx.restore();
    });

    // Draw Archer (Fixed at bottom middle)
    const archerX = CANVAS_WIDTH / 2;
    const archerY = CANVAS_HEIGHT - 60;
    
    if (isAiming && aimPoint) {
      const dx = aimPoint.x - archerX;
      const dy = aimPoint.y - archerY;
      const angle = Math.atan2(dy, dx);
      const pull = Math.min(Math.hypot(dx, dy), 80);
      
      // Aiming Guide
      ctx.setLineDash([5, 10]);
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.beginPath();
      ctx.moveTo(archerX, archerY);
      ctx.lineTo(archerX - Math.cos(angle) * pull * 3, archerY - Math.sin(angle) * pull * 3);
      ctx.stroke();
      ctx.setLineDash([]);

      drawArcher(ctx, archerX, archerY, angle + Math.PI, pull);
    } else if (!gameOver) {
      drawArcher(ctx, archerX, archerY, -Math.PI / 2, 0);
    }
  }, [arrows, hearts, particles, isAiming, aimPoint, gameOver]);

  useEffect(() => { draw(); }, [draw]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (gameOver || arrowsRemaining <= 0) return;
    setIsAiming(true);
    updateAim(e);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isAiming) updateAim(e);
  };

  const updateAim = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * CANVAS_WIDTH;
    const y = ((e.clientY - rect.top) / rect.height) * CANVAS_HEIGHT;
    setAimPoint({ x, y });
  };

  const handlePointerUp = () => {
    if (!isAiming || !aimPoint) return;
    setIsAiming(false);

    const archerX = CANVAS_WIDTH / 2;
    const archerY = CANVAS_HEIGHT - 60;
    const dx = aimPoint.x - archerX;
    const dy = aimPoint.y - archerY;
    const angle = Math.atan2(dy, dx);
    const pull = Math.min(Math.hypot(dx, dy) / 5.5, 14);

    if (pull > 2) {
      setArrows(prev => [...prev, {
        id: Math.random().toString(),
        x: archerX,
        y: archerY,
        vx: -Math.cos(angle) * pull,
        vy: -Math.sin(angle) * pull,
        angle: angle + Math.PI,
        active: true
      }]);
      setArrowsRemaining(prev => {
        const next = prev - 1;
        if (next === 0) setTimeout(() => setGameOver(true), 3500);
        return next;
      });
    }
    setAimPoint(null);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full bg-[#050505] text-white p-4 relative overflow-hidden">
      {/* HUD Overlay */}
      <div className="w-full max-w-[340px] flex justify-between items-center mb-6 z-10">
        <div className="flex flex-col">
          <span className="text-[9px] font-black uppercase text-white/30 tracking-[3.5px] mb-1">Hearts Scored</span>
          <div className="flex items-center space-x-2">
            <Heart size={18} fill="#ff2d55" className="text-[#ff2d55] animate-pulse" />
            <span className="text-3xl font-black italic tracking-tighter leading-none">{score}</span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[9px] font-black uppercase text-white/30 tracking-[3.5px] mb-1">Quiver</span>
          <div className="flex items-center space-x-1">
            {Array.from({ length: 15 }).map((_, i) => (
              <div 
                key={i} 
                className={`w-1 h-5 rounded-full transition-all duration-500 ${i < arrowsRemaining ? "bg-white shadow-[0_0_8px_#fff]" : "bg-white/5"}`} 
              />
            ))}
          </div>
        </div>
      </div>

      {/* Arena Canvas Container */}
      <div className="relative bg-[#0a0a0c] rounded-[3.5rem] border border-white/5 overflow-hidden shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] group">
        
        {/* Floating Hit Indicators */}
        {lastScoreText && (
          <div key={Math.random()} className="absolute pointer-events-none z-30 animate-hit-float" style={{ left: lastScoreText.x, top: lastScoreText.y - 20 }}>
            <span className="text-xl font-black italic tracking-tight text-white drop-shadow-lg">{lastScoreText.text}</span>
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="touch-none cursor-crosshair"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
        
        {/* Interactive Tip */}
        {!isAiming && !gameOver && arrowsRemaining > 0 && (
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 pointer-events-none opacity-40 animate-pulse flex flex-col items-center">
             <div className="w-8 h-8 rounded-full border border-white/30 flex items-center justify-center mb-2">
                <Move size={14} className="text-white" />
             </div>
             <span className="text-[8px] font-black uppercase tracking-[3px]">Drag & Release</span>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="mt-8 w-full max-w-[340px] flex space-x-4 z-10">
        <button onClick={onClose} className="flex-1 py-4 bg-white/5 border border-white/5 rounded-2xl font-black uppercase text-[10px] tracking-widest text-white/30 hover:text-white transition-all">Quit Arena</button>
        <button onClick={initGame} className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 active:scale-90 transition-all group">
          <RotateCcw size={20} className="text-white/20 group-hover:text-white" />
        </button>
      </div>

      {/* Game Over Screen */}
      {gameOver && (
        <div className="absolute inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-8 animate-in zoom-in duration-500">
          <div className="w-full max-w-sm text-center space-y-8">
            <div className="relative w-24 h-24 bg-gradient-to-br from-[#ff2d55] to-[#fbbf24] rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl">
              <Trophy size={44} className="text-white" />
            </div>
            
            <div>
              <h4 className="text-4xl font-black italic tracking-tighter uppercase mb-1">Season End</h4>
              <p className="text-white/30 font-black tracking-[4px] uppercase text-[10px] italic">Total Hearts Gathered</p>
            </div>

            <div className="bg-white/5 p-10 rounded-[3rem] border border-white/5">
               <span className="text-7xl font-black italic text-white tracking-tighter leading-none">{score}</span>
            </div>

            <button onClick={initGame} className="w-full py-6 bg-white text-black rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center space-x-3 active:scale-95 transition-all">
              <span>Try Again</span>
              <RotateCcw size={18} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes hit-float {
          0% { transform: translateY(0) scale(0.5); opacity: 0; }
          20% { opacity: 1; transform: translateY(-20px) scale(1.2); }
          100% { transform: translateY(-60px) scale(1); opacity: 0; }
        }
        .animate-hit-float {
          animation: hit-float 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Archery;
