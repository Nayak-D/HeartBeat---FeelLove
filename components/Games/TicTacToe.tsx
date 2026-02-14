import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, Heart, RefreshCw, X } from 'lucide-react';

type Player = 'X' | 'O';
type GameMode = 'Solo' | 'Duo';

interface TicTacToeProps {
  onClose?: () => void;
}

const TicTacToe: React.FC<TicTacToeProps> = ({ onClose }) => {
  const [board, setBoard] = useState<Array<Player | null>>(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [gameMode, setGameMode] = useState<GameMode>('Solo');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [showInviteToast, setShowInviteToast] = useState(false);
  const [celebrationHearts, setCelebrationHearts] = useState<{ id: number; left: number; delay: number; scale: number; color: string }[]>([]);

  const calculateWinner = (squares: Array<Player | null>) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (const [a, b, c] of lines) {
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return { winner: squares[a], line: [a, b, c] };
      }
    }
    return null;
  };

  const findBestMove = useCallback((squares: Array<Player | null>): number => {
    for (let i = 0; i < 9; i++) {
      if (!squares[i]) {
        const copy = [...squares];
        copy[i] = 'O';
        if (calculateWinner(copy)) return i;
      }
    }
    for (let i = 0; i < 9; i++) {
      if (!squares[i]) {
        const copy = [...squares];
        copy[i] = 'X';
        if (calculateWinner(copy)) return i;
      }
    }
    if (!squares[4]) return 4;
    const corners = [0, 2, 6, 8];
    const availableCorners = corners.filter(i => !squares[i]);
    if (availableCorners.length > 0) return availableCorners[Math.floor(Math.random() * availableCorners.length)];
    const available = squares.map((s, i) => s === null ? i : null).filter(i => i !== null) as number[];
    return available[Math.floor(Math.random() * available.length)];
  }, []);

  const handleClick = (i: number) => {
    if (calculateWinner(board) || board[i] || (gameMode === 'Solo' && !isXNext)) return;
    const newBoard = board.slice();
    newBoard[i] = isXNext ? 'X' : 'O';
    setBoard(newBoard);
    setIsXNext(!isXNext);
  };

  const result = calculateWinner(board);
  const winner = result?.winner || null;
  const winLine = result?.line || [];
  const isDraw = !winner && board.every(s => s !== null);

  useEffect(() => {
    if (winner) {
      const celebrationColor = winner === 'X' ? 'text-white' : 'text-[#ff2d55]';
      const newHearts = Array.from({ length: 25 }).map((_, i) => ({
        id: Date.now() + i,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        scale: 0.5 + Math.random() * 1.5,
        color: celebrationColor,
      }));
      setCelebrationHearts(newHearts);
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    } else {
      setCelebrationHearts([]);
    }
  }, [winner]);

  useEffect(() => {
    if (gameMode === 'Solo' && !isXNext && !winner && board.includes(null)) {
      setIsAiThinking(true);
      const timer = setTimeout(() => {
        const aiMove = findBestMove(board);
        const newBoard = board.slice();
        newBoard[aiMove] = 'O';
        setBoard(newBoard);
        setIsXNext(true);
        setIsAiThinking(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isXNext, gameMode, board, findBestMove, winner]);

  const status = winner ? `${winner} Won!` : isDraw ? "Tie!" : isAiThinking ? "..." : `Turn: ${isXNext ? 'X' : 'O'}`;

  const resetGame = () => {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setIsAiThinking(false);
    setCelebrationHearts([]);
  };

  const handleInvite = () => {
    setShowInviteToast(true);
    if (navigator.vibrate) navigator.vibrate(50);
    setTimeout(() => setShowInviteToast(false), 3000);
  };

  return (
    <div className="flex flex-col w-full h-full bg-black relative p-6 pt-12 overflow-hidden items-center touch-none">
      {celebrationHearts.map(heart => (
        <div 
          key={heart.id} 
          className={`fixed pointer-events-none z-[300] ${heart.color} animate-[heart-fly_3s_ease-out_forwards]`} 
          style={{ 
            left: `${heart.left}%`, 
            bottom: '-20px', 
            animationDelay: `${heart.delay}s`, 
            transform: `scale(${heart.scale})` 
          }}
        >
          <Heart fill="currentColor" size={24} />
        </div>
      ))}

      {/* BRANDING HEADER */}
      <div className="w-full flex items-center justify-between mb-8 z-10 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-[#0f111a] flex items-center justify-center border border-[#1e2235] shadow-2xl ring-1 ring-white/5">
             <span className="text-2xl text-[#ff2d55]">⭕</span>
          </div>
          <div className="flex flex-col">
            <h2 className="text-sm font-black uppercase tracking-[3px] text-white leading-none">Tic Tac Toe</h2>
            <div className="flex items-center space-x-1.5 mt-1.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_#22c55e]"></div>
              <span className="text-[8px] text-white/30 font-black uppercase tracking-widest">Live Arena</span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2.5">
          <button onClick={handleInvite} className="w-11 h-11 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all active:scale-95 group flex items-center justify-center shadow-lg">
            <UserPlus size={18} className="text-white/40 group-hover:text-white transition-colors" />
          </button>
          <button onClick={onClose} className="h-11 px-5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-all active:scale-95 group shadow-lg flex items-center">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">Quit</span>
          </button>
        </div>
      </div>

      {/* Main Game Container - Centered Vertically */}
      <div className="flex-1 flex flex-col justify-center w-full max-w-[320px] items-center">
        
        {/* Mode Switcher */}
        <div className="flex bg-white/5 p-1 rounded-2xl mb-10 w-full border border-white/5 z-10 shadow-2xl">
          <button onClick={() => { setGameMode('Solo'); resetGame(); }} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${gameMode === 'Solo' ? 'bg-white text-black shadow-lg scale-[1.02]' : 'text-white/40'}`}>vs Bot</button>
          <button onClick={() => { setGameMode('Duo'); resetGame(); }} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${gameMode === 'Duo' ? 'bg-white text-black shadow-lg scale-[1.02]' : 'text-white/40'}`}>Duo</button>
        </div>

        {/* Status Bar */}
        <div className="mb-10 text-center z-10 flex flex-col items-center">
          <div className={`text-5xl font-black transition-all duration-300 italic tracking-tighter ${winner ? (winner === 'X' ? 'text-white scale-110 shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'text-[#ff2d55] scale-110 shadow-[0_0_20px_rgba(255,45,85,0.3)]') : isAiThinking ? 'text-indigo-400 animate-pulse' : 'text-white'}`}>{status}</div>
          {(winner || isDraw) && (
            <button onClick={resetGame} className="mt-6 px-6 py-2.5 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center space-x-2">
              <RefreshCw size={12} strokeWidth={3} />
              <span>Rematch</span>
            </button>
          )}
        </div>

        {/* Game Board */}
        <div className="relative w-full aspect-square z-10 grid grid-cols-3 gap-3.5">
          {board.map((cell, i) => {
            const isWinningCell = winLine.includes(i);
            return (
              <button key={i} disabled={!!cell || winner !== null || (gameMode === 'Solo' && !isXNext)} onClick={() => handleClick(i)} className={`relative rounded-3xl flex items-center justify-center transition-all duration-300 border-2 shadow-[0_15px_30px_-5px_rgba(0,0,0,0.8)] ${cell ? (isWinningCell ? (cell === 'X' ? 'bg-white/30 border-white scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'bg-[#ff2d55]/30 border-[#ff2d55] scale-105 shadow-[0_0_20px_rgba(255,45,85,0.3)]') : 'bg-white/5 border-white/10') : 'bg-[#0a0a0a] border-white/5 active:scale-95'}`}>
                <span className={`text-6xl font-black transition-all duration-500 italic ${cell ? 'scale-100 opacity-100' : 'scale-0 opacity-0'} ${cell === 'X' ? 'text-white' : 'text-[#ff2d55]'}`}>{cell}</span>
              </button>
            );
          })}
        </div>
      </div>

      {showInviteToast && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[260px] bg-white text-black p-4 rounded-3xl shadow-[0_30px_60px_-12px_rgba(0,0,0,0.8)] flex flex-col items-center space-y-3 animate-in zoom-in duration-300 z-[500]">
          <div className="w-12 h-12 bg-[#ff2d55] rounded-2xl flex items-center justify-center text-white shadow-xl shadow-red-500/30"><Heart size={24} fill="currentColor" /></div>
          <span className="text-[10px] font-black uppercase tracking-[3px] leading-none text-center">Code Copied!<br/><span className="text-black/40 mt-1 block">Share with buddy.</span></span>
        </div>
      )}

      <style>{`
        @keyframes heart-fly { 0% { transform: translateY(0) scale(0.5); opacity: 0; } 10% { opacity: 1; } 100% { transform: translateY(-1000px) scale(2) rotate(45deg); opacity: 0; } }
      `}</style>
    </div>
  );
};

export default TicTacToe;