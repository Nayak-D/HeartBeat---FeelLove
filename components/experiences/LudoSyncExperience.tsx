
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Trophy, User, Bot, Star, ArrowRight, ArrowLeft, ArrowUp, ArrowDown, RotateCcw } from 'lucide-react';

// --- Types & Constants ---
type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';
type GameMode = 'selection' | 'playing' | 'winner';

const PLAYERS: PlayerColor[] = ['red', 'green', 'yellow', 'blue']; 

interface Token {
  id: number;
  color: PlayerColor;
  position: number; // -1 = base, 0-50 = track, 51-55 = home path, 56 = finish
  finished: boolean;
}

// Ludo King Specific Color Palette
const COLORS: Record<string, string> = {
  red: '#EA2A28',
  green: '#00A651',
  yellow: '#FCCB05',
  blue: '#00AEEF',
  white: '#FFFFFF',
  bg: '#F3F4F6',
  cellBorder: '#cbd5e1'
};

const mainTrack: [number, number][] = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5], [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6], [0, 7], [0, 8],
  [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14], [7, 14], [8, 14],
  [8, 13], [8, 12], [8, 11], [8, 10], [8, 9], [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8], [14, 7], [14, 6],
  [13, 6], [12, 6], [11, 6], [10, 6], [9, 6], [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0], [7, 0], [6, 0]
];

const startIndices: Record<string, number> = { red: 0, green: 13, yellow: 26, blue: 39 };
const homePaths: Record<string, [number, number][]> = {
  red: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
  green: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
  yellow: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],
  blue: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]],
};

const baseSpots: Record<string, [number, number][]> = {
  red: [[1.5, 1.5], [1.5, 3.5], [3.5, 1.5], [3.5, 3.5]],
  green: [[1.5, 10.5], [1.5, 12.5], [3.5, 10.5], [3.5, 12.5]],
  yellow: [[10.5, 10.5], [10.5, 12.5], [12.5, 10.5], [12.5, 12.5]], 
  blue: [[10.5, 1.5], [10.5, 3.5], [12.5, 1.5], [12.5, 3.5]], 
};

// Safe spot stars exactly like Ludo King
const starPositions = [
  [6, 2],  [2, 8],  [8, 12], [12, 6], // Standard wing safes
  [6, 1],  [1, 8],  [8, 13], [13, 6]  // Starting cell safes
];

const getPlayerPath = (color: PlayerColor): [number, number][] => {
  const start = startIndices[color];
  const path: [number, number][] = [];
  for (let i = 0; i < 51; i++) path.push(mainTrack[(start + i) % 52]);
  path.push(...homePaths[color], [7, 7]);
  return path;
};

// --- Components ---

const Dice3D: React.FC<{ value: number; rolling: boolean; onClick?: () => void; disabled: boolean }> = ({ value, rolling, onClick, disabled }) => {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (rolling) {
      const interval = setInterval(() => {
        setRotation({
          x: Math.floor(Math.random() * 360),
          y: Math.floor(Math.random() * 360)
        });
      }, 100);
      return () => clearInterval(interval);
    } else {
      const faceRots: Record<number, { x: number, y: number }> = {
        1: { x: 0, y: 0 }, 2: { x: 0, y: 90 }, 3: { x: 90, y: 0 },
        4: { x: -90, y: 0 }, 5: { x: 0, y: -90 }, 6: { x: 180, y: 0 }
      };
      setRotation(faceRots[value] || { x: 0, y: 0 });
    }
  }, [rolling, value]);

  const Dot = () => <div className="w-1.5 h-1.5 bg-black rounded-full" />;

  const Face: React.FC<{ v: number; transform: string }> = ({ v, transform }) => (
    <div 
      className="absolute w-full h-full bg-white border border-gray-300 rounded flex items-center justify-center shadow-inner"
      style={{ transform, backfaceVisibility: 'hidden' }}
    >
      <div className="grid grid-cols-3 grid-rows-3 w-8 h-8 gap-0.5 place-items-center">
        {v === 1 && <div className="col-start-2 row-start-2"><Dot /></div>}
        {v === 2 && <><div className="col-start-1 row-start-1"><Dot /></div><div className="col-start-3 row-start-3"><Dot /></div></>}
        {v === 3 && <><div className="col-start-1 row-start-1"><Dot /></div><div className="col-start-2 row-start-2"><Dot /></div><div className="col-start-3 row-start-3"><Dot /></div></>}
        {v === 4 && <><div className="col-start-1 row-start-1"><Dot /></div><div className="col-start-3 row-start-1"><Dot /></div><div className="col-start-1 row-start-3"><Dot /></div><div className="col-start-3 row-start-3"><Dot /></div></>}
        {v === 5 && <><div className="col-start-1 row-start-1"><Dot /></div><div className="col-start-3 row-start-1"><Dot /></div><div className="col-start-2 row-start-2"><Dot /></div><div className="col-start-1 row-start-3"><Dot /></div><div className="col-start-3 row-start-3"><Dot /></div></>}
        {v === 6 && <><div className="col-start-1 row-start-1"><Dot /></div><div className="col-start-3 row-start-1"><Dot /></div><div className="col-start-1 row-start-2"><Dot /></div><div className="col-start-3 row-start-2"><Dot /></div><div className="col-start-1 row-start-3"><Dot /></div><div className="col-start-3 row-start-3"><Dot /></div></>}
      </div>
    </div>
  );

  return (
    <div 
      onClick={disabled ? undefined : onClick}
      className={`relative w-12 h-12 perspective-1000 group transition-all ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'}`}
    >
      <div 
        className="relative w-full h-full preserve-3d transition-transform duration-1000 ease-out"
        style={{ transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)` }}
      >
        <Face v={1} transform="translateZ(24px)" />
        <Face v={6} transform="translateZ(-24px) rotateY(180deg)" />
        <Face v={2} transform="translateX(24px) rotateY(90deg)" />
        <Face v={5} transform="translateX(-24px) rotateY(-90deg)" />
        <Face v={3} transform="translateY(-24px) rotateX(90deg)" />
        <Face v={4} transform="translateY(24px) rotateX(-90deg)" />
      </div>
    </div>
  );
};

// High-fidelity Ludo King token
const TokenComponent: React.FC<{ color: PlayerColor; selectable: boolean; onClick?: () => void }> = ({ color, selectable, onClick }) => {
  return (
    <div 
      onClick={onClick} 
      className={`w-full h-full flex items-center justify-center transition-all duration-300 ${selectable ? 'cursor-pointer scale-110 z-50' : 'z-40'}`}
    >
      <div className={`relative w-[90%] h-[90%] flex flex-col items-center justify-center ${selectable ? 'animate-bounce' : ''}`}>
        <div 
          className="w-[85%] h-[85%] rounded-full shadow-lg border-[1px] border-black/10 flex items-center justify-center relative overflow-hidden"
          style={{ 
            backgroundColor: COLORS[color],
            borderRadius: '50% 50% 50% 5%',
            transform: 'rotate(-45deg)'
          }}
        >
          <div className="w-[40%] h-[40%] bg-white rounded-full opacity-90 shadow-inner" style={{ transform: 'rotate(45deg)' }} />
          <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-white/30" />
        </div>
        <div className="w-[50%] h-[12%] bg-black/20 rounded-full blur-[1px] -mt-0.5" />
      </div>
    </div>
  );
};

const LudoSyncExperience: React.FC<{ onInvite?: () => void; onClose?: () => void }> = ({ onInvite, onClose }) => {
  const [gameState, setGameState] = useState<GameMode>('selection');
  const [tokens, setTokens] = useState<Token[]>([]);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [diceValue, setDiceValue] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [hasRolled, setHasRolled] = useState(false);
  const [winner, setWinner] = useState<PlayerColor | null>(null);
  const [validMoves, setValidMoves] = useState<number[]>([]);

  const currentTurn = PLAYERS[currentPlayerIdx];
  const tokensRef = useRef(tokens);
  useEffect(() => { tokensRef.current = tokens; }, [tokens]);

  const startGame = () => {
    const initialTokens = PLAYERS.flatMap(color => 
      Array.from({ length: 4 }).map((_, i) => ({
        id: color === 'red' ? i : color === 'green' ? i + 4 : color === 'yellow' ? i + 8 : i + 12,
        color,
        position: -1,
        finished: false
      }))
    );
    setTokens(initialTokens);
    setGameState('playing');
    setCurrentPlayerIdx(0);
    setHasRolled(false);
    setWinner(null);
  };

  const rollDice = useCallback(() => {
    if (isRolling || isMoving || hasRolled || winner) return;
    setIsRolling(true);
    if (navigator.vibrate) navigator.vibrate(20);
    
    setTimeout(() => {
      const roll = Math.floor(Math.random() * 6) + 1;
      setDiceValue(roll);
      setIsRolling(false);
      setHasRolled(true);
    }, 800);
  }, [isRolling, isMoving, hasRolled, winner]);

  const moveToken = useCallback(async (tokenIdx: number) => {
    if (isMoving || !hasRolled || winner) return;
    setIsMoving(true);
    setValidMoves([]);

    const token = { ...tokensRef.current[tokenIdx] };
    const roll = diceValue;
    
    if (token.position === -1) {
      if (roll === 6) {
        setTokens(prev => {
          const next = [...prev];
          next[tokenIdx] = { ...next[tokenIdx], position: 0 };
          return next;
        });
        if (navigator.vibrate) navigator.vibrate(10);
      }
      finishTurn(roll === 6);
      return;
    }

    const startPos = token.position;
    const endPos = startPos + roll;

    for (let step = startPos + 1; step <= endPos; step++) {
      await new Promise(resolve => {
        setTokens(prev => {
          const next = [...prev];
          next[tokenIdx] = { ...next[tokenIdx], position: step };
          return next;
        });
        if (navigator.vibrate) navigator.vibrate(5);
        setTimeout(resolve, 150);
      });
    }

    let extraTurn = roll === 6;
    setTokens(prev => {
      const next = [...prev];
      const finalToken = { ...next[tokenIdx] };

      if (finalToken.position === 56) {
        finalToken.finished = true;
        extraTurn = true;
      } else {
        const playerPath = getPlayerPath(finalToken.color);
        const [r, c] = playerPath[finalToken.position];
        const isSafe = starPositions.some(s => s[0] === r && s[1] === c);

        if (!isSafe) {
          next.forEach((t, i) => {
            if (t.color !== finalToken.color && t.position >= 0 && t.position < 51) {
              const otherPath = getPlayerPath(t.color);
              const [or, oc] = otherPath[t.position];
              if (r === or && c === oc) {
                next[i] = { ...t, position: -1 };
                extraTurn = true;
                if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
              }
            }
          });
        }
      }

      next[tokenIdx] = finalToken;
      if (next.filter(t => t.color === finalToken.color).every(t => t.finished)) setWinner(finalToken.color);
      return next;
    });

    finishTurn(extraTurn);
  }, [diceValue, hasRolled, isMoving, winner]);

  const finishTurn = (extraTurn: boolean) => {
    setIsMoving(false);
    if (!extraTurn) setCurrentPlayerIdx(prev => (prev + 1) % PLAYERS.length);
    setHasRolled(false);
  };

  useEffect(() => {
    if (hasRolled && !isMoving && !winner) {
      const playerTokens = tokens.map((t, i) => ({ ...t, idx: i })).filter(t => t.color === currentTurn && !t.finished);
      const valid = playerTokens.filter(t => {
        if (t.position === -1) return diceValue === 6;
        return t.position + diceValue <= 56;
      }).map(t => t.idx);

      if (valid.length === 0) setTimeout(() => finishTurn(false), 800);
      else {
        setValidMoves(valid);
        if (currentTurn !== 'red') setTimeout(() => moveToken(valid[Math.floor(Math.random() * valid.length)]), 1000);
      }
    }
  }, [hasRolled, isMoving, winner, tokens, currentTurn, diceValue, moveToken]);

  useEffect(() => {
    if (currentTurn !== 'red' && !hasRolled && !isRolling && !winner) setTimeout(rollDice, 1200);
  }, [currentTurn, hasRolled, isRolling, winner, rollDice]);

  if (gameState === 'selection') {
    return (
      <div className="h-full w-full bg-[#f8fafc] flex flex-col items-center justify-center p-10 animate-in fade-in">
        <div className="w-20 h-20 bg-red-500 rounded-3xl flex items-center justify-center shadow-2xl mb-8 animate-pulse">
           <Trophy size={40} className="text-white" />
        </div>
        <h2 className="text-3xl font-black tracking-tighter text-gray-900 mb-2 uppercase italic">LUDO PRO</h2>
        <p className="text-[10px] font-black text-gray-400 tracking-[5px] uppercase mb-12 italic">Authentic Board Arena</p>
        <button onClick={startGame} className="w-full max-w-xs py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl active:scale-95 transition-all">Launch Game</button>
        <button onClick={onClose} className="mt-8 text-[10px] font-black uppercase text-gray-400 tracking-widest">Back to Hub</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-white relative items-center justify-center p-4">
      <div className="w-full max-w-[340px] flex justify-between items-center mb-6">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg border-2 transition-all duration-500 ${currentTurn === 'red' ? 'border-red-500 bg-red-50' : currentTurn === 'green' ? 'border-green-500 bg-green-50' : currentTurn === 'yellow' ? 'border-yellow-500 bg-yellow-50' : 'border-blue-500 bg-blue-50'}`}>
            {currentTurn === 'red' ? <User size={24} className="text-red-500" /> : <Bot size={24} className={`text-${currentTurn}-500`} />}
          </div>
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[2px] mb-0.5">Turn</p>
            <h3 className="text-base font-black italic uppercase text-gray-800 tracking-tight">{currentTurn === 'red' ? 'You' : `Bot ${currentTurn}`}</h3>
          </div>
        </div>
        <Dice3D value={diceValue} rolling={isRolling} onClick={rollDice} disabled={hasRolled || currentTurn !== 'red' || isMoving} />
      </div>

      {/* Ludo King Board Implementation */}
      <div className="relative aspect-square w-full max-w-[340px] bg-white rounded-lg overflow-hidden shadow-2xl border-4 border-gray-100">
        <div className="grid grid-cols-15 grid-rows-15 w-full h-full bg-[#f8fafc]">
          {Array.from({ length: 225 }).map((_, i) => {
            const r = Math.floor(i / 15); const c = i % 15;
            let bgColor = COLORS.white; 
            let borderColor = '#cbd5e1';
            let innerIcon = null;
            
            // Base Quadrants
            if (r < 6 && c < 6) bgColor = COLORS.red; 
            if (r < 6 && c > 8) bgColor = COLORS.green; 
            if (r > 8 && c > 8) bgColor = COLORS.yellow; 
            if (r > 8 && c < 6) bgColor = COLORS.blue;
            
            // Ludo King Base Design (White box with colored stroke inside)
            if ((r > 0 && r < 5 && c > 0 && c < 5) || (r > 0 && r < 5 && c > 9 && c < 14) || (r > 9 && r < 14 && c > 9 && c < 14) || (r > 9 && r < 14 && c > 0 && c < 5)) {
              bgColor = COLORS.white;
            }

            // Path Highlighting
            if (r === 7 && c > 0 && c < 6) bgColor = COLORS.red; 
            if (r === 7 && c > 8 && c < 14) bgColor = COLORS.yellow; 
            if (c === 7 && r > 0 && r < 6) bgColor = COLORS.green; 
            if (c === 7 && r > 8 && r < 14) bgColor = COLORS.blue;

            // Image Specific Safe Cell Backing (Greyed)
            const isStar = starPositions.some(s => s[0] === r && s[1] === c);
            if (isStar) {
                bgColor = '#e2e8f0';
                innerIcon = <Star size={12} className="text-gray-500 fill-gray-500" />;
            }
            
            // Starting Cells
            if (r === 6 && c === 1) bgColor = COLORS.red;
            if (r === 1 && c === 8) bgColor = COLORS.green;
            if (r === 8 && c === 13) bgColor = COLORS.yellow;
            if (r === 13 && c === 6) bgColor = COLORS.blue;
            
            // Special Arrows at Entrances
            if (r === 7 && c === 0) innerIcon = <ArrowRight size={12} className="text-[#ea2a28]" />;
            if (r === 0 && c === 7) innerIcon = <ArrowDown size={12} className="text-[#00a651]" />;
            if (r === 7 && c === 14) innerIcon = <ArrowLeft size={12} className="text-[#fccb05]" />;
            if (r === 14 && c === 7) innerIcon = <ArrowUp size={12} className="text-[#00aeef]" />;

            return (
              <div key={i} className="relative flex items-center justify-center border-[0.1px] transition-colors" style={{ backgroundColor: bgColor, borderColor: borderColor }}>
                {innerIcon}
                
                {/* Center Home Cross split into 4 triangles exactly like Ludo King */}
                {r === 7 && c === 7 && (
                  <div className="absolute inset-[-100%] z-10 flex items-center justify-center overflow-hidden">
                    <div className="w-full h-full rotate-45 scale-110">
                      <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-[#ea2a28] shadow-[inset_0_0_10px_rgba(0,0,0,0.1)]" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%)' }} />
                      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-[#00a651] shadow-[inset_0_0_10px_rgba(0,0,0,0.1)]" style={{ clipPath: 'polygon(100% 0, 100% 100%, 0 100%)' }} />
                      <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-[#fccb05] shadow-[inset_0_0_10px_rgba(0,0,0,0.1)]" style={{ clipPath: 'polygon(100% 100%, 0 100%, 0 0)' }} />
                      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-[#00aeef] shadow-[inset_0_0_10px_rgba(0,0,0,0.1)]" style={{ clipPath: 'polygon(0 100%, 0 0, 100% 0)' }} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Tokens Layer */}
        {tokens.map((token, idx) => {
          if (token.finished) return null;
          let r, c;
          if (token.position === -1) [r, c] = baseSpots[token.color][token.id % 4];
          else [r, c] = getPlayerPath(token.color)[token.position];

          const sameSpot = tokens.filter(t => !t.finished && t.id !== token.id);
          let offset = 0;
          sameSpot.forEach(t => { if (t.position === token.position && t.color === token.color && t.position !== -1) offset += 2; });

          return (
            <div 
              key={token.id}
              className="absolute w-[6.66%] h-[6.66%] transition-all duration-300 pointer-events-none"
              style={{ left: `${(c / 15) * 100}%`, top: `${(r / 15) * 100}%`, transform: `translate(${offset}px, ${offset}px)` }}
            >
              <div className="w-full h-full pointer-events-auto">
                <TokenComponent 
                  color={token.color} 
                  selectable={validMoves.includes(idx)} 
                  onClick={() => validMoves.includes(idx) && moveToken(idx)} 
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex space-x-3 w-full max-w-[340px]">
        <button onClick={() => setGameState('selection')} className="flex-1 py-4 bg-gray-50 border border-gray-100 rounded-2xl flex items-center justify-center space-x-2 text-[10px] font-black uppercase tracking-widest text-gray-400 active:scale-95 transition-all">
           <RotateCcw size={14} /> <span>Forfeit</span>
        </button>
        <button onClick={onInvite} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl flex items-center justify-center space-x-2 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg">
           <span>Invite Friend</span>
        </button>
      </div>

      {winner && (
        <div className="absolute inset-0 z-[200] bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center p-12 text-center animate-in zoom-in">
          <Trophy size={80} className="text-yellow-500 mb-6 drop-shadow-xl" />
          <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-2 text-gray-900">VICTORY!</h2>
          <p className="text-gray-400 font-black tracking-[5px] uppercase text-[10px] mb-12">{winner === 'red' ? 'YOU RULE THE BOARD' : `${winner.toUpperCase()} DOMINATED`}</p>
          <button onClick={startGame} className="w-full max-w-xs py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl active:scale-95 transition-all">Final Rematch</button>
        </div>
      )}

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
      `}</style>
    </div>
  );
};

export default LudoSyncExperience;
