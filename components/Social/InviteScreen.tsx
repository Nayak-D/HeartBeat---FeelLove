import React, { useState } from 'react';
import { ChevronLeft, Share2, Copy, Check } from 'lucide-react';

interface InviteScreenProps {
  onBack: () => void;
}

const InviteScreen: React.FC<InviteScreenProps> = ({ onBack }) => {
  const [partnerCode, setPartnerCode] = useState('');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');
  const [userCode] = useState(() => {
    // Generate a random 6-character code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    return Array.from({ length: 6 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  });

  const handleShare = async () => {
    const shareText = `Connect with me! My invite code is: ${userCode}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Invite',
          text: shareText,
          url: window.location.href,
        });
        if (navigator.vibrate) navigator.vibrate(30);
        return;
      } catch (err) {
        console.warn("Navigator share failed or cancelled:", err);
      }
    }

    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(shareText);
        setCopyStatus('copied');
        if (navigator.vibrate) navigator.vibrate(30);
        setTimeout(() => setCopyStatus('idle'), 3000);
      } else {
        throw new Error("Clipboard API unavailable");
      }
    } catch (err) {
      console.error("Clipboard write permission denied or failed:", err);
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 4000);
    }
  };

  const handleConnect = () => {
    if (partnerCode.length === 6) {
      if (navigator.vibrate) navigator.vibrate([20, 50]);
      onBack();
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-[200] flex flex-col p-6 animate-in slide-in-from-bottom duration-500 overflow-y-auto custom-scrollbar">
      {/* Branding removed as requested */}
      <div className="pt-10 mb-6 shrink-0" />

      {/* Back Button */}
      <button 
        onClick={onBack}
        className="mb-4 w-10 h-10 flex items-center justify-center text-white/80 hover:text-white transition-colors shrink-0"
      >
        <ChevronLeft size={28} />
      </button>

      {/* Main Heading */}
      <h2 className="text-2xl font-bold text-white mb-8 leading-tight shrink-0 max-w-[280px]">
        Let's connect with your partner.
      </h2>

      {/* User's Code Display */}
      <div className="bg-[#151515] rounded-[2rem] min-h-[100px] flex items-center justify-center mb-4 border border-white/5 relative shrink-0">
        <span className="text-4xl sm:text-5xl font-bold tracking-widest text-white uppercase font-sans">
          {userCode}
        </span>
        {copyStatus === 'copied' && (
          <div className="absolute -top-3 right-4 bg-green-500 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-full animate-in zoom-in fade-in duration-300 shadow-lg">
            Copied!
          </div>
        )}
      </div>

      {/* Share Button */}
      <button 
        onClick={handleShare}
        className={`w-full h-16 rounded-full font-bold text-lg mb-8 active:scale-[0.98] transition-all shadow-2xl flex items-center justify-center shrink-0 ${
          copyStatus === 'error' ? 'bg-red-500 text-white' : 'bg-white text-black'
        }`}
      >
        {copyStatus === 'copied' ? (
          <div className="flex items-center space-x-2">
            <Check size={18} />
            <span className="text-sm">Code Copied</span>
          </div>
        ) : copyStatus === 'error' ? (
          <div className="flex items-center space-x-2">
            <Copy size={18} />
            <span className="text-xs">Copy Manually: {userCode}</span>
          </div>
        ) : (
          <span className="text-sm sm:text-base">Share code with partner</span>
        )}
      </button>

      {/* "or" separator */}
      <div className="flex items-center justify-center mb-8 shrink-0">
        <span className="text-white/20 font-black text-[10px] uppercase tracking-widest">or</span>
      </div>

      {/* Partner Code Entry */}
      <div className="space-y-3 shrink-0 mb-6">
        <div className="relative">
          <input 
            type="text"
            maxLength={6}
            value={partnerCode}
            onChange={(e) => setPartnerCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            placeholder="999999"
            className="w-full h-24 bg-[#151515] rounded-[2rem] border border-white/5 text-4xl sm:text-5xl font-bold text-center text-white focus:text-white transition-all outline-none uppercase placeholder:text-white/5"
          />
          {partnerCode.length === 6 && (
            <button 
              onClick={handleConnect}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-3.5 bg-indigo-500 rounded-full text-white animate-in zoom-in shadow-xl hover:bg-[#d946ef]"
            >
              <Share2 size={20} />
            </button>
          )}
        </div>
        <p className="text-center text-white/60 font-medium text-sm">
          Enter partner's code
        </p>
      </div>

      {/* Branding detail at bottom */}
      <div className="mt-auto pt-6 pb-4 flex justify-center opacity-5 shrink-0">
         <div className="w-1 h-1 bg-white rounded-full mx-1"></div>
         <div className="w-1 h-1 bg-white rounded-full mx-1"></div>
         <div className="w-1 h-1 bg-white rounded-full mx-1"></div>
      </div>
    </div>
  );
};

export default InviteScreen;