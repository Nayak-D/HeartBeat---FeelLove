import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Palette, 
  RefreshCcw, 
  Shield, 
  Bell, 
  ChevronRight, 
  Sparkles,
  Sun,
  Moon,
  Camera,
  Edit2,
  Check,
  Heart,
  Save,
  PawPrint,
  Lock,
  Zap,
  ShieldCheck,
  Image as ImageIcon,
  User
} from 'lucide-react';

interface SettingsScreenProps {
  onBack: () => void;
  onOpenAi: () => void;
  onSignOut: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  profile: { name: string; avatar: string; isCustom: boolean };
  onUpdateProfile: (name: string, avatar: string, isCustom?: boolean) => void;
}

const PRESET_AVATARS = [
  { id: 'bunny', url: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=200&h=200&fit=crop', label: 'Bunny' },
  { id: 'dog', url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=200&h=200&fit=crop', label: 'Dog' },
  { id: 'fox', url: 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=200&h=200&fit=crop', label: 'Fox' },
  { id: 'koala', url: 'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=200&h=200&fit=crop', label: 'Koala' },
];

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onOpenAi, onSignOut, theme, onToggleTheme, profile, onUpdateProfile }) => {
  const [tempName, setTempName] = useState(profile.name);
  const [tempPic, setTempPic] = useState(profile.avatar);
  const [isCustomLocally, setIsCustomLocally] = useState(profile.isCustom);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notifsEnabled, setNotifsEnabled] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTempName(profile.name);
    setTempPic(profile.avatar);
    setIsCustomLocally(profile.isCustom);
  }, [profile]);

  const hasChanges = tempName !== profile.name || tempPic !== profile.avatar;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempPic(reader.result as string);
        setIsCustomLocally(true);
        if (navigator.vibrate) navigator.vibrate(20);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSelectPreset = (url: string) => {
    setTempPic(url);
    setIsCustomLocally(false);
    if (navigator.vibrate) navigator.vibrate(10);
  };

  const savePermanently = () => {
    setIsSaving(true);
    setTimeout(() => {
      onUpdateProfile(tempName, tempPic, isCustomLocally);
      setIsSaving(false);
      if (navigator.vibrate) navigator.vibrate([40, 120]);
    }, 800);
  };

  const isLight = theme === 'light';

  return (
    <div className="flex flex-col space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div className="flex justify-between items-center px-1">
        <h2 className={`text-3xl font-black italic uppercase tracking-tighter ${isLight ? 'text-slate-800' : 'text-white'}`}>Settings</h2>
        <div className={`p-2 rounded-2xl border transition-all ${isLight ? 'bg-pink-50 border-pink-100 shadow-sm' : 'bg-white/5 border-white/5'}`}>
          <Sparkles size={20} className={isLight ? 'text-pink-500' : 'text-indigo-400'} />
        </div>
      </div>

      {/* Profile Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
            <h4 className={`text-[10px] font-black uppercase tracking-[4px] opacity-30 ${isLight ? 'text-pink-900' : 'text-white'}`}>Identity</h4>
            {!isCustomLocally && (
                <div className="bg-green-500/10 px-2 py-0.5 rounded-full flex items-center space-x-1">
                    <ShieldCheck size={10} className="text-green-500" />
                    <span className="text-[7px] font-black uppercase text-green-500 tracking-widest">Inbuilt Mascot</span>
                </div>
            )}
        </div>

        <section className={`rounded-[3rem] p-6 border flex flex-col space-y-6 shadow-2xl transition-all duration-500 ${isLight ? 'bg-white border-pink-50 shadow-pink-100' : 'bg-white/5 border-white/5 shadow-black/40'}`}>
          <div className="flex items-center space-x-6">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className={`w-24 h-24 rounded-[2.5rem] overflow-hidden border-4 transition-all ${isLight ? 'border-pink-200' : 'border-white/10'}`}>
                <img src={tempPic} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Profile" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera size={24} className="text-white" />
                </div>
              </div>
              <div className={`absolute -bottom-1 -right-1 w-8 h-8 rounded-full border-4 flex items-center justify-center shadow-lg ${isLight ? 'bg-pink-500 border-white text-white' : 'bg-indigo-500 border-black text-white'}`}>
                 <Edit2 size={12} />
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
            </div>

            <div className="flex-1 space-y-1">
              {isEditingName ? (
                <div className="flex items-center space-x-2">
                  <input 
                    autoFocus
                    type="text" 
                    value={tempName} 
                    onChange={(e) => setTempName(e.target.value)}
                    className={`bg-transparent text-xl font-black italic tracking-tight outline-none border-b-2 w-full py-1 ${isLight ? 'border-pink-500 text-slate-800' : 'border-indigo-500 text-white'}`}
                    onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                  />
                  <button onClick={() => setIsEditingName(false)} className="p-2 bg-pink-500 text-white rounded-lg"><Check size={16} /></button>
                </div>
              ) : (
                <div className="flex items-center justify-between group cursor-pointer" onClick={() => setIsEditingName(true)}>
                  <h3 className={`text-xl font-black italic tracking-tight ${isLight ? 'text-slate-800' : 'text-white'}`}>{tempName}</h3>
                  <Edit2 size={14} className="opacity-30 group-hover:opacity-100 transition-opacity" />
                </div>
              )}
              <p className={`text-[10px] font-black uppercase tracking-[3px] opacity-30 flex items-center space-x-2 ${isLight ? 'text-pink-600' : 'text-white'}`}>
                <span>{isCustomLocally ? 'Verified Custom' : 'Inbuilt Mascot'}</span>
                {isCustomLocally ? <ImageIcon size={10} className="fill-current" /> : <PawPrint size={10} className="fill-current" />}
              </p>
            </div>
          </div>

          {/* Preset Gallery */}
          <div className="space-y-3 pt-4 border-t border-inherit">
             <p className={`text-[8px] font-black uppercase tracking-widest opacity-40 ${isLight ? 'text-slate-600' : 'text-white'}`}>Animal Mascots</p>
             <div className="flex space-x-3 overflow-x-auto pb-2 no-scrollbar px-1">
                {PRESET_AVATARS.map((preset) => (
                    <button 
                        key={preset.id}
                        onClick={() => handleSelectPreset(preset.url)}
                        className={`w-14 h-14 rounded-2xl overflow-hidden shrink-0 border-2 transition-all active:scale-90 ${tempPic === preset.url ? 'border-pink-500 scale-110 shadow-lg' : 'border-transparent opacity-60'}`}
                    >
                        <img src={preset.url} className="w-full h-full object-cover" alt={preset.label} />
                    </button>
                ))}
             </div>
          </div>
        </section>

        {hasChanges && (
          <button 
            onClick={savePermanently}
            disabled={isSaving}
            className={`w-full py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center space-x-3 transition-all active:scale-95 shadow-2xl ${
              isLight ? 'bg-indigo-600 text-white shadow-indigo-100' : 'bg-white text-black'
            }`}
          >
            {isSaving ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <><Save size={16} /><span>Confirm Changes</span></>}
          </button>
        )}
      </div>

      {/* Main Options */}
      <div className="space-y-4">
        <h4 className={`px-1 text-[10px] font-black uppercase tracking-[4px] opacity-30 ${isLight ? 'text-pink-900' : 'text-white'}`}>Preferences</h4>
        
        <div className={`rounded-[3rem] border overflow-hidden shadow-xl transition-all ${isLight ? 'bg-white border-pink-50 shadow-pink-50' : 'bg-white/5 border-white/5 shadow-black/40'}`}>
          {/* Theme Toggle */}
          <button 
            onClick={onToggleTheme}
            className={`w-full p-5 flex items-center justify-between border-b transition-colors active:bg-pink-500/5 ${isLight ? 'border-pink-50' : 'border-white/5'}`}
          >
            <div className="flex items-center space-x-4">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors ${isLight ? 'bg-pink-50' : 'bg-white/5'}`}>
                {isLight ? <Moon size={20} className="text-pink-600" /> : <Sun size={20} className="text-amber-400" />}
              </div>
              <div className="text-left">
                <h5 className={`font-black text-xs uppercase tracking-widest ${isLight ? 'text-slate-700' : 'text-white'}`}>Appearance</h5>
                <p className="text-[9px] font-black uppercase tracking-widest text-pink-500">{isLight ? 'Soft Pink' : 'Cyber Night'}</p>
              </div>
            </div>
            <ChevronRight size={18} className="opacity-20" />
          </button>

          {/* Notifications */}
          <button 
            onClick={() => { setNotifsEnabled(!notifsEnabled); if (navigator.vibrate) navigator.vibrate(10); }}
            className={`w-full p-5 flex items-center justify-between border-b transition-colors active:bg-pink-500/5 ${isLight ? 'border-pink-50' : 'border-white/5'}`}
          >
            <div className="flex items-center space-x-4">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors ${isLight ? 'bg-indigo-50' : 'bg-indigo-500/10'}`}>
                <Bell size={20} className="text-indigo-400" />
              </div>
              <div className="text-left">
                <h5 className={`font-black text-xs uppercase tracking-widest ${isLight ? 'text-slate-700' : 'text-white'}`}>Notifications</h5>
                <p className={`text-[9px] font-black uppercase tracking-widest ${notifsEnabled ? 'text-green-500' : 'text-red-400'}`}>
                  {notifsEnabled ? 'Real-time Alerts On' : 'Alerts Paused'}
                </p>
              </div>
            </div>
            <div className={`w-10 h-6 rounded-full p-1 transition-colors duration-300 ${notifsEnabled ? 'bg-green-500' : 'bg-slate-300'}`}>
              <div className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${notifsEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
            </div>
          </button>

          {/* Security */}
          <div className={`w-full p-5 flex items-center justify-between border-b transition-colors ${isLight ? 'border-pink-50' : 'border-white/5'}`}>
            <div className="flex items-center space-x-4">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors ${isLight ? 'bg-green-50' : 'bg-green-500/10'}`}>
                <ShieldCheck size={20} className="text-green-500" />
              </div>
              <div className="text-left">
                <h5 className={`font-black text-xs uppercase tracking-widest ${isLight ? 'text-slate-700' : 'text-white'}`}>Security Details</h5>
                <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Offline Only Mode</p>
              </div>
            </div>
            <div className="flex items-center space-x-1.5 bg-green-500/10 px-2 py-0.5 rounded-full">
              <Lock size={10} className="text-green-500" />
              <span className="text-[7px] font-black uppercase tracking-widest text-green-500">Local</span>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <h4 className={`px-1 text-[10px] font-black uppercase tracking-[4px] opacity-30 mt-6 ${isLight ? 'text-pink-900' : 'text-white'}`}>System</h4>
        <div className={`rounded-[3rem] border overflow-hidden shadow-xl transition-all ${isLight ? 'bg-white border-pink-50 shadow-pink-50' : 'bg-white/5 border-white/5 shadow-black/40'}`}>
          <button 
            onClick={onSignOut}
            className="w-full p-5 flex items-center justify-between transition-colors active:bg-red-500/10 group"
          >
            <div className="flex items-center space-x-4">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors ${isLight ? 'bg-red-50 group-hover:bg-red-500 group-hover:text-white' : 'bg-red-500/10 group-hover:bg-red-500 group-hover:text-white'}`}>
                <RefreshCcw size={20} className="text-red-500 group-hover:text-white transition-colors" />
              </div>
              <div className="text-left">
                <h5 className={`font-black text-xs uppercase tracking-widest ${isLight ? 'text-slate-700' : 'text-red-500'}`}>Reset App</h5>
                <p className="text-[9px] font-black uppercase tracking-widest text-white/30">Clear all local data</p>
              </div>
            </div>
            <ChevronRight size={18} className="opacity-20 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      <div className="pt-6 flex flex-col items-center text-center opacity-20">
         <Heart size={20} fill={isLight ? '#ff2d55' : 'white'} className="mb-4" />
         <p className="text-[8px] font-black uppercase tracking-[5px]">HeartBeat Social v2.7.0</p>
      </div>
    </div>
  );
};

export default SettingsScreen;