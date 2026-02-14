
import React, { useState, useMemo } from 'react';
import ThumbKiss from './Fire/ThumbKiss';
import DailyNormal from './Fire/DailyNormal';
import DistanceTracker from './Fire/DistanceTracker';
import LoveQuiz from './Fire/LoveQuiz';
import InviteScreen from './Social/InviteScreen';
import { Heart, Sparkles, UserCheck } from 'lucide-react';

interface FireTabProps {
  theme: 'light' | 'dark';
  userProfile: { name: string; avatar: string; inviteCode: string };
  partner: { name: string; avatar: string; code: string } | null;
  onConnectPartner: (name: string, avatar: string, code: string) => void;
  onInteractionComplete: (message: string) => void;
}

const FireTab: React.FC<FireTabProps> = ({ theme, userProfile, partner, onConnectPartner, onInteractionComplete }) => {
  const [showInviteScreen, setShowInviteScreen] = useState(false);
  const [poppedHearts, setPoppedHearts] = useState<Set<number>>(new Set());

  const heartParticles = useMemo(() => {
    return Array.from({ length: 30 }).map((_, i) => {
      const duration = 6 + Math.random() * 6;
      return {
        id: i,
        left: Math.random() * 100,
        size: 8 + Math.random() * 20,
        duration: duration,
        delay: -(Math.random() * duration),
        xOffset: (Math.random() - 0.5) * 60,
      };
    });
  }, []);

  const handleHeartPop = (id: number) => {
    if (poppedHearts.has(id)) return;
    if (navigator.vibrate) navigator.vibrate(8);
    setPoppedHearts(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    setTimeout(() => {
      setPoppedHearts(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }, 600);
  };

  const handleInvite = () => {
    setShowInviteScreen(true);
    if (navigator.vibrate) navigator.vibrate(50);
  };

  return (
    <div className="relative min-h-full">
      <div className="absolute -top-10 -left-10 w-[140%] h-[140%] pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-[700px] h-[700px] bg-[radial-gradient(circle_at_top_left,rgba(109,40,217,0.15),transparent_75%)] opacity-90"></div>
      </div>

      <div className="flex flex-col gap-5 relative z-10 pt-1">
        
        {/* Connect Banner - Reacts to Partner State */}
        <section className="relative">
          <div className="bg-gradient-to-br from-[#5b21b6] via-[#2e1065] to-[#000000] rounded-[2.2rem] p-4 sm:p-5 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.7)] flex flex-col space-y-4 relative overflow-hidden border border-white/10 group min-h-[100px]">
              <div className="flex justify-between items-center relative z-10 min-h-[80px]">
                  <div className="flex flex-col shrink-0 max-w-[40%]">
                    <h2 className="text-lg font-black tracking-tight text-white uppercase italic drop-shadow-[0_2px_10_rgba(0,0,0,0.5)] leading-none">
                      {partner ? 'Linked' : 'Connect'}
                    </h2>
                    <p className="text-[7px] font-black text-[#d946ef] uppercase tracking-[2px] mt-1.5 flex items-center">
                       {partner ? <UserCheck size={8} className="mr-1" /> : <Heart size={7} className="mr-1 fill-current" />}
                       {partner ? 'Forever' : 'Hearts'}
                    </p>
                  </div>
                  
                  <div className="flex-1 flex justify-center items-center h-full relative overflow-visible px-1">
                     <div className="absolute inset-0 w-full h-full z-30">
                        {heartParticles.map((heart) => (
                          <div
                            key={heart.id}
                            onPointerEnter={() => handleHeartPop(heart.id)}
                            className="absolute bottom-[-20px] cursor-pointer touch-none animate-premium-float"
                            style={{ 
                              left: `${heart.left}%`, 
                              animationDuration: `${heart.duration}s`, 
                              animationDelay: `${heart.delay}s` 
                            } as React.CSSProperties}
                          >
                            <div className={poppedHearts.has(heart.id) ? 'animate-popo-bounce' : ''}>
                              <Heart 
                                size={heart.size} 
                                fill="#fffafa" 
                                className={`text-[#fffafa] transition-all duration-300 filter drop-shadow-[0_0_10px_rgba(255,192,203,0.7)] ${poppedHearts.has(heart.id) ? 'opacity-100 scale-125' : 'opacity-60 scale-100'}`} 
                              />
                            </div>
                          </div>
                        ))}
                     </div>
                     {partner ? (
                       <div className="relative z-40 flex -space-x-3 items-center animate-in zoom-in duration-700">
                          <img src={userProfile.avatar} className="w-12 h-12 rounded-2xl border-4 border-black object-cover" alt="Me" />
                          <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center border-4 border-black z-10">
                             <Heart size={14} fill="white" className="text-white" />
                          </div>
                          <img src={partner.avatar} className="w-12 h-12 rounded-2xl border-4 border-black object-cover" alt="Partner" />
                       </div>
                     ) : (
                       <img 
                        src="https://media.tenor.com/y26S_Z9vYAsAAAAC/milk-and-mocha-bear-couple.gif" 
                        className="w-16 h-16 object-contain mix-blend-screen brightness-110 relative z-40 pointer-events-none" 
                        style={{ filter: 'drop-shadow(0 0 10px rgba(139,92,246, 0.4))' }} 
                        alt="Couples Animation" 
                       />
                     )}
                  </div>

                  <div className="shrink-0 relative z-50">
                    <button onClick={handleInvite} className="bg-white text-black text-[8px] font-black px-4 py-2.5 rounded-xl shadow-lg active:scale-90 transition-all uppercase tracking-widest border border-white/10">
                      {partner ? 'Profile' : 'Invite'}
                    </button>
                  </div>
              </div>
          </div>
        </section>

        {showInviteScreen && (
          <InviteScreen 
            onBack={() => setShowInviteScreen(false)} 
            onConnect={onConnectPartner} 
            userInviteCode={userProfile.inviteCode}
            connectedPartner={partner}
          />
        )}
        
        {/* 'Feel Connected' section */}
        <ThumbKiss onComplete={onInteractionComplete} partnerConnected={!!partner} />
        
        <DistanceTracker theme={theme} userAvatar={userProfile.avatar} partner={partner} />
        <LoveQuiz theme={theme} userAvatar={userProfile.avatar} partnerAvatar={partner?.avatar} />
        <DailyNormal theme={theme} partnerConnected={!!partner} />

      </div>

      <style>{`
        @keyframes premium-float {
          0% { transform: translateY(0) scale(0) translateX(0); opacity: 0; }
          10% { opacity: 0.8; transform: translateY(-15px) scale(1.1); }
          50% { transform: translateY(-100px) scale(1.0) translateX(15px); }
          100% { transform: translateY(-220px) scale(0.6) translateX(-15px); opacity: 0; }
        }
        @keyframes popo-bounce {
          0% { transform: scale(1); }
          30% { transform: scale(1.8); }
          100% { transform: scale(1); }
        }
        .animate-premium-float { 
          animation-name: premium-float; 
          animation-timing-function: linear; 
          animation-iteration-count: infinite; 
        }
        .animate-popo-bounce { 
          animation: popo-bounce 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; 
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default FireTab;
