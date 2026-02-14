
import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Bot, Users, Sparkles, User, Play, ChevronRight, UserPlus, Share2, X, AlertCircle, Loader2 } from 'lucide-react';

interface Coin {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: 'white' | 'black' | 'pink' | 'gold';
  actualColor: string;
  active: boolean;
  potted: boolean;
  scale: number;
  points: number;
  owner: 'p1' | 'p2' | 'neutral';
  isStriker?: boolean;
  mass: number;
}

const BOARD_SIZE = 280; 
const POCKET_RADIUS = 20; 
const POCKET_INSET = 20;
const COIN_RADIUS = 7.5;
const STRIKER_RADIUS = 12;
const MIN_SPEED = 0.08;
const MAX_STRIKE_POWER = 9.5; // Decreased to a balanced medium-low for realistic physics

const COIN_MASS = 1.0;
const STRIKER_MASS = 2.4;
const DRAG_COIN = 0.985; 
const DRAG_STRIKER = 0.989; 
const BOUNCINESS = 0.45;
const WALL_BOUNCE = 0.6;

const BASELINE_Y_P1 = BOARD_SIZE - 50;
const BASELINE_Y_P2 = 50;

type QueenStatus = 'OnBoard' | 'PocketedUncovered' | 'CoveredP1' | 'CoveredP2';
type AiState = 'IDLE' | 'THINKING' | 'MOVING' | 'AIMING' | 'STRIKING';

// Professional White Flower Striker Logo
const StrikerLogo = ({ size = 24 }: { size?: number }) => (
  <div 
    style={{ width: size, height: size }} 
    className="rounded-full bg-gradient-to-br from-white via-[#fcfcfc] to-[#ebebeb] border-[0.5px] border-black/10 shadow-lg flex items-center justify-center relative overflow-hidden"
  >
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,1)_0%,transparent_75%)] opacity-90" />
    <div className="relative w-[75%] h-[75%] flex items-center justify-center">
       <div className="absolute w-[20%] h-[20%] rounded-full bg-red-600 shadow-[0_0_2px_rgba(0,0,0,0.2)]" />
       {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
         <div 
           key={angle} 
           className="absolute w-[35%] h-[1.5px] bg-red-600/40 rounded-full origin-left left-1/2"
           style={{ transform: `rotate(${angle}deg)` }}
         />
       ))}
       <div className="absolute w-full h-full border-[1px] border-red-600/10 rounded-full" />
       <div className="absolute w-[80%] h-[80%] border-[1px] border-red-600/15 rounded-full" />
    </div>
  </div>
);

interface CarromProProps {
  onInvite: () => void;
  onClose: () => void;
}

const CarromPro: React.FC<CarromProProps> = ({ onInvite, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gamePartner, setGamePartner] = useState<'Bot' | 'Friend' | null>(null);
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [turn, setTurn] = useState<'p1' | 'p2'>('p1');
  const [strikerX, setStrikerX] = useState(BOARD_SIZE / 2);
  const [isAiming, setIsAiming] = useState(false);
  const [aimPoint, setAimPoint] = useState<{ x: number, y: number } | null>(null);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [isMoving, setIsMoving] = useState(false);
  const [message, setMessage] = useState('Break the Rack!');
  const [gameOver, setGameOver] = useState(false);
  const [queenPocketedThisTurn, setQueenPocketedThisTurn] = useState(false);
  const [queenStatus, setQueenStatus] = useState<QueenStatus>('OnBoard');
  
  const [aiState, setAiState] = useState<AiState>('IDLE');
  const aiTargetX = useRef(BOARD_SIZE / 2);
  const aiTargetAngle = useRef(0);
  const aiTargetPower = useRef(0);
  const aiAimLength = useRef(0);

  const pottedThisShotRef = useRef<Coin[]>([]);
  const lastIsMovingRef = useRef<boolean>(false);
  const requestRef = useRef<number>(0);

  const pocketCenters = useMemo(() => [
    [POCKET_INSET, POCKET_INSET],
    [BOARD_SIZE - POCKET_INSET, POCKET_INSET],
    [POCKET_INSET, BOARD_SIZE - POCKET_INSET],
    [BOARD_SIZE - POCKET_INSET, BOARD_SIZE - POCKET_INSET]
  ], []);

  const checkOverlap = useCallback((x: number, y: number, radius: number, coinsList: Coin[]) => {
    return coinsList.some(c => {
      if (!c.active || c.potted || c.isStriker) return false;
      const dist = Math.hypot(c.x - x, c.y - y);
      return dist < (c.radius + radius + 1);
    });
  }, []);

  const isPlacementValid = useMemo(() => {
    const baselineY = turn === 'p1' ? BASELINE_Y_P1 : BASELINE_Y_P2;
    return !checkOverlap(strikerX, baselineY, STRIKER_RADIUS, coins);
  }, [strikerX, turn, coins, checkOverlap]);

  const initBoard = useCallback(() => {
    const center = BOARD_SIZE / 2;
    const initialCoins: Coin[] = [];
    initialCoins.push({
      id: 'queen', x: center, y: center, vx: 0, vy: 0, radius: COIN_RADIUS,
      color: 'pink', actualColor: '#FF2D55', active: true, potted: false, scale: 1, points: 50, owner: 'neutral', mass: COIN_MASS
    });

    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI * 2) / 6;
      const type = i % 2 === 0 ? 'white' : 'black';
      initialCoins.push({
        id: `inner-${i}`, x: center + Math.cos(angle) * (COIN_RADIUS * 2.1), y: center + Math.sin(angle) * (COIN_RADIUS * 2.1),
        vx: 0, vy: 0, radius: COIN_RADIUS, color: type, actualColor: type === 'white' ? '#FFFFFF' : '#333333',
        active: true, potted: false, scale: 1, points: type === 'white' ? 20 : 10, owner: 'neutral', mass: COIN_MASS
      });
    }

    for (let i = 0; i < 12; i++) {
      const angle = (i * Math.PI * 2) / 12;
      const type = i % 2 === 0 ? 'black' : 'white'; 
      initialCoins.push({
        id: `outer-${i}`, x: center + Math.cos(angle + 0.5) * (COIN_RADIUS * 4.2), y: center + Math.sin(angle + 0.5) * (COIN_RADIUS * 4.2),
        vx: 0, vy: 0, radius: COIN_RADIUS, color: type, actualColor: type === 'white' ? '#FFFFFF' : '#333333',
        active: true, potted: false, scale: 1, points: type === 'white' ? 20 : 10, owner: 'neutral', mass: COIN_MASS
      });
    }

    setCoins(initialCoins);
    setP1Score(0); setP2Score(0);
    setGameOver(false); setIsMoving(false);
    setQueenStatus('OnBoard'); setQueenPocketedThisTurn(false);
    setTurn('p1'); setMessage('Break the Rack!');
    setAiState('IDLE');
    pottedThisShotRef.current = [];
  }, []);

  useEffect(() => { if (gamePartner) initBoard(); }, [gamePartner, initBoard]);

  const performStrike = (x: number, angle: number, power: number) => {
    if (isMoving || gameOver) return;
    const baselineY = turn === 'p1' ? BASELINE_Y_P1 : BASELINE_Y_P2;
    if (checkOverlap(x, baselineY, STRIKER_RADIUS, coins)) return;

    pottedThisShotRef.current = [];
    const striker: Coin = {
      id: 'striker', x, y: baselineY, vx: -Math.cos(angle) * power, vy: -Math.sin(angle) * power,
      radius: STRIKER_RADIUS, color: 'gold', actualColor: '#FFD700', active: true, potted: false, scale: 1, points: 0,
      owner: 'neutral', isStriker: true, mass: STRIKER_MASS
    };
    setCoins(prev => [...prev.filter(c => !c.isStriker), striker]);
    setIsMoving(true);
    if (navigator.vibrate) navigator.vibrate(30);
  };

  useEffect(() => {
    if (gamePartner === 'Bot' && turn === 'p2' && !isMoving && !gameOver) {
      if (aiState === 'IDLE') {
        const thinkTime = 800 + Math.random() * 800;
        const timer = setTimeout(() => setAiState('THINKING'), thinkTime);
        return () => clearTimeout(timer);
      } else if (aiState === 'THINKING') {
        const activeCoins = coins.filter(c => c.active && !c.potted && !c.isStriker);
        const possibleShots: any[] = [];

        activeCoins.forEach(coin => {
          pocketCenters.forEach(pocket => {
            // Vector from pocket to coin (to find where to hit the coin)
            const dx_cp = coin.x - pocket[0];
            const dy_cp = coin.y - pocket[1];
            const dist_cp = Math.hypot(dx_cp, dy_cp);
            
            // Normalize direction from pocket to coin
            const ux = dx_cp / dist_cp;
            const uy = dy_cp / dist_cp;

            // Target collision point for the striker to push coin into pocket
            // The striker center must be here to collide precisely
            const targetX = coin.x + ux * (COIN_RADIUS + STRIKER_RADIUS - 0.2);
            const targetY = coin.y + uy * (COIN_RADIUS + STRIKER_RADIUS - 0.2);

            // Calculate where the striker must start on the baseline to hit this target point
            // We use the linear projection: (targetY - BASELINE_Y_P2) / (targetX - strikerX) = (targetY - coin.y) / (targetX - coin.x)
            // But a simpler way: the striker travels from (strikerX, BASELINE_Y_P2) to (targetX, targetY)
            // The line equation: y - BASELINE_Y_P2 = m * (x - strikerX)
            // Solving for strikerX when the line passes through (targetX, targetY):
            // strikerX = targetX - (targetY - BASELINE_Y_P2) / m
            
            // To make it simple, we assume the AI can choose any strikerX on the baseline.
            // Let's find an ideal strikerX that provides a comfortable angle.
            // If we want a direct shot: strikerX = targetX (if targetY is directly below/above)
            // If target is diagonal, we calculate a viable baseline position.
            
            // For a straight shot at the target collision point:
            const dy_st = targetY - BASELINE_Y_P2;
            const dx_st = targetX - (targetX); // placeholder for finding ideal x

            // We iterate a few viable strikerX positions to see which one works best
            for (let sx = 45; sx <= BOARD_SIZE - 45; sx += 5) {
              if (checkOverlap(sx, BASELINE_Y_P2, STRIKER_RADIUS, coins)) continue;

              const angle = Math.atan2(BASELINE_Y_P2 - targetY, sx - targetX);
              const dist_st = Math.hypot(sx - targetX, BASELINE_Y_P2 - targetY);

              // FOUL AVOIDANCE: If the striker is aimed directly at a pocket, skip it
              let wouldFoul = false;
              pocketCenters.forEach(p => {
                 const dx_sp = p[0] - sx;
                 const dy_sp = p[1] - BASELINE_Y_P2;
                 const dist_sp = Math.hypot(dx_sp, dy_sp);
                 const angle_sp = Math.atan2(dy_sp, dx_sp);
                 // If the shot angle is too close to a pocket angle, it's risky
                 if (Math.abs(angle - (angle_sp + Math.PI)) < 0.1) wouldFoul = true;
              });
              if (wouldFoul) continue;

              // Calculate power based on distance
              const neededPower = Math.min(4.5 + (dist_st / 55) + (dist_cp / 70), MAX_STRIKE_POWER);
              
              let score = 200 / dist_cp; // Closer to pocket is better
              if (coin.color === 'pink') score *= 5; // Prioritize Queen
              if (coin.color === 'white') score *= 1.5; // Prioritize White
              
              // Prefer more direct shots (strikerX closer to targetX)
              score -= Math.abs(sx - targetX) / 10;

              possibleShots.push({ sx, angle, power: neededPower, score });
            }
          });
        });

        if (possibleShots.length > 0) {
          // Add some "perfect" intelligence: sort by score and pick best
          possibleShots.sort((a, b) => b.score - a.score);
          const choice = possibleShots[0];
          aiTargetX.current = choice.sx;
          aiTargetAngle.current = choice.angle;
          aiTargetPower.current = choice.power;
        } else {
          // If no good shots, just do a random scatter
          aiTargetX.current = 45 + Math.random() * (BOARD_SIZE - 90);
          aiTargetAngle.current = Math.PI / 2;
          aiTargetPower.current = 5;
        }
        setAiState('MOVING');
      } else if (aiState === 'MOVING') {
        const moveStep = () => {
          setStrikerX(prev => {
            const diff = aiTargetX.current - prev;
            if (Math.abs(diff) < 1.0) {
              setAiState('AIMING');
              return aiTargetX.current;
            }
            return prev + diff * 0.15;
          });
        };
        const timer = setTimeout(moveStep, 16);
        return () => clearTimeout(timer);
      } else if (aiState === 'AIMING') {
        const aimStep = () => {
          aiAimLength.current += 0.05;
          const currentLength = Math.min(aiAimLength.current, 1.0);
          setIsAiming(true);
          const currentPower = aiTargetPower.current * currentLength;
          setAimPoint({
            x: strikerX + Math.cos(aiTargetAngle.current) * (30 + currentPower * 8),
            y: BASELINE_Y_P2 + Math.sin(aiTargetAngle.current) * (30 + currentPower * 8)
          });
          if (currentLength >= 1.0) {
            setTimeout(() => setAiState('STRIKING'), 300);
          } else {
            setTimeout(aimStep, 20);
          }
        };
        const timer = setTimeout(aimStep, 200);
        return () => clearTimeout(timer);
      } else if (aiState === 'STRIKING') {
        setIsAiming(false);
        aiAimLength.current = 0;
        performStrike(strikerX, aiTargetAngle.current, aiTargetPower.current);
        setAiState('IDLE');
      }
    }
  }, [gamePartner, turn, isMoving, gameOver, aiState, strikerX, coins]);

  useEffect(() => {
    if (lastIsMovingRef.current === true && isMoving === false) {
      let pottedCount = 0;
      let queenPottedThisShot = false;
      let strikerFoul = false;
      pottedThisShotRef.current.forEach(p => {
        if (p.isStriker) { strikerFoul = true; if (turn === 'p1') setP1Score(s => Math.max(0, s - 10)); else setP2Score(s => Math.max(0, s - 10)); }
        else if (p.color === 'pink') { queenPottedThisShot = true; }
        else { pottedCount++; if (turn === 'p1') setP1Score(s => s + p.points); else setP2Score(s => s + p.points); }
      });
      if (queenPocketedThisTurn) {
        if (pottedCount > 0) { setQueenStatus(turn === 'p1' ? 'CoveredP1' : 'CoveredP2'); if (turn === 'p1') setP1Score(s => s + 50); else setP2Score(s => s + 50); setQueenPocketedThisTurn(false); setMessage("Queen Secured!"); }
        else { setQueenStatus('OnBoard'); setQueenPocketedThisTurn(false); setCoins(prev => prev.map(c => c.id === 'queen' ? { ...c, active: true, potted: false, scale: 1, x: BOARD_SIZE/2, y: BOARD_SIZE/2, vx: 0, vy: 0 } : c)); setTurn(t => t === 'p1' ? 'p2' : 'p1'); setMessage("Queen Returned!"); }
      } else if (queenPottedThisShot) { setQueenPocketedThisTurn(true); setQueenStatus('PocketedUncovered'); setMessage("Cover the Queen!"); }
      else if (strikerFoul || (pottedCount === 0 && !queenPottedThisShot)) { setTurn(t => t === 'p1' ? 'p2' : 'p1'); setMessage(turn === 'p1' ? "P2 Turn" : "P1 Turn"); }
      else { setMessage("Strike Again!"); }
      setCoins(prev => {
        const cleaned = prev.filter(c => !c.isStriker);
        if (cleaned.filter(c => c.active && c.id !== 'queen').length === 0) setGameOver(true);
        return cleaned;
      });
    }
    lastIsMovingRef.current = isMoving;
  }, [isMoving, turn, queenPocketedThisTurn]);

  const updatePhysics = useCallback(() => {
    if (!isMoving) return;
    setCoins(prevCoins => {
      let stillMoving = false;
      const nextCoins = prevCoins.map(c => ({ ...c }));
      const SUB_STEPS = 8;
      for (let step = 0; step < SUB_STEPS; step++) {
        nextCoins.forEach(coin => {
          if (!coin.active) return;
          if (coin.potted) { coin.scale *= 0.85; if (coin.scale < 0.1) coin.active = false; stillMoving = true; return; }
          coin.x += coin.vx / SUB_STEPS; coin.y += coin.vy / SUB_STEPS;
          const drag = coin.isStriker ? DRAG_STRIKER : DRAG_COIN;
          coin.vx *= Math.pow(drag, 1 / SUB_STEPS); coin.vy *= Math.pow(drag, 1 / SUB_STEPS);
          if (Math.hypot(coin.vx, coin.vy) < MIN_SPEED) { coin.vx = 0; coin.vy = 0; } else stillMoving = true;
          const boardMargin = 10;
          if (coin.x < coin.radius + boardMargin || coin.x > BOARD_SIZE - coin.radius - boardMargin) { coin.vx *= -WALL_BOUNCE; coin.x = Math.max(coin.radius + boardMargin, Math.min(BOARD_SIZE - coin.radius - boardMargin, coin.x)); }
          if (coin.y < coin.radius + boardMargin || coin.y > BOARD_SIZE - coin.radius - boardMargin) { coin.vy *= -WALL_BOUNCE; coin.y = Math.max(coin.radius + boardMargin, Math.min(BOARD_SIZE - coin.radius - boardMargin, coin.y)); }
          pocketCenters.forEach(p => { if (Math.hypot(coin.x - p[0], coin.y - p[1]) < POCKET_RADIUS) { if (!coin.potted) { coin.potted = true; pottedThisShotRef.current.push({ ...coin }); } } });
        });
        for (let i = 0; i < nextCoins.length; i++) {
          for (let j = i + 1; j < nextCoins.length; j++) {
            const c1 = nextCoins[i], c2 = nextCoins[j];
            if (!c1.active || !c2.active || c1.potted || c2.potted) continue;
            const dist = Math.hypot(c2.x - c1.x, c2.y - c1.y); const min = c1.radius + c2.radius;
            if (dist < min) {
              const nx = (c2.x - c1.x) / dist, ny = (c2.y - c1.y) / dist; const v1n = c1.vx * nx + c1.vy * ny, v2n = c2.vx * nx + c2.vy * ny;
              if (v1n - v2n <= 0) continue;
              const impulse = (1 + BOUNCINESS) * (v1n - v2n) / (1 / c1.mass + 1 / c2.mass);
              c1.vx -= (impulse / c1.mass) * nx; c1.vy -= (impulse / c1.mass) * ny; c2.vx += (impulse / c2.mass) * nx; c2.vy += (impulse / c2.mass) * ny;
              const overlap = min - dist; const totalMass = c1.mass + c2.mass;
              c1.x -= nx * overlap * (c2.mass / totalMass); c1.y -= ny * overlap * (c2.mass / totalMass); c2.x += nx * overlap * (c1.mass / totalMass); c2.y += ny * overlap * (c1.mass / totalMass);
            }
          }
        }
      }
      if (!stillMoving) setIsMoving(false);
      return nextCoins;
    });
    requestRef.current = requestAnimationFrame(updatePhysics);
  }, [isMoving, pocketCenters]);

  useEffect(() => {
    if (isMoving) requestRef.current = requestAnimationFrame(updatePhysics);
    else cancelAnimationFrame(requestRef.current);
    return () => cancelAnimationFrame(requestRef.current);
  }, [isMoving, updatePhysics]);

  const drawBoard = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#fce4bc'; ctx.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);
    ctx.lineWidth = 15; ctx.strokeStyle = '#23150d'; ctx.strokeRect(0, 0, BOARD_SIZE, BOARD_SIZE);
    pocketCenters.forEach(([x,y]) => {
      ctx.beginPath(); ctx.arc(x, y, POCKET_RADIUS, 0, Math.PI * 2); ctx.fillStyle = '#000000'; ctx.fill();
      const pocketGrad = ctx.createRadialGradient(x, y, POCKET_RADIUS * 0.7, x, y, POCKET_RADIUS);
      pocketGrad.addColorStop(0, 'rgba(0,0,0,0)'); pocketGrad.addColorStop(1, 'rgba(255,255,255,0.08)');
      ctx.fillStyle = pocketGrad; ctx.beginPath(); ctx.arc(x, y, POCKET_RADIUS, 0, Math.PI * 2); ctx.fill();
    });
    ctx.strokeStyle = 'rgba(78, 52, 46, 0.12)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(BOARD_SIZE/2, BOARD_SIZE/2, 65, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(BOARD_SIZE/2, BOARD_SIZE/2, 12, 0, Math.PI * 2); ctx.stroke();
    [BASELINE_Y_P1, BASELINE_Y_P2].forEach(by => {
      ctx.lineWidth = 1; ctx.strokeStyle = '#4e342e';
      ctx.beginPath(); ctx.moveTo(45, by - 8); ctx.lineTo(BOARD_SIZE - 45, by - 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(45, by + 8); ctx.lineTo(BOARD_SIZE - 45, by + 8); ctx.stroke();
      [45, BOARD_SIZE - 45].forEach(bx => { ctx.beginPath(); ctx.arc(bx, by, 8, 0, Math.PI * 2); ctx.stroke(); ctx.fillStyle = '#ff6d00'; ctx.beginPath(); ctx.arc(bx, by, 2.5, 0, Math.PI * 2); ctx.fill(); });
    });
  };

  const drawCoin = (ctx: CanvasRenderingContext2D, c: Coin, forceColor?: string) => {
    const r = (c.isStriker ? STRIKER_RADIUS : COIN_RADIUS) * c.scale;
    ctx.save(); ctx.translate(c.x, c.y); ctx.shadowBlur = 3; ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowOffsetY = 1.5;
    if (forceColor) { 
      ctx.fillStyle = forceColor; 
      ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill(); 
    } else if (c.isStriker) { 
       const grad = ctx.createRadialGradient(-r/3, -r/3, 0, 0, 0, r);
       grad.addColorStop(0, '#ffffff'); grad.addColorStop(1, '#ebebeb');
       ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
       ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 0.5; ctx.stroke();
       ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r*0.7, 0, Math.PI*2); ctx.clip();
       ctx.fillStyle = '#d63031'; ctx.beginPath(); ctx.arc(0, 0, r*0.18, 0, Math.PI*2); ctx.fill();
       ctx.strokeStyle = '#d63031'; ctx.lineWidth = 0.4; ctx.globalAlpha = 0.4;
       for(let i=0; i<8; i++){
          ctx.beginPath(); ctx.rotate(Math.PI/4); ctx.moveTo(r*0.12, 0); ctx.lineTo(r*0.6, 0); ctx.stroke();
       }
       ctx.globalAlpha = 1.0; ctx.restore();
       ctx.strokeStyle = 'rgba(0,0,0,0.05)'; ctx.lineWidth = 0.4; ctx.beginPath(); ctx.arc(0, 0, r*0.85, 0, Math.PI*2); ctx.stroke();
    } else {
       const grad = ctx.createRadialGradient(-r/3, -r/3, 0, 0, 0, r);
       if (c.color === 'pink') { grad.addColorStop(0, '#ff4d6d'); grad.addColorStop(1, '#c9184a'); }
       else if (c.color === 'white') { grad.addColorStop(0, '#ffffff'); grad.addColorStop(1, '#bdc3c7'); }
       else { grad.addColorStop(0, '#444444'); grad.addColorStop(1, '#000000'); }
       ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
       ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 0.8; ctx.stroke();
    }
    ctx.restore();
  };

  const drawAimingAnimation = (ctx: CanvasRenderingContext2D, sx: number, sy: number, angle: number, power: number) => {
    ctx.save();
    // 1. Trailing Dots (Dashed line behind striker)
    const dotCount = 6;
    const dotSpacing = 8;
    for (let i = 1; i <= dotCount; i++) {
        const dotDist = i * dotSpacing;
        const dx = Math.cos(angle) * dotDist;
        const dy = Math.sin(angle) * dotDist;
        ctx.beginPath();
        ctx.arc(sx + dx, sy + dy, 1.8 - (i * 0.2), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 0, 0, ${0.4 - i * 0.05})`;
        ctx.fill();
    }

    // 2. Tapered Gradient Arrow (Forwards)
    const arrowLength = 40 + power * 8; 
    const arrowWidth = 14;
    const ax = sx - Math.cos(angle) * STRIKER_RADIUS;
    const ay = sy - Math.sin(angle) * STRIKER_RADIUS;
    
    ctx.translate(ax, ay);
    ctx.rotate(angle + Math.PI); 

    const gradient = ctx.createLinearGradient(0, 0, arrowLength, 0);
    gradient.addColorStop(0, '#ffd32a'); 
    gradient.addColorStop(0.5, '#ff9f1a'); 
    gradient.addColorStop(1, '#ff3f34'); 

    ctx.beginPath();
    ctx.moveTo(0, -arrowWidth / 2);
    ctx.lineTo(arrowLength, 0);
    ctx.lineTo(0, arrowWidth / 2);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'rgba(255, 63, 52, 0.4)';
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(arrowLength * 0.8, 0);
    ctx.stroke();

    ctx.restore();
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);
    drawBoard(ctx);
    coins.forEach(c => { if (c.active) drawCoin(ctx, c); });
    if (!isMoving && !gameOver) {
        const baselineY = turn === 'p1' ? BASELINE_Y_P1 : BASELINE_Y_P2;
        const valid = isPlacementValid;
        const preview: Coin = { id: 'preview', x: strikerX, y: baselineY, vx: 0, vy: 0, radius: STRIKER_RADIUS, color: 'gold', actualColor: '#FFD700', active: true, potted: false, scale: 1, points: 0, owner: 'neutral', isStriker: true, mass: STRIKER_MASS };
        ctx.save(); ctx.translate(strikerX, baselineY); ctx.beginPath(); ctx.arc(0, 0, STRIKER_RADIUS + 3, 0, Math.PI * 2); ctx.strokeStyle = valid ? 'rgba(255, 179, 0, 0.3)' : 'rgba(239, 68, 68, 0.4)'; ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
        drawCoin(ctx, preview, valid ? undefined : '#ef4444');
        if (isAiming && aimPoint && (valid || turn === 'p2')) {
            const dx = aimPoint.x - strikerX, dy = aimPoint.y - baselineY; 
            const power = Math.min(Math.hypot(dx, dy) / 10, MAX_STRIKE_POWER); 
            const angle = Math.atan2(dy, dx);
            drawAimingAnimation(ctx, strikerX, baselineY, angle, power);
        }
    }
  }, [coins, strikerX, isMoving, isAiming, aimPoint, gameOver, turn, isPlacementValid]);

  useEffect(() => { draw(); }, [draw]);

  const handlePointerDown = (e: React.PointerEvent) => { if (!isMoving && !gameOver && turn === 'p1' && isPlacementValid) setIsAiming(true); };
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!isAiming) return;
      const rect = canvasRef.current?.getBoundingClientRect(); if (!rect) return;
      setAimPoint({ x: ((e.clientX - rect.left) / rect.width) * BOARD_SIZE, y: ((e.clientY - rect.top) / rect.height) * BOARD_SIZE });
    };
    const onUp = () => {
      if (!isAiming) return; setIsAiming(false);
      if (aimPoint && isPlacementValid) {
        const baselineY = turn === 'p1' ? BASELINE_Y_P1 : BASELINE_Y_P2;
        const dx = aimPoint.x - strikerX, dy = aimPoint.y - baselineY; 
        const power = Math.min(Math.hypot(dx, dy) / 10, MAX_STRIKE_POWER); 
        if (power > 1.0) performStrike(strikerX, Math.atan2(dy, dx), power);
      }
      setAimPoint(null);
    };
    window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp);
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
  }, [isAiming, strikerX, aimPoint, turn, isMoving, gameOver, isPlacementValid]);

  if (!gamePartner) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-black/95 p-10 text-center animate-in fade-in">
        <div className="w-full flex items-center justify-between mb-10 px-1 absolute top-12 left-0 right-0 z-20">
          <div className="flex items-center space-x-3 ml-6">
            <StrikerLogo size={44} />
            <div className="flex flex-col text-left">
              <h2 className="text-xs font-black uppercase tracking-[2px] text-white leading-none">Carrom Pro</h2>
              <div className="flex items-center space-x-1 mt-1">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-[7px] text-white/30 font-black uppercase tracking-widest">Live Arena</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="bg-white/5 mr-6 px-4 py-2.5 rounded-xl border border-white/5 text-[9px] font-black uppercase text-white/40 hover:text-white transition-all">Quit</button>
        </div>
        <div className="w-24 h-24 mb-6 flex items-center justify-center bg-white/5 rounded-[2rem] border border-white/5 shadow-2xl transition-transform hover:scale-110 duration-500">
           <StrikerLogo size={64} />
        </div>
        <h2 className="text-3xl font-black italic text-white mb-8 uppercase tracking-tighter">Arena Select</h2>
        <div className="flex flex-col space-y-4 w-full max-w-xs">
           <button onClick={() => setGamePartner('Bot')} className="py-5 bg-white/5 border border-white/10 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest text-white shadow-xl active:scale-95 transition-all">vs Bot</button>
           <button onClick={() => setGamePartner('Friend')} className="py-5 bg-white/5 border border-white/10 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest text-white shadow-xl active:scale-95 transition-all">vs Duo</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#3d1212] overflow-hidden relative items-center justify-center">
      <div className="w-full flex items-center justify-between mb-8 px-6 z-30 absolute top-12 left-0 right-0 shrink-0">
        <div className="flex items-center space-x-3">
          <StrikerLogo size={44} />
          <div className="flex flex-col text-left">
            <h2 className="text-sm font-black uppercase tracking-[3px] text-white leading-none">Carrom Pro</h2>
            <div className="flex items-center space-x-1.5 mt-1.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></div>
              <span className="text-[8px] text-white/30 font-black uppercase tracking-widest">Live Arena</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2.5">
          <button onClick={onInvite} className="w-11 h-11 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all active:scale-95 group flex items-center justify-center shadow-lg"><UserPlus size={18} className="text-white/40 group-hover:text-white transition-colors" /></button>
          <button onClick={onClose} className="h-11 px-5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all active:scale-95 group shadow-lg flex items-center"><span className="text-[9px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">Quit</span></button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full z-10 px-4 pt-10">
        <div className="px-6 pt-2 pb-2 mb-4 w-full max-w-[320px] flex justify-between items-center bg-black/30 backdrop-blur-md rounded-[2rem] border border-white/5 shadow-2xl relative">
          {aiState !== 'IDLE' && turn === 'p2' && (
             <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-500 rounded-full text-[8px] font-black uppercase flex items-center space-x-2 shadow-lg z-20 transition-all">
                <Loader2 size={10} className="animate-spin" />
                <span>{aiState === 'MOVING' ? 'Positioning' : aiState === 'AIMING' ? 'Targeting' : 'Thinking'}</span>
             </div>
          )}
          <div className={`flex flex-col items-center p-1 rounded-2xl ${turn === 'p1' ? 'ring-2 ring-indigo-500 bg-black/30' : 'opacity-40'}`}><img src="https://i.pravatar.cc/100?u=me" className="w-7 h-7 rounded-lg" /><span className="text-xs font-black italic text-white mt-0.5">{p1Score}</span></div>
          <div className="flex-1 text-center px-2">
              <span className="text-[8px] text-white/70 uppercase font-black tracking-[2px] block mb-0.5">{message}</span>
              <div className="flex justify-center space-x-1.5 mt-0.5"><div className={`w-1.5 h-1.5 rounded-full ${queenStatus === 'OnBoard' ? 'bg-red-500' : 'bg-red-500/20 shadow-inner'}`} /><div className="w-1.5 h-1.5 rounded-full bg-white/40" /><div className="w-1.5 h-1.5 rounded-full bg-black/40" /></div>
          </div>
          <div className={`flex flex-col items-center p-1 rounded-2xl ${turn === 'p2' ? 'ring-2 ring-pink-500 bg-black/30' : 'opacity-40'}`}><img src={`https://i.pravatar.cc/100?u=${gamePartner}`} className="w-7 h-7 rounded-lg" /><span className="text-xs font-black italic text-white mt-0.5">{p2Score}</span></div>
        </div>

        <div className="relative p-1 bg-[#4e342e] rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] border-4 border-[#2d1b0d] ring-1 ring-white/10">
           <div className="rounded-[2.1rem] overflow-hidden relative ring-1 ring-black/30">
             <canvas ref={canvasRef} width={BOARD_SIZE} height={BOARD_SIZE} className="touch-none cursor-crosshair" onPointerDown={handlePointerDown} />
             {!isPlacementValid && !isMoving && turn === 'p1' && (
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center text-red-500 pointer-events-none bg-black/40 px-3 py-1.5 rounded-xl border border-red-500/30 animate-pulse"><AlertCircle size={20} className="mb-1" /><span className="text-[8px] font-black uppercase tracking-widest">Blocked</span></div>
             )}
           </div>
        </div>

        {!isMoving && !gameOver && turn === 'p1' && (
          <div className="w-full max-w-[280px] mt-8 px-2 flex items-center space-x-3 animate-in slide-in-from-bottom duration-500 z-50">
            <div className={`flex-1 relative flex flex-col items-center bg-gradient-to-b ${isPlacementValid ? 'from-[#7b5b4e] to-[#4e342e]' : 'from-red-900/40 to-red-950/40'} rounded-full h-11 shadow-[0_12px_24px_rgba(0,0,0,0.8)] border border-white/10 p-1.5 overflow-visible transition-colors`}>
                <div className="absolute inset-x-5 top-1/2 -translate-y-1/2 h-2.5 bg-black/60 rounded-full shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)] pointer-events-none" />
                <input type="range" min={45} max={BOARD_SIZE - 45} value={strikerX} onChange={(e) => setStrikerX(parseInt(e.target.value))} className={`striker-slider-pro w-full h-full bg-transparent appearance-none cursor-pointer relative z-10 outline-none ${!isPlacementValid ? 'striker-blocked' : ''}`} />
            </div>
            <button className="w-11 h-11 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/5 shadow-2xl active:scale-90 transition-all"><Share2 size={16} /></button>
          </div>
        )}
      </div>

      <div className="w-full py-8 text-center mt-auto opacity-10"><p className="text-[8px] font-black uppercase tracking-[6px] text-white">Classic Strike Arena</p></div>

      {gameOver && (
        <div className="absolute inset-0 z-[200] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-10 text-center animate-in zoom-in">
          <Sparkles size={64} className="text-yellow-500 mb-8 animate-[bounce_1s_infinite]" />
          <h2 className="text-4xl font-black italic text-white mb-2 tracking-tighter uppercase">Arena Cleared</h2>
          <p className="text-[10px] font-black uppercase text-white/30 tracking-[4px] mb-12">Victory belongs to you</p>
          <button onClick={() => setGamePartner(null)} className="w-full max-w-xs py-5 bg-white text-black rounded-[2rem] font-black uppercase text-sm tracking-widest shadow-2xl active:scale-95 transition-all">Rematch</button>
        </div>
      )}

      <style>{`
        .striker-slider-pro::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 38px; height: 38px; background: #ffffff; border-radius: 50%; cursor: pointer; box-shadow: 0 6px 16px rgba(0,0,0,0.8), inset 0 2px 4px rgba(255,255,255,1); border: 3px solid #3e2723; background-image: radial-gradient(circle, #4e342e 1.5px, transparent 1.5px); background-position: center; background-repeat: no-repeat; transition: all 0.2s; }
        .striker-slider-pro.striker-blocked::-webkit-slider-thumb { background: #ef4444; border-color: #7f1d1d; box-shadow: 0 0 15px rgba(239, 68, 68, 0.5); }
        .striker-slider-pro::-moz-range-thumb { width: 38px; height: 38px; background: #ffffff; border-radius: 50%; cursor: pointer; box-shadow: 0 6px 16px rgba(0,0,0,0.8); border: 3px solid #3e2723; }
      `}</style>
    </div>
  );
};

export default CarromPro;
