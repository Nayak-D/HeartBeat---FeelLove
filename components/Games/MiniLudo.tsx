
import React, { useState, useEffect, useCallback } from 'react';
import { RotateCcw, Trophy, User, Users, Bot, Info, X, ShieldCheck, Flame, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, ChevronRight } from 'lucide-react';

const MAIN_PATH_LENGTH = 52;
const TARGET_STEPS = 58; 
const COLORS = ['red', 'green', 'yellow', 'blue'] as const;
type Color = typeof COLORS[number];
type TokenState = 'BASE' | 'ACTIVE' | 'HOME' | 'FINISHED';

interface Token {
  id: number;
  playerId: Color;
  state: TokenState;
  stepsMoved: number; 
  boardIndex: number; 
}

interface Player {
  id: Color;
  name: string;
  isBot: boolean;
  tokens: Token[];
  rank?: number;
}

const START_INDICES: Record<Color, number> = { red: 0, green: 13, yellow: 26, blue: 39 };
const SAFE_CELLS = [0, 8, 13, 21, 26, 34, 39, 47];

const GLOBAL_PATH_COORDS: [number, number][] = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5], [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6], [0, 7], [0, 8],
  [1, 8], [2, 8], [3, 8], [4, 8], [5, 8], [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14], [7, 14], [8, 14],
  [8, 13], [8, 12], [8, 11], [8, 10], [8, 9], [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8], [14, 7], [14, 6],
  [13, 6], [12, 6], [11, 6], [10, 6], [9, 6], [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0], [7, 0], [6, 0]
];

const HOME_PATH_COORDS: Record<Color, [number, number][]> = {
  red: [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],
  green: [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],
  yellow: [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],
  blue: [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]]
};

const BASE_COORDS: Record<Color, [number, number][]> = {
  red: [[2, 2], [2, 3], [3, 2], [3, 3]],
  green: [[2, 11], [2, 12], [3, 11], [3, 12]],
  yellow: [[11, 11], [11, 12], [12, 11], [12, 12]],
  blue: [[11, 2], [11, 3], [12, 2], [12, 3]]
};

// Fixed: Added MiniLudoProps to accept onClose from parent
interface MiniLudoProps {
  onClose?: () => void;
}

const MiniLudo: React.FC<MiniLudoProps> = ({ onClose }) => {
  const [setupMode, setSetupMode] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIdx, setCurrentPlayerIdx] = useState(0);
  const [diceValue, setDiceValue] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [sixCount, setSixCount] = useState(0);
  const [gameState, setGameState] = useState<'ROLL' | 'MOVE' | 'WON'>('ROLL');
  const [message, setMessage] = useState('Welcome!');
  const [showRules, setShowRules] = useState(false);
  const [validMoves, setValidMoves] = useState<number[]>([]);

  const initGame = (count: number) => {
    const newPlayers: Player[] = COLORS.slice(0, count).map((color, i) => ({
      id: color,
      name: i === 0 ? 'You' : `CPU ${i}`,
      isBot: i !== 0,
      tokens: Array.from({ length: 4 }).map((_, tid) => ({
        id: tid,
        playerId: color,
        state: 'BASE',
        stepsMoved: 0,
        boardIndex: -1
      }))
    }));
    setPlayers(newPlayers);
    setSetupMode(false);
    setCurrentPlayerIdx(0);
    setGameState('ROLL');
    setSixCount(0);
  };

  const currentPlayer = players[currentPlayerIdx];

  const rollDice = () => {
    if (isRolling || gameState !== 'ROLL') return;
    setIsRolling(true);
    let rolls = 0;
    const interval = setInterval(() => {
      setDiceValue(Math.floor(Math.random() * 6) + 1);
      rolls++;
      if (rolls > 8) {
        clearInterval(interval);
        setIsRolling(false);
      }
    }, 60);
  };

  const nextTurn = useCallback(() => {
    if (players.length === 0) return;
    let nextIdx = (currentPlayerIdx + 1) % players.length;
    let count = 0;
    while (players[nextIdx].tokens.every(t => t.state === 'FINISHED') && count < players.length) {
      nextIdx = (nextIdx + 1) % players.length;
      count++;
    }
    setCurrentPlayerIdx(nextIdx);
    setGameState('ROLL');
    setSixCount(0);
    setValidMoves([]);
  }, [currentPlayerIdx, players]);

  const handleMove = useCallback((tokenIdx: number) => {
    if (gameState !== 'MOVE' || !currentPlayer) return;

    setPlayers(prev => {
      const newPlayers = [...prev];
      const p = { ...newPlayers[currentPlayerIdx] };
      const tokens = [...p.tokens];
      const token = { ...tokens[tokenIdx] };
      let captureOccurred = false;

      if (token.state === 'BASE') {
        token.state = 'ACTIVE';
        token.stepsMoved = 1;
        token.boardIndex = START_INDICES[p.id];
      } else {
        token.stepsMoved += diceValue;
        if (token.stepsMoved <= MAIN_PATH_LENGTH) {
          token.state = 'ACTIVE';
          token.boardIndex = (START_INDICES[p.id] + token.stepsMoved - 1) % MAIN_PATH_LENGTH;
        } else if (token.stepsMoved < TARGET_STEPS) {
          token.state = 'HOME';
          token.boardIndex = 52 + (token.stepsMoved - 53);
        } else if (token.stepsMoved === TARGET_STEPS) {
          token.state = 'FINISHED';
          token.boardIndex = 57;
        }
      }

      if (token.state === 'ACTIVE' && !SAFE_CELLS.includes(token.boardIndex)) {
        newPlayers.forEach((otherPlayer, otherPIdx) => {
          if (otherPIdx === currentPlayerIdx) return;
          const otherTokens = [...otherPlayer.tokens];
          let otherChanged = false;
          otherTokens.forEach((ot, otIdx) => {
            if (ot.state === 'ACTIVE' && ot.boardIndex === token.boardIndex) {
              otherTokens[otIdx] = { ...ot, state: 'BASE', stepsMoved: 0, boardIndex: -1 };
              captureOccurred = true;
              otherChanged = true;
            }
          });
          if (otherChanged) newPlayers[otherPIdx] = { ...otherPlayer, tokens: otherTokens };
        });
      }

      tokens[tokenIdx] = token;
      p.tokens = tokens;
      newPlayers[currentPlayerIdx] = p;

      setTimeout(() => {
        if (token.state === 'FINISHED' && p.tokens.every(t => t.state === 'FINISHED')) {
           setGameState('WON');
        } else {
          const hasExtra = diceValue === 6 || captureOccurred || token.state === 'FINISHED';
          if (hasExtra && diceValue !== 6) { setGameState('ROLL'); setSixCount(0); }
          else if (diceValue === 6) { setGameState('ROLL'); }
          else { nextTurn(); }
        }
      }, 300);

      return newPlayers;
    });
  }, [currentPlayer, currentPlayerIdx, diceValue, gameState, nextTurn]);

  const evaluateMoves = useCallback(() => {
    if (!currentPlayer || gameState !== 'MOVE') return;
    const possible = validMoves.map(tIdx => {
      const token = currentPlayer.tokens[tIdx];
      let score = 0;
      const nextSteps = token.state === 'BASE' ? 1 : token.stepsMoved + diceValue;
      const nextBoardIndex = token.state === 'BASE' ? START_INDICES[currentPlayer.id] : (START_INDICES[currentPlayer.id] + nextSteps - 1) % MAIN_PATH_LENGTH;
      const willCapture = players.some((p, pIdx) => pIdx !== currentPlayerIdx && p.tokens.some(ot => ot.state === 'ACTIVE' && ot.boardIndex === nextBoardIndex && !SAFE_CELLS.includes(nextBoardIndex)));
      if (willCapture) score += 100;
      if (token.stepsMoved <= 52 && nextSteps > 52) score += 50;
      if (SAFE_CELLS.includes(nextBoardIndex)) score += 40;
      if (nextSteps === TARGET_STEPS) score += 30;
      if (token.state === 'BASE') score += 25;
      score += 10;
      return { tIdx, score };
    });
    possible.sort((a, b) => b.score - a.score);
    if (possible.length > 0) setTimeout(() => handleMove(possible[0].tIdx), 800);
  }, [currentPlayer, currentPlayerIdx, diceValue, gameState, handleMove, players, validMoves]);

  useEffect(() => {
    if (isRolling || gameState !== 'ROLL' || !currentPlayer) return;
    if (diceValue === 6) {
      if (sixCount === 2) { setTimeout(nextTurn, 800); return; }
      setSixCount(prev => prev + 1);
    } else setSixCount(0);

    const possibleMoves: number[] = [];
    currentPlayer.tokens.forEach((t, i) => {
      if (t.state === 'FINISHED') return;
      if (t.state === 'BASE') { if (diceValue === 6) possibleMoves.push(i); }
      else { if (t.stepsMoved + diceValue <= TARGET_STEPS) possibleMoves.push(i); }
    });

    if (possibleMoves.length === 0) setTimeout(nextTurn, 800);
    else {
      setValidMoves(possibleMoves);
      setGameState('MOVE');
      if (currentPlayer.isBot) evaluateMoves();
    }
  }, [diceValue, isRolling, gameState, currentPlayer, nextTurn, evaluateMoves, sixCount]);

  const getCellCoords = (token: Token): [number, number] => {
    if (token.state === 'BASE') return BASE_COORDS[token.playerId][token.id];
    if (token.state === 'FINISHED') return [7, 7];
    if (token.state === 'HOME') return HOME_PATH_COORDS[token.playerId][token.boardIndex - 52];
    return GLOBAL_PATH_COORDS[token.boardIndex];
  };

  const renderDice = () => {
    const props = { size: 32, className: isRolling ? 'animate-bounce text-indigo-400' : 'text-white' };
    switch(diceValue) {
      case 1: return <Dice1 {...props} />;
      case 2: return <Dice2 {...props} />;
      case 3: return <Dice3 {...props} />;
      case 4: return <Dice4 {...props} />;
      case 5: return <Dice5 {...props} />;
      case 6: return <Dice6 {...props} />;
      default: return <Dice1 {...props} />;
    }
  };

  if (setupMode) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-in fade-in">
        <h2 className="text-3xl font-black italic uppercase text-white mb-8">Ludo Pro</h2>
        <div className="grid grid-cols-1 gap-3 w-full max-w-xs">
          {[2, 3, 4].map(n => (
            <button key={n} onClick={() => initGame(n)} className="p-5 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between text-white font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">
              <span>{n} Players</span>
              <ChevronRight size={14} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-black relative p-4 items-center justify-center">
      {/* Mini HUD */}
      <div className="w-full max-w-[320px] mb-4 flex justify-between items-center bg-white/5 rounded-2xl p-2 border border-white/5">
        <div className="flex items-center space-x-2">
           <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-${currentPlayer?.id}-500 shadow-lg`}>
              {currentPlayer?.isBot ? <Bot size={16} /> : <User size={16} />}
           </div>
           <span className="text-[10px] font-black uppercase text-white truncate max-w-[60px]">{currentPlayer?.name}</span>
        </div>
        <button 
          onClick={rollDice} 
          disabled={isRolling || gameState !== 'ROLL' || currentPlayer?.isBot} 
          className="w-12 h-12 rounded-xl flex items-center justify-center bg-white/10"
        >
          {renderDice()}
        </button>
      </div>

      {/* Scaled Board */}
      <div className="relative aspect-square w-full max-w-[320px] bg-white rounded-xl shadow-2xl overflow-hidden border-4 border-white/10">
        <div className="grid grid-cols-15 grid-rows-15 w-full h-full">
          {Array.from({ length: 225 }).map((_, i) => {
            const r = Math.floor(i / 15); const c = i % 15;
            let bg = 'bg-white'; let border = 'border-[0.5px] border-gray-100';
            if (r < 6 && c < 6) bg = 'bg-red-500'; if (r < 6 && c > 8) bg = 'bg-green-500'; if (r > 8 && c > 8) bg = 'bg-yellow-500'; if (r > 8 && c < 6) bg = 'bg-blue-500';
            if (r === 7 && c > 0 && c < 7) bg = 'bg-red-500'; if (c === 7 && r > 0 && r < 7) bg = 'bg-green-500'; if (r === 7 && c > 8 && c < 14) bg = 'bg-yellow-500'; if (c === 7 && r > 8 && r < 14) bg = 'bg-blue-500';
            if (r === 6 && c === 1) bg = 'bg-red-500'; if (r === 1 && c === 8) bg = 'bg-green-500'; if (r === 8 && c === 13) bg = 'bg-yellow-500'; if (r === 13 && c === 6) bg = 'bg-blue-500';
            const isSafe = SAFE_CELLS.some(si => GLOBAL_PATH_COORDS[si][0] === r && GLOBAL_PATH_COORDS[si][1] === c);
            if (r >= 6 && r <= 8 && c >= 6 && c <= 8) {
              if (r === 7 && c === 7) bg = 'bg-gray-100'; else if (r < 7 && c === 7) bg = 'bg-green-500'; else if (r > 7 && c === 7) bg = 'bg-blue-500'; else if (c < 7 && r === 7) bg = 'bg-red-500'; else if (c > 7 && r === 7) bg = 'bg-yellow-500'; else bg = 'bg-gray-50';
            }
            return <div key={i} className={`${bg} ${border} flex items-center justify-center relative`}>{isSafe && <ShieldCheck size={6} className="text-black/20" />}</div>;
          })}
        </div>
        {players.map(p => p.tokens.map((token, tid) => {
          const [r, c] = getCellCoords(token);
          const isValid = validMoves.includes(tid) && currentPlayerIdx === players.indexOf(p);
          const sameSpot = players.flatMap(other => other.tokens).filter(t => t.state !== 'BASE' && t.state !== 'FINISHED' && t.boardIndex === token.boardIndex);
          const spotIdx = sameSpot.indexOf(token);
          const offset = sameSpot.length > 1 ? (spotIdx - (sameSpot.length - 1) / 2) * 4 : 0;
          return (
            <div 
              key={`${p.id}-${tid}`} onClick={() => isValid && handleMove(tid)}
              className={`absolute w-[4.5%] h-[4.5%] rounded-full shadow-lg transition-all duration-300 z-30 cursor-pointer border-[1px] border-white bg-${p.id}-500 ${isValid ? 'scale-125 ring-2 ring-white animate-pulse' : ''}`}
              style={{ left: `${(c / 15) * 100 + 0.5 + (offset / 4)}%`, top: `${(r / 15) * 100 + 0.5 + (offset / 4)}%` }}
            />
          );
        }))}
      </div>

      <div className="w-full max-w-[320px] mt-4 flex space-x-2">
        <button onClick={() => setSetupMode(true)} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-[8px] font-black uppercase text-white/50 flex items-center justify-center space-x-1">
           <RotateCcw size={12} /> <span>Quit</span>
        </button>
        <button onClick={() => setShowRules(true)} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-[8px] font-black uppercase text-white/50 flex items-center justify-center space-x-1">
           <Info size={12} /> <span>Rules</span>
        </button>
      </div>

      {gameState === 'WON' && (
        <div className="absolute inset-0 z-[200] bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-8 text-center animate-in zoom-in">
          <Trophy size={64} className="text-yellow-500 mb-6" />
          <h2 className="text-3xl font-black text-white mb-8">{currentPlayer.name} Wins!</h2>
          <button onClick={() => setSetupMode(true)} className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase">Play Again</button>
        </div>
      )}

      {showRules && (
        <div className="absolute inset-0 z-[250] bg-black/90 flex items-center justify-center p-6">
          <div className="bg-[#111] p-8 rounded-[2rem] border border-white/10 max-w-xs text-center">
            <h4 className="text-xl font-black uppercase text-white mb-4">Quick Rules</h4>
            <div className="text-[9px] text-white/40 uppercase tracking-widest text-left space-y-2 mb-8">
              <p>• Roll a 6 to start</p>
              <p>• Capture others for extra turn</p>
              <p>• Finish all 4 tokens to win</p>
              <p>• Three 6s cancels your turn</p>
            </div>
            <button onClick={() => setShowRules(false)} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black uppercase">Close</button>
          </div>
        </div>
      )}

      <style>{`
        .bg-red-500 { background-color: #ef4444; } .bg-green-500 { background-color: #22c55e; } .bg-yellow-500 { background-color: #eab308; } .bg-blue-500 { background-color: #3b82f6; }
      `}</style>
    </div>
  );
};

export default MiniLudo;
