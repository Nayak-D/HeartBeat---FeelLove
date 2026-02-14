import React, { useState, useEffect } from 'react';
import { Tab, Game } from './types';
import FireTab from './components/FireTab';
import ArcadeTab from './components/ArcadeTab';
import ChatTab from './components/ChatTab';
import PeopleTab from './components/PeopleTab';
import SettingsScreen from './components/Settings/SettingsScreen';
import BottomNav from './components/Layout/BottomNav';
import CallOverlay from './components/Chat/CallOverlay';
import GameModal from './components/Games/GameModal';
import AiChat from './components/Chat/AiChat';
import { Bell, Heart, MessageCircle, Sparkles } from 'lucide-react';

const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=200&h=200&fit=crop';

interface ChatMessage {
  id: string;
  sender: 'me' | 'partner';
  text: string;
  timestamp: Date;
}

interface Notification {
  id: string;
  type: 'haptic' | 'message' | 'game';
  title: string;
  body: string;
  icon: React.ReactNode;
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.FIRE);
  const [activeCall, setActiveCall] = useState<{ type: 'voice' | 'video'; name: string } | null>(null);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [showAiChat, setShowAiChat] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [notification, setNotification] = useState<Notification | null>(null);

  // Permanent User Identity
  useEffect(() => {
    if (!localStorage.getItem('hb_user_invite_code')) {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      const code = Array.from({ length: 6 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
      localStorage.setItem('hb_user_invite_code', code);
    }
  }, []);

  // Global Profile State
  const [profile, setProfile] = useState({
    name: localStorage.getItem('hb_user_name') || 'Cuddle Master',
    avatar: localStorage.getItem('hb_profile_pic') || DEFAULT_AVATAR,
    isCustom: localStorage.getItem('hb_is_custom') === 'true',
    inviteCode: localStorage.getItem('hb_user_invite_code') || '......'
  });

  // Partner State
  const [partner, setPartner] = useState<{ name: string; avatar: string; code: string } | null>(() => {
    const saved = localStorage.getItem('hb_partner');
    return saved ? JSON.parse(saved) : null;
  });

  // Messages State
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
      const saved = localStorage.getItem('hb_chat_history');
      if (saved) {
          try {
            const parsed = JSON.parse(saved);
            return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
          } catch(e) { return []; }
      }
      return [
        { id: '1', sender: 'partner', text: 'Welcome to HeartBeat! Invite your partner to start the journey ❤️', timestamp: new Date(Date.now() - 3600000) }
      ];
  });

  const showPushNotification = (notif: Notification) => {
    setNotification(notif);
    if (navigator.vibrate) navigator.vibrate([40, 100, 40]);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleConnectPartner = (name: string, avatar: string, code: string) => {
    const newPartner = { name, avatar, code };
    setPartner(newPartner);
    localStorage.setItem('hb_partner', JSON.stringify(newPartner));
    setActiveTab(Tab.FIRE);
    showPushNotification({
        id: 'link',
        type: 'game',
        title: 'Circles Synced',
        body: `${name} is now linked to your HeartBeat.`,
        icon: <Sparkles size={16} className="text-indigo-400" />
    });
  };

  const sendMessage = (text: string, sender: 'me' | 'partner' = 'me') => {
      const newMessage: ChatMessage = { id: Date.now().toString(), sender, text, timestamp: new Date() };
      setMessages(prev => {
          const next = [...prev, newMessage];
          localStorage.setItem('hb_chat_history', JSON.stringify(next));
          return next;
      });

      if (sender === 'me' && partner) {
          setTimeout(() => {
              const replies = ["Mwah! 💋", "You're so sweet!", "Miss you!", "Thinking about you too! ✨"];
              const replyText = replies[Math.floor(Math.random() * replies.length)];
              sendMessage(replyText, 'partner');
              showPushNotification({
                id: Date.now().toString(),
                type: 'message',
                title: partner.name,
                body: replyText,
                icon: <MessageCircle size={16} className="text-pink-500" />
              });
          }, 3000);
      }
  };

  const handleInteractionComplete = (msg: string) => {
      sendMessage(msg, 'me');
      if (partner) {
          setTimeout(() => {
            showPushNotification({
                id: 'haptic',
                type: 'haptic',
                title: 'Heartbeat Received',
                body: `${partner.name} is holding their heart for you...`,
                icon: <Heart size={16} className="text-red-500 fill-red-500" />
            });
          }, 5000);
      }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
    if (navigator.vibrate) navigator.vibrate(20);
  };

  const handleResetApp = () => {
    localStorage.clear();
    window.location.reload();
  };

  const isLight = theme === 'light';

  return (
    <div className="device-wrapper">
      <div className="device-container">
        <div className="side-button volume-up"></div>
        <div className="side-button volume-down"></div>
        <div className="side-button power-btn"></div>

        {/* Removed transition-all to prevent horizontal width wobbling between sections */}
        <div className={`mobile-frame relative flex flex-col transition-colors duration-700 ${isLight ? 'bg-[#fff5f7]' : 'bg-black'}`}>
          <div className="glass-glare"></div>

          {/* Global Notification Toast */}
          {notification && (
            <div className="absolute top-16 left-4 right-4 z-[300] animate-in slide-in-from-top-12 duration-500">
               <div 
                onClick={() => { setActiveTab(Tab.CHAT); setNotification(null); }}
                className="bg-black/90 backdrop-blur-xl border border-white/10 p-4 rounded-[1.8rem] shadow-[0_20px_40px_rgba(0,0,0,0.6)] flex items-center space-x-4 cursor-pointer active:scale-95 transition-all"
               >
                  <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shrink-0">
                     {notification.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                     <h5 className="text-[10px] font-black uppercase tracking-widest text-white/40">{notification.title}</h5>
                     <p className="text-xs font-bold text-white truncate">{notification.body}</p>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
               </div>
            </div>
          )}

          <div className="dynamic-island">
            <div className="flex space-x-1.5 items-center">
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isLight ? 'bg-[#ff2d55]' : 'bg-[#d946ef]'}`}></div>
              <div className="w-10 h-1 bg-white/10 rounded-full"></div>
              <div className="w-1.5 h-1.5 bg-white/20 rounded-full"></div>
            </div>
          </div>

          <header className="px-6 pt-12 pb-6 flex justify-between items-center z-[5] shrink-0">
            <h1 id="main-logo" className={`text-2xl font-bold tracking-tighter font-serif italic transition-colors duration-500 ${isLight ? 'text-[#ff2d55]' : 'text-white'}`}>HeartBeat</h1>
          </header>

          {/* Locked Content Area - Strict width constraints */}
          <main className={`flex-1 w-full max-w-full min-w-0 min-h-0 box-border overflow-y-auto overflow-x-hidden custom-scrollbar px-6 pb-24 relative z-10 transition-colors duration-700 ${isLight ? 'text-slate-800' : 'text-white'}`}>
            {activeTab === Tab.FIRE && (
                <FireTab 
                    theme={theme} 
                    userProfile={profile} 
                    partner={partner}
                    onConnectPartner={handleConnectPartner}
                    onInteractionComplete={handleInteractionComplete}
                />
            )}
            {activeTab === Tab.ARCADE && <ArcadeTab onSelectGame={setSelectedGame} theme={theme} userProfile={profile} />}
            {activeTab === Tab.CHAT && (
                <ChatTab 
                    onStartCall={(t, n) => setActiveCall({ type: t, name: n })} 
                    partner={partner} 
                    onConnectPartner={handleConnectPartner} 
                    theme={theme} 
                    messages={messages}
                    onSendMessage={(text) => sendMessage(text, 'me')}
                />
            )}
            {activeTab === Tab.PEOPLE && <PeopleTab userProfile={profile} />}
            {activeTab === Tab.SETTINGS && (
              <SettingsScreen 
                onBack={() => setActiveTab(Tab.FIRE)} 
                onOpenAi={() => setShowAiChat(true)}
                onSignOut={handleResetApp}
                theme={theme}
                onUpdateProfile={(name, avatar, isCustom) => setProfile(p => ({...p, name, avatar, isCustom: !!isCustom}))}
                onToggleTheme={toggleTheme}
                profile={profile}
              />
            )}
          </main>

          <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} theme={theme} />
          <div className={`home-indicator transition-colors duration-700 ${isLight ? 'bg-pink-300' : 'bg-white/40'}`}></div>

          {showAiChat && <AiChat onBack={() => setShowAiChat(false)} />}
          {selectedGame && <div className="absolute inset-0 z-[100] bg-black"><GameModal game={selectedGame} onClose={() => setSelectedGame(null)} /></div>}
          {activeCall && <div className="absolute inset-0 z-[120] overflow-hidden"><CallOverlay type={activeCall.type} name={activeCall.name} onEnd={() => setActiveCall(null)} /></div>}
        </div>
      </div>
    </div>
  );
};

export default App;