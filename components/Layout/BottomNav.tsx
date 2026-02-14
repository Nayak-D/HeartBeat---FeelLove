
import React from 'react';
import { Tab } from '../../types';
import { Flame, MessageCircle, Users, Settings, Gamepad2 } from 'lucide-react';

interface BottomNavProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  theme?: 'light' | 'dark';
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, setActiveTab, theme }) => {
  const isLight = theme === 'light';
  const activeAccent = isLight ? 'text-[#ff2d55] drop-shadow-[0_0_10px_rgba(255,45,85,0.6)]' : 'text-[#d946ef] drop-shadow-[0_0_10px_rgba(217,70,239,0.8)]';

  return (
    <nav className={`absolute bottom-0 left-0 right-0 h-20 backdrop-blur-md border-t flex items-start justify-around px-2 pt-2 pb-6 z-40 transition-colors duration-700 ${isLight ? 'bg-white/90 border-slate-100' : 'bg-black/80 border-white/5'}`}>
      <button 
        onClick={() => setActiveTab(Tab.FIRE)}
        className={`p-3 transition-all duration-300 ${
          activeTab === Tab.FIRE 
            ? activeAccent + ' scale-110' 
            : 'text-slate-300 hover:text-slate-400 dark:text-white/30 dark:hover:text-white/50'
        }`}
      >
        <Flame size={24} fill={activeTab === Tab.FIRE ? 'currentColor' : 'none'} />
      </button>

      <button 
        onClick={() => setActiveTab(Tab.ARCADE)}
        className={`p-3 transition-all duration-300 ${
          activeTab === Tab.ARCADE 
            ? activeAccent + ' scale-110' 
            : 'text-slate-300 hover:text-slate-400 dark:text-white/30 dark:hover:text-white/50'
        }`}
      >
        <Gamepad2 size={24} fill={activeTab === Tab.ARCADE ? 'currentColor' : 'none'} />
      </button>
      
      <button 
        onClick={() => setActiveTab(Tab.CHAT)}
        className={`p-3 transition-all relative ${
          activeTab === Tab.CHAT 
            ? (isLight ? 'text-slate-900' : 'text-white') + ' scale-110' 
            : 'text-slate-300 dark:text-white/30'
        }`}
      >
        <MessageCircle size={24} fill={activeTab === Tab.CHAT ? 'currentColor' : 'none'} />
        {activeTab !== Tab.CHAT && (
          <div className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-black animate-pulse"></div>
        )}
      </button>

      <button 
        onClick={() => setActiveTab(Tab.PEOPLE)}
        className={`p-3 transition-all ${
          activeTab === Tab.PEOPLE 
            ? (isLight ? 'text-slate-900' : 'text-white') + ' scale-110' 
            : 'text-slate-300 dark:text-white/30'
        }`}
      >
        <Users size={24} fill={activeTab === Tab.PEOPLE ? 'currentColor' : 'none'} />
      </button>

      <button 
        onClick={() => setActiveTab(Tab.SETTINGS)}
        className={`p-3 transition-all ${
          activeTab === Tab.SETTINGS 
            ? (isLight ? 'text-slate-900' : 'text-white') + ' scale-110' 
            : 'text-slate-300 dark:text-white/30'
        }`}
      >
        <Settings size={24} fill={activeTab === Tab.SETTINGS ? 'currentColor' : 'none'} />
      </button>
    </nav>
  );
};

export default BottomNav;
