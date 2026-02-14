
import React, { useState } from 'react';
import { Game, Friend } from '../../types';
import { X, Users, Check, UserPlus, Share2 } from 'lucide-react';
import TicTacToe from './TicTacToe';
import MazeRun from './MazeRun';
import DrawDuel from './DrawDuel';
import Carrom from './Carrom';
import Archery from './Archery';
import LudoSyncExperience from '../experiences/LudoSyncExperience';
import ArrowOut from './ArrowOut';

interface GameModalProps {
  game: Game;
  onClose: () => void;
}

const GameModal: React.FC<GameModalProps> = ({ game, onClose }) => {
  const [showInviteOverlay, setShowInviteOverlay] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedFriends, setSelectedFriends] = useState<Set<string>>(new Set());

  const friends: Friend[] = [
    { id: '1', name: 'Zoya', avatar: 'https://i.pravatar.cc/150?u=zoya', status: 'online', lastSeen: 'Active now' },
    { id: '2', name: 'Rahul', avatar: 'https://i.pravatar.cc/150?u=rahul', status: 'offline', lastSeen: '2h ago' },
    { id: '3', name: 'Emma', avatar: 'https://i.pravatar.cc/150?u=emma', status: 'online', lastSeen: 'Active now' },
    { id: '4', name: 'Jake', avatar: 'https://i.pravatar.cc/150?u=jake', status: 'busy', lastSeen: 'In a game' },
    { id: '5', name: 'Sophie', avatar: 'https://i.pravatar.cc/150?u=sophie', status: 'online', lastSeen: 'Active now' },
  ];

  const toggleFriend = (id: string) => {
    const next = new Set(selectedFriends);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedFriends(next);
  };

  const handleOpenConfirm = () => {
    if (selectedFriends.size > 0) {
      setShowConfirmDialog(true);
    }
  };

  const handleFinalInvite = () => {
    alert(`Invitations successfully sent to ${selectedFriends.size} friends!`);
    setShowConfirmDialog(false);
    setShowInviteOverlay(false);
    setSelectedFriends(new Set());
  };

  const handleTriggerInvite = () => {
    setShowInviteOverlay(true);
  };

  return (
    <div className="absolute inset-0 z-[150] bg-black flex flex-col overflow-hidden touch-none animate-in fade-in zoom-in-95 duration-300">
      <main className="flex-1 relative flex flex-col items-center justify-center overflow-hidden h-full">
        <div className="w-full h-full flex items-center justify-center relative touch-none">
          {game.id === 'tic-tac-toe' && <TicTacToe onClose={onClose} />}
          {game.id === 'maze-run' && <MazeRun onClose={onClose} />}
          {game.id === 'draw-duel' && <DrawDuel onClose={onClose} />}
          {game.id === 'carrom' && <Carrom onInvite={handleTriggerInvite} onClose={onClose} />}
          {game.id === 'archery' && <Archery onClose={onClose} />}
          {game.id === 'ludo-pro' && <LudoSyncExperience onInvite={handleTriggerInvite} onClose={onClose} />}
          {game.id === 'arrow-out' && <ArrowOut onClose={onClose} />}
          
          {!['tic-tac-toe', 'maze-run', 'draw-duel', 'carrom', 'archery', 'ludo-pro', 'arrow-out'].includes(game.id) && (
            <div className="flex flex-col items-center text-center p-8 bg-black/80 absolute inset-0 z-50 justify-center">
              <div className="text-6xl mb-6 animate-pulse">{game.icon}</div>
              <h4 className="text-2xl font-black mb-4 uppercase italic">Loading {game.title}...</h4>
              <div className="w-10 h-10 border-4 border-t-indigo-500 border-white/5 rounded-full animate-spin mb-8"></div>
              <button 
                onClick={onClose}
                className="px-6 py-3 bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/40"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </main>

      {showInviteOverlay && (
        <div className="absolute inset-0 bg-black/98 z-[200] flex flex-col p-6 animate-in slide-in-from-bottom duration-300">
          <div className="pt-12 flex justify-between items-center mb-8">
            <div>
              <h4 className="text-3xl font-black uppercase italic tracking-tighter">Invite Friends</h4>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Select buddies to play</p>
            </div>
            <button onClick={() => setShowInviteOverlay(false)} className="p-3 bg-white/5 rounded-2xl text-white/50">
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pb-6">
            {friends.map(friend => (
              <div 
                key={friend.id}
                onClick={() => toggleFriend(friend.id)}
                className={`flex items-center justify-between p-4 rounded-[2rem] transition-all border ${
                  selectedFriends.has(friend.id) 
                    ? 'bg-indigo-500/20 border-indigo-500/30' 
                    : 'bg-white/5 border-transparent'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <img src={friend.avatar} alt="" className="w-12 h-12 rounded-2xl object-cover" />
                    <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-black ${friend.status === 'online' ? 'bg-green-500' : 'bg-gray-500'}`} />
                  </div>
                  <div>
                    <h5 className="font-bold text-base text-white">{friend.name}</h5>
                    <p className="text-[8px] text-white/30 uppercase font-black tracking-widest">{friend.status}</p>
                  </div>
                </div>
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                  selectedFriends.has(friend.id) ? 'bg-white border-white text-black scale-110 shadow-lg' : 'border-white/10 bg-black/20'
                }`}>
                  {selectedFriends.has(friend.id) && <Check size={16} strokeWidth={4} />}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 pb-8">
            <button 
              disabled={selectedFriends.size === 0}
              onClick={handleOpenConfirm}
              className="w-full py-6 bg-white text-black rounded-3xl font-black uppercase tracking-[3px] shadow-2xl disabled:opacity-30 active:scale-[0.98] transition-all text-xs"
            >
              Send {selectedFriends.size} Invite{selectedFriends.size !== 1 ? 's' : ''}
            </button>
          </div>

          {showConfirmDialog && (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-[210] flex items-center justify-center p-8">
              <div className="bg-[#111] border border-white/10 rounded-[3.5rem] p-10 w-full max-w-xs text-center space-y-8 shadow-2xl animate-in zoom-in duration-300">
                <div className="w-16 h-16 bg-white/5 rounded-[1.5rem] flex items-center justify-center mx-auto border border-white/10">
                  <Users size={32} className="text-white" />
                </div>
                <div>
                  <h5 className="text-2xl font-black uppercase italic text-white mb-2">Start Lobby?</h5>
                  <p className="text-[9px] text-white/30 uppercase tracking-[4px] leading-relaxed">Notifications will be sent instantly.</p>
                </div>
                <div className="space-y-3">
                  <button onClick={handleFinalInvite} className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl active:scale-95 transition-all">Send Now</button>
                  <button onClick={() => setShowConfirmDialog(false)} className="w-full py-5 bg-white/5 text-white/50 rounded-2xl font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all">Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GameModal;
