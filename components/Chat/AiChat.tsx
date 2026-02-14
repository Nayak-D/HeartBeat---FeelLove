import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { AiMessage, AiMode } from '../../types';
import { Send, Sparkles, Zap, ChevronLeft, Bot, Mic, Camera } from 'lucide-react';

interface AiChatProps {
  onBack: () => void;
}

const AiChat: React.FC<AiChatProps> = ({ onBack }) => {
  const [messages, setMessages] = useState<AiMessage[]>([
    { id: '1', role: 'model', text: "Hey there! I am HeartBeat AI. I can think deeply or respond instantly. What's on your mind?" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [mode, setMode] = useState<AiMode>('fast');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: AiMessage = { id: Date.now().toString(), role: 'user', text: input };
    const currentMessages = [...messages, userMessage];
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const modelName = mode === 'pro' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
      
      const response = await ai.models.generateContent({
        model: modelName,
        contents: currentMessages.map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        })),
        config: {
          systemInstruction: "You are HeartBeat AI, a friendly, witty, and helpful companion in the HeartBeat social app. You love games, music, and helping people connect. Keep responses engaging, supportive, and relatively concise."
        }
      });

      const aiText = response.text || "I'm drawing a blank right now. Can we try that again?";
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', text: aiText }]);
    } catch (error: any) {
      console.error("AI Error:", error);
      const errorMsg = error?.message || String(error);
      
      if (errorMsg.includes('Requested entity was not found')) {
        setMessages(prev => [...prev, { 
          id: Date.now().toString(), 
          role: 'model', 
          text: "It seems your API key session has expired or is invalid. Please re-select a paid project key to continue." 
        }]);
        if ((window as any).aistudio?.openSelectKey) {
          await (window as any).aistudio.openSelectKey();
        }
      } else if (errorMsg.includes('429')) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "I'm a bit overwhelmed right now (Rate limit hit). Please give me a moment!" }]);
      } else {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Sorry, I hit a snag. Check your connection or API key!" }]);
      }
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-black z-[60] flex flex-col animate-in fade-in slide-in-from-right duration-300">
      <div className="pt-12 pb-4 px-6 border-b border-white/5 flex items-center justify-between bg-black/50 backdrop-blur-xl">
        <div className="flex items-center space-x-3">
          <button onClick={onBack} className="p-2 -ml-2 text-white/50 hover:text-white">
            <ChevronLeft size={24} />
          </button>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Bot size={22} className="text-white" />
          </div>
          <div>
            <h3 className="font-bold text-sm">HeartBeat AI</h3>
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
              <span className="text-[10px] text-white/40 uppercase font-black tracking-widest">Online</span>
            </div>
          </div>
        </div>
        
        <div className="flex bg-white/5 p-1 rounded-xl">
          <button 
            onClick={() => setMode('fast')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${mode === 'fast' ? 'bg-white text-black shadow-lg' : 'text-white/40'}`}
          >
            <Zap size={14} fill={mode === 'fast' ? 'currentColor' : 'none'} />
            <span className="text-[10px] font-black uppercase tracking-widest">Fast</span>
          </button>
          <button 
            onClick={() => setMode('pro')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${mode === 'pro' ? 'bg-indigo-50 text-white shadow-lg' : 'text-white/40'}`}
          >
            <Sparkles size={14} fill={mode === 'pro' ? 'currentColor' : 'none'} />
            <span className="text-[10px] font-black uppercase tracking-widest">Pro</span>
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-3xl text-sm font-medium leading-relaxed ${
              m.role === 'user' 
                ? 'bg-white text-black rounded-tr-none' 
                : 'bg-white/10 text-white border border-white/5 rounded-tl-none'
            }`}>
              {m.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white/10 p-4 rounded-3xl rounded-tl-none flex space-x-1">
              <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce"></div>
              <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]"></div>
              <div className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]"></div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 pb-12 bg-black border-t border-white/5 flex items-center space-x-3">
        <button className="p-3 bg-white/5 rounded-2xl text-white/40">
          <Camera size={20} />
        </button>
        <div className="flex-1 relative">
          <input 
            type="text" 
            placeholder={mode === 'pro' ? "Ask Deep Thinking..." : "Ask Instant AI..."}
            className="w-full bg-white/5 rounded-2xl py-3.5 px-5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
        </div>
        {input.trim() ? (
          <button 
            onClick={handleSend}
            disabled={isTyping}
            className={`p-3.5 rounded-2xl transition-all shadow-lg active:scale-95 ${
              mode === 'pro' ? 'bg-indigo-500 text-white' : 'bg-white text-black'
            }`}
          >
            <Send size={20} fill={mode === 'pro' ? 'white' : 'black'} />
          </button>
        ) : (
          <button className="p-3 bg-white/5 rounded-2xl text-white/40">
            <Mic size={20} />
          </button>
        )}
      </div>
    </div>
  );
};

export default AiChat;