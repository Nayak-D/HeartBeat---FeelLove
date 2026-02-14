
import React, { useEffect, useRef } from 'react';
// Added Heart to the imported icons from lucide-react
import { Search, Phone, Video, Send, Camera, Mic, UserPlus, Sparkles, Smile, Heart } from 'lucide-react';
import InviteScreen from './Social/InviteScreen';

interface ChatMessage {
  id: string;
  sender: 'me' | 'partner';
  text: string;
  timestamp: Date;
}

interface ChatTabProps {
    onStartCall: (type: 'voice' | 'video', name: string) => void;
    partner: { name: string; avatar: string } | null;
    onConnectPartner: (name: string, avatar: string) => void;
    theme: 'light' | 'dark';
    messages: ChatMessage[];
    onSendMessage: (text: string) => void;
}

const ChatTab: React.FC<ChatTabProps> = ({ onStartCall, partner, onConnectPartner, theme, messages, onSendMessage }) => {
  const [showInviteScreen, setShowInviteScreen] = React.useState(false);
  const [messageText, setMessageText] = React.useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isLight = theme === 'light';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (partner) scrollToBottom();
  }, [messages, partner]);

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    onSendMessage(messageText);
    setMessageText('');
    if (navigator.vibrate) navigator.vibrate(10);
  };

  if (showInviteScreen) {
    return <InviteScreen onBack={() => setShowInviteScreen(false)} onConnect={onConnectPartner} />;
  }

  if (partner) {
    return (
      <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500 pb-10">
        {/* Chat Header */}
        <div className={`p-4 rounded-[2.5rem] border flex items-center justify-between shadow-xl transition-all duration-500 ${isLight ? 'bg-white border-pink-50' : 'bg-white/5 border-white/5'}`}>
            <div className="flex items-center space-x-3">
                <div className="relative">
                    <img src={partner.avatar} className="w-11 h-11 rounded-[1.2rem] object-cover border-2 border-pink-500/20" alt={partner.name} />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-sm"></div>
                </div>
                <div>
                    <h3 className={`text-sm font-black italic tracking-tight ${isLight ? 'text-slate-800' : 'text-white'}`}>{partner.name}</h3>
                    <p className="text-[8px] font-black uppercase tracking-[2px] opacity-40">Online</p>
                </div>
            </div>
            <div className="flex items-center space-x-2">
                <button 
                  onClick={() => onStartCall('voice', partner.name)} 
                  className={`p-3 rounded-2xl transition-all active:scale-90 ${isLight ? 'bg-indigo-50 text-indigo-500' : 'bg-indigo-500/10 text-indigo-400'}`}
                >
                    <Phone size={18} fill="currentColor" />
                </button>
                <button 
                  onClick={() => onStartCall('video', partner.name)} 
                  className={`p-3 rounded-2xl transition-all active:scale-90 ${isLight ? 'bg-pink-50 text-pink-500' : 'bg-pink-500/10 text-pink-400'}`}
                >
                    <Video size={18} fill="currentColor" />
                </button>
            </div>
        </div>

        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar px-1 py-4">
            {messages.map((m) => (
                <div key={m.id} className={`flex flex-col ${m.sender === 'me' ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-[1.8rem] text-[11px] font-bold shadow-sm transition-all duration-300 ${
                        m.sender === 'me' 
                        ? (isLight ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-indigo-500 text-white rounded-tr-none')
                        : (isLight ? 'bg-white border border-pink-50 text-slate-800 rounded-tl-none' : 'bg-white/10 border border-white/5 text-white rounded-tl-none')
                    }`}>
                        {m.text}
                    </div>
                    <span className="text-[7px] font-black uppercase opacity-20 mt-1.5 px-2">
                        {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>
            ))}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className={`p-2 rounded-[2.2rem] border flex items-center transition-all duration-500 ${isLight ? 'bg-white border-slate-100 shadow-xl' : 'bg-white/5 border-white/5'}`}>
            <button className={`p-3 rounded-2xl transition-colors ${isLight ? 'text-slate-300 hover:text-pink-500' : 'text-white/20 hover:text-indigo-400'}`}>
                <Camera size={20} />
            </button>
            <input 
                type="text" 
                placeholder="Send some love..."
                className="flex-1 bg-transparent py-3 px-3 text-xs font-bold outline-none placeholder:opacity-30"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            {messageText.trim() ? (
                <button 
                    onClick={handleSendMessage}
                    className="p-3 bg-indigo-500 text-white rounded-2xl shadow-lg animate-in zoom-in duration-300"
                >
                    <Send size={18} fill="currentColor" />
                </button>
            ) : (
                <div className="flex items-center space-x-1 pr-1">
                    <button className={`p-3 rounded-2xl ${isLight ? 'text-slate-300' : 'text-white/20'}`}>
                        <Smile size={20} />
                    </button>
                    <button className={`p-3 rounded-2xl ${isLight ? 'text-slate-300' : 'text-white/20'}`}>
                        <Mic size={20} />
                    </button>
                </div>
            )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="flex justify-between items-center px-1">
        <h2 className={`text-3xl font-black italic uppercase tracking-tighter ${isLight ? 'text-slate-800' : 'text-white'}`}>Messages</h2>
        <div className="flex items-center space-x-4">
            <Search size={22} className="opacity-30" />
            <Smile size={22} className="opacity-30" />
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-10 px-6 text-center">
        <div className="relative mb-8 group">
            <div className={`w-28 h-28 rounded-[3rem] flex items-center justify-center border-4 border-dashed transition-all duration-500 group-hover:rotate-12 ${isLight ? 'bg-pink-50 border-pink-100' : 'bg-white/5 border-white/10'}`}>
                <Heart size={48} className={`transition-all duration-500 group-hover:scale-125 ${isLight ? 'text-pink-200' : 'text-white/10'}`} fill="currentColor" />
            </div>
            <div className="absolute -bottom-2 -right-2 w-11 h-11 bg-pink-500 rounded-2xl flex items-center justify-center shadow-xl border-4 border-black animate-bounce">
                <UserPlus size={20} className="text-white" />
            </div>
        </div>
        
        <h3 className={`text-2xl font-black italic uppercase tracking-tighter mb-2 ${isLight ? 'text-slate-800' : 'text-white'}`}>Find Your Vibe</h3>
        <p className="text-[11px] font-bold leading-relaxed mb-10 max-w-[200px] opacity-40">
            Messages are more fun when shared. Connect with your partner to start your journey.
        </p>

        <button 
            onClick={() => setShowInviteScreen(true)}
            className={`w-full py-5 rounded-[2.2rem] font-black uppercase tracking-[4px] text-[10px] shadow-2xl active:scale-95 transition-all flex items-center justify-center space-x-3 ${
                isLight ? 'bg-indigo-600 text-white shadow-indigo-100' : 'bg-white text-black shadow-white/5'
            }`}
        >
            <span>Connect Partner</span>
            <Sparkles size={16} fill={isLight ? 'white' : 'black'} />
        </button>
      </div>

      <div className="px-1 text-center py-4">
        <p className="text-[8px] font-black text-white/5 uppercase tracking-[5px]">HeartBeat End-to-End Encryption</p>
      </div>
    </div>
  );
};

export default ChatTab;
