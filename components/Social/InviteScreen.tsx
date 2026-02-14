import React, { useState } from 'react';
import { ChevronLeft, Share2, Copy, Check, Users, Sparkles, ShieldCheck } from 'lucide-react';

interface InviteScreenProps {
  onBack: () => void;
  onConnect?: (name: string, avatar: string, code: string) => void;
}

const InviteScreen: React.FC<InviteScreenProps> = ({ onBack, onConnect }) => {
  const [partnerCode, setPartnerCode] = useState('');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const [isConnecting, setIsConnecting] = useState(false);
  
  const [userCode] = useState(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 6 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  });

  const handleShare = async () => {
    const shareText = `Let's connect on HeartBeat! My invite code is: ${userCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'HeartBeat Invite',
          text: shareText,
          url: window.location.href,
        });
        if (navigator.vibrate) navigator.vibrate(30);
        return;
      } catch (err) {}
    }

    try {
      await navigator.clipboard.writeText(shareText);
      setCopyStatus('copied');
      if (navigator.vibrate) navigator.vibrate(30);
      setTimeout(() => setCopyStatus('idle'), 3000);
    } catch (err) {
      setCopyStatus('error');
    }
  };

  const handleConnect = () => {
    if (partnerCode.length === 6) {
      setIsConnecting(true);
      if (navigator.vibrate) navigator.vibrate([20, 100]);
      
      // Simulate connecting to partner via local sync concept
      setTimeout(() => {
        if (onConnect) {
          onConnect('Dreamer', 'https://i.pravatar.cc/150?u=dreamer', partnerCode);
        }
        setIsConnecting(false);
        onBack();
      }, 1500);
    }
  };

  return (
    <div className="absolute inset-0 bg-black z-[250] flex flex-col p-8 animate-in slide-in-from-bottom duration-500 overflow-y-auto custom-scrollbar">
      <div className="pt-10 flex justify-between items-center mb-8 shrink-0">
        <button 
          onClick={onBack}
          className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white/80 hover:text-white transition-all active:scale-90"
        >
          <ChevronLeft size={28} />
        </button>
        <div className="flex items-center space-x-2 bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-indigo-500/20">
          <ShieldCheck size={14} className="text-indigo-400" />
          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Verified Auth</span>
        </div>
      </div>

      <div className="mb-10 text-center space-y-2">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.2rem] flex items-center justify-center mx-auto shadow-2xl mb-6 ring-4 ring-white/5">
          <Users size={40} className="text-white" />
        </div>
        <h2 className="text-4xl font-black text-white leading-none tracking-tighter italic uppercase">
          Link Hearts
        </h2>
        <p className="text-white/30 font-bold uppercase tracking-[4px] text-[10px]">Invite Partner or Friends</p>
      </div>

      <div className="space-y-6">
        <section className="bg-white/5 rounded-[3rem] p-8 border border-white/10 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Sparkles size={100} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[3px] text-white/30 block mb-6">Your Personal Code</span>
          <div className="text-6xl font-black tracking-[10px] text-white uppercase mb-8 font-mono">
            {userCode}
          </div>
          <button 
            onClick={handleShare}
            className={`w-full py-6 rounded-[2rem] font-black uppercase text-xs tracking-[2px] transition-all shadow-xl active:scale-95 flex items-center justify-center space-x-3 ${
              copyStatus === 'copied' ? 'bg-green-500 text-white' : 'bg-white text-black'
            }`}
          >
            {copyStatus === 'copied' ? (
              <><Check size={18} /><span>Invite Sent</span></>
            ) : (
              <><Share2 size={18} /><span>Share Invite Link</span></>
            )}
          </button>
        </section>

        <div className="flex items-center justify-center py-4">
          <div className="h-[1px] flex-1 bg-white/5" />
          <span className="px-4 text-white/20 font-black text-[10px] uppercase tracking-widest italic">Sync with Peer</span>
          <div className="h-[1px] flex-1 bg-white/5" />
        </div>

        <section className="space-y-4">
          <div className="relative group">
            <input 
              type="text"
              maxLength={6}
              value={partnerCode}
              onChange={(e) => setPartnerCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              placeholder="Enter Invite Code"
              className="w-full h-24 bg-white/5 rounded-[2.5rem] border border-white/10 text-4xl font-black text-center text-white focus:border-indigo-500 transition-all outline-none uppercase placeholder:text-white/5 placeholder:text-2xl"
            />
            {partnerCode.length === 6 && (
              <button 
                onClick={handleConnect}
                disabled={isConnecting}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-16 h-16 bg-indigo-500 rounded-3xl text-white animate-in zoom-in flex items-center justify-center shadow-xl active:scale-90"
              >
                {isConnecting ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Sparkles size={24} fill="currentColor" />
                )}
              </button>
            )}
          </div>
          <p className="text-center text-white/20 font-black uppercase tracking-widest text-[9px]">
            Input your friend's unique code to link accounts
          </p>
        </section>
      </div>

      <div className="mt-auto pt-10 flex flex-col items-center opacity-10 space-y-2">
         <div className="flex space-x-2">
            <div className="w-1.5 h-1.5 bg-white rounded-full" />
            <div className="w-1.5 h-1.5 bg-white rounded-full" />
            <div className="w-1.5 h-1.5 bg-white rounded-full" />
         </div>
         <p className="text-[8px] font-black uppercase tracking-[4px]">Powered by Local Sync Engine</p>
      </div>
    </div>
  );
};

export default InviteScreen;