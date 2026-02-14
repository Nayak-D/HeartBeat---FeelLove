
import React, { useState } from 'react';
import { Heart, Sparkles, Trophy, RefreshCw, Star, User, Users } from 'lucide-react';

interface LoveQuizProps {
  theme: 'light' | 'dark';
  userAvatar: string;
}

const QUESTIONS = [
  { id: 1, text: "Who gives better cuddles?", icon: "🤗" },
  { id: 2, text: "Who is more likely to start a silly argument?", icon: "🤪" },
  { id: 3, text: "Who is the better cook?", icon: "🍳" },
  { id: 4, text: "Who falls asleep first during a movie?", icon: "😴" },
  { id: 5, text: "Who is more romantic?", icon: "🌹" },
];

const PARTNER_AVATAR = "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=200&h=200&fit=crop";

const LoveQuiz: React.FC<LoveQuizProps> = ({ theme, userAvatar }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [results, setResults] = useState<{ me: number; partner: number }>({ me: 0, partner: 0 });
  const [isFinished, setIsFinished] = useState(false);
  const isLight = theme === 'light';

  const handleSelect = (choice: 'me' | 'partner') => {
    if (navigator.vibrate) navigator.vibrate(15);
    setResults(prev => ({
      ...prev,
      [choice]: prev[choice] + 1
    }));

    if (currentIdx < QUESTIONS.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  const resetQuiz = () => {
    setCurrentIdx(0);
    setResults({ me: 0, partner: 0 });
    setIsFinished(false);
  };

  if (isFinished) {
    return (
      <div className="space-y-4 animate-in zoom-in duration-500">
        <div className="flex justify-between items-center px-1">
          <h3 className={`text-xl font-black italic tracking-tighter uppercase ${isLight ? 'text-pink-600' : 'text-white'}`}>Vibe Match</h3>
        </div>
        <div className={`rounded-[3rem] p-8 border transition-all duration-500 shadow-2xl text-center space-y-6 ${
          isLight ? 'bg-white border-pink-50' : 'bg-white/5 border-white/5 shadow-black/40'
        }`}>
          <div className="w-20 h-20 bg-gradient-to-br from-pink-500 to-indigo-500 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-xl">
            <Trophy size={40} className="text-white" />
          </div>
          <div>
            <h4 className="text-2xl font-black italic uppercase leading-none mb-2">Quiz Finished!</h4>
            <p className="text-xs opacity-50 font-medium">You've completed today's connection quiz.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-4 rounded-3xl border ${isLight ? 'bg-indigo-50 border-indigo-100' : 'bg-indigo-500/10 border-indigo-500/20'}`}>
                <span className="text-[10px] font-black uppercase text-indigo-400 block mb-1">Me</span>
                <span className="text-2xl font-black italic">{results.me}</span>
            </div>
            <div className={`p-4 rounded-3xl border ${isLight ? 'bg-pink-50 border-pink-100' : 'bg-pink-500/10 border-pink-500/20'}`}>
                <span className="text-[10px] font-black uppercase text-pink-400 block mb-1">Partner</span>
                <span className="text-2xl font-black italic">{results.partner}</span>
            </div>
          </div>

          <button 
            onClick={resetQuiz}
            className={`w-full py-5 rounded-3xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center space-x-3 shadow-xl active:scale-95 transition-all ${
              isLight ? 'bg-indigo-600 text-white' : 'bg-white text-black'
            }`}
          >
            <RefreshCw size={16} />
            <span>Try Again</span>
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = QUESTIONS[currentIdx];

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex justify-between items-center px-1">
        <h3 className={`text-xl font-black italic tracking-tighter uppercase ${isLight ? 'text-pink-600' : 'text-white'}`}>Love Quiz</h3>
        <div className="flex items-center space-x-2 bg-indigo-500/10 px-3 py-1 rounded-full">
            <span className="text-[10px] font-black uppercase text-indigo-500">Q {currentIdx + 1}/{QUESTIONS.length}</span>
        </div>
      </div>

      <div className={`rounded-[3rem] p-8 border transition-all duration-500 shadow-2xl overflow-hidden relative ${
        isLight ? 'bg-white border-pink-50' : 'bg-white/5 border-white/5 shadow-black/40'
      }`}>
        
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1.5 bg-black/5">
           <div 
             className="h-full bg-gradient-to-r from-indigo-500 to-pink-500 transition-all duration-500" 
             style={{ width: `${((currentIdx + 1) / QUESTIONS.length) * 100}%` }} 
           />
        </div>

        <div className="flex flex-col items-center space-y-10 py-4">
            <div className="text-center space-y-2">
                <div className="text-4xl mb-2 animate-bounce">{currentQuestion.icon}</div>
                <h4 className="text-2xl font-black italic uppercase tracking-tight leading-tight max-w-[240px]">{currentQuestion.text}</h4>
            </div>

            <div className="grid grid-cols-2 gap-8 w-full max-w-[300px]">
                {/* Me Option */}
                <button 
                  onClick={() => handleSelect('me')}
                  className="flex flex-col items-center space-y-4 group"
                >
                    <div className={`relative w-24 h-24 rounded-[2.5rem] overflow-hidden border-4 transition-all duration-500 group-hover:scale-110 group-active:scale-95 ${
                      isLight ? 'border-indigo-100 shadow-xl' : 'border-white/10 shadow-2xl'
                    }`}>
                        <img src={userAvatar} className="w-full h-full object-cover" alt="Me" />
                        <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/20 transition-colors" />
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-[3px] ${isLight ? 'text-indigo-600' : 'text-white'}`}>It's Me</span>
                </button>

                {/* Partner Option */}
                <button 
                  onClick={() => handleSelect('partner')}
                  className="flex flex-col items-center space-y-4 group"
                >
                    <div className={`relative w-24 h-24 rounded-[2.5rem] overflow-hidden border-4 transition-all duration-500 group-hover:scale-110 group-active:scale-95 ${
                      isLight ? 'border-pink-100 shadow-xl' : 'border-white/10 shadow-2xl'
                    }`}>
                        <img src={PARTNER_AVATAR} className="w-full h-full object-cover" alt="Partner" />
                        <div className="absolute inset-0 bg-pink-500/0 group-hover:bg-pink-500/20 transition-colors" />
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-[3px] ${isLight ? 'text-pink-600' : 'text-white'}`}>It's You</span>
                </button>
            </div>
        </div>

        <div className="mt-10 pt-6 border-t border-inherit flex items-center justify-center">
            <div className="flex items-center space-x-2 opacity-30">
                <Heart size={14} className="animate-pulse fill-current" />
                <span className="text-[9px] font-black uppercase tracking-[4px]">Bonding Session</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LoveQuiz;
