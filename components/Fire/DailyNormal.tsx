
import React, { useState, useMemo, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  X, 
  Bell, 
  ListTodo, 
  Heart, 
  ClipboardList,
  MessageSquareHeart,
  StickyNote,
  Trash2
} from 'lucide-react';

interface SharedTask {
  id: string;
  text: string;
  completed: boolean;
  timestamp: number;
}

interface DailyNormalProps {
  theme: 'light' | 'dark';
  partnerConnected: boolean;
}

const DailyNormal: React.FC<DailyNormalProps> = ({ theme, partnerConnected }) => {
  const [mood, setMood] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  
  // Persistent shared tasks
  const [sharedTasks, setSharedTasks] = useState<SharedTask[]>(() => {
    const saved = localStorage.getItem('hb_shared_tasks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [
      { id: '1', text: 'Pick up some dessert for tonight 🍦', completed: false, timestamp: Date.now() },
      { id: '2', text: 'Check heartbeat sync status', completed: true, timestamp: Date.now() - 100000 },
    ];
  });

  // Save tasks to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('hb_shared_tasks', JSON.stringify(sharedTasks));
  }, [sharedTasks]);

  const moods = [
    { icon: '😊', label: 'Happy' },
    { icon: '😎', label: 'Chill' },
    { icon: '🔥', label: 'Hyped' },
    { icon: '💤', label: 'Sleepy' },
    { icon: '🍀', label: 'Lucky' },
  ];

  const progress = useMemo(() => {
    if (sharedTasks.length === 0) return 0;
    const completed = sharedTasks.filter(t => t.completed).length;
    return (completed / sharedTasks.length) * 100;
  }, [sharedTasks]);

  const toggleTask = (id: string) => {
    setSharedTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    if (navigator.vibrate) navigator.vibrate(12);
  };

  const addTask = () => {
    if (newTaskText.trim()) {
      const newTask: SharedTask = {
        id: Math.random().toString(36).substr(2, 9),
        text: newTaskText.trim(),
        completed: false,
        timestamp: Date.now()
      };
      setSharedTasks(prev => [newTask, ...prev]);
      setNewTaskText('');
      setShowAddModal(false);
      if (navigator.vibrate) navigator.vibrate([10, 30]);
    }
  };

  const removeTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSharedTasks(prev => prev.filter(t => t.id !== id));
    if (navigator.vibrate) navigator.vibrate(5);
  };

  const selectMood = (m: string) => {
    setMood(m);
    if (navigator.vibrate) navigator.vibrate(15);
  };

  const isLight = theme === 'light';

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-center px-1">
        <h3 className="text-xl font-black italic tracking-tighter uppercase transition-colors">Daily Notes</h3>
        <button 
          onClick={() => setShowAddModal(true)}
          className={`px-4 py-2 rounded-2xl border flex items-center space-x-2 active:scale-95 transition-all shadow-sm ${
            isLight 
              ? 'bg-indigo-600 border-indigo-700 text-white' 
              : 'bg-white border-white text-black'
          }`}
        >
          <Plus size={14} strokeWidth={3} />
          <span className="text-[10px] font-black uppercase tracking-[2px]">Add Note</span>
        </button>
      </div>

      <div className={`rounded-[2.5rem] p-6 border transition-all duration-500 shadow-xl ${
        isLight ? 'bg-white border-slate-100' : 'bg-white/5 border-white/5'
      }`}>
        {/* Progress Header */}
        <div className="flex items-center space-x-6 mb-5">
          <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90 overflow-visible">
              <circle
                cx="40"
                cy="40"
                r="32"
                stroke="currentColor"
                strokeWidth="7"
                fill="transparent"
                className={`${isLight ? 'text-slate-100' : 'text-white/10'}`}
              />
              <circle
                cx="40"
                cy="40"
                r="32"
                stroke={isLight ? '#6366f1' : '#d946ef'}
                strokeWidth="7"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 32}
                strokeDashoffset={2 * Math.PI * 32 * (1 - (progress || 0) / 100)}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
                style={{ 
                    filter: `drop-shadow(0 0 5px ${isLight ? '#6366f1cc' : '#d946efcc'})`,
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-black italic leading-none">{Math.round(progress || 0)}%</span>
            </div>
          </div>

          <div className="flex-1">
            <h4 className="font-black text-sm italic tracking-tight mb-1 flex items-center">
              Shared Tasks <Heart size={12} className="ml-2 text-red-500 fill-red-500" />
            </h4>
            <p className="text-[10px] font-medium opacity-40 leading-relaxed">
              Things to do for each other to keep the heartbeat strong.
            </p>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-3 min-h-[100px] max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
          {sharedTasks.length > 0 ? (
            sharedTasks.map(task => (
              <div
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className={`group p-4 rounded-3xl border flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer ${
                  task.completed 
                    ? (isLight ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white/5 border-white/5 opacity-50') 
                    : (isLight ? 'bg-white border-slate-100 shadow-sm' : 'bg-black/20 border-white/10')
                }`}
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                    task.completed 
                      ? (isLight ? 'bg-indigo-500 border-indigo-500 text-white' : 'bg-indigo-500 border-indigo-500 text-white')
                      : (isLight ? 'bg-white border-slate-200' : 'bg-white/5 border-white/20')
                  }`}>
                    {task.completed && <CheckCircle2 size={14} />}
                  </div>
                  <span className={`text-[11px] font-bold tracking-tight transition-all ${
                    task.completed ? 'line-through opacity-50' : ''
                  }`}>
                    {task.text}
                  </span>
                </div>
                <button 
                  onClick={(e) => removeTask(task.id, e)}
                  className="p-2 text-red-500 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-6 text-center opacity-30">
              <StickyNote size={28} className="mb-2" />
              <p className="text-[10px] font-black uppercase tracking-widest">No tasks yet.</p>
              <p className="text-[9px] mt-1">Leave a note for your partner!</p>
            </div>
          )}
        </div>

        {/* Mood Selector */}
        <div className="mt-5 pt-5 border-t border-inherit">
          <div className="flex items-center justify-between mb-3">
             <span className="text-[9px] font-black uppercase tracking-[3px] opacity-20">How are you feeling?</span>
             {mood && (
               <span className="text-[8px] font-black uppercase tracking-widest text-indigo-500 px-2 py-0.5 bg-indigo-500/10 rounded-full animate-in fade-in">
                 Logged {mood}
               </span>
             )}
          </div>
          <div className="flex justify-between items-center px-1">
            {moods.map(m => (
              <button
                key={m.label}
                onClick={() => selectMood(m.label)}
                className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl transition-all active:scale-90 ${
                  mood === m.label 
                    ? (isLight ? 'bg-indigo-500 shadow-xl scale-110 text-white' : 'bg-white shadow-xl scale-110 text-black') 
                    : (isLight ? 'bg-slate-100 hover:bg-slate-200' : 'bg-black/20 hover:bg-black/30')
                }`}
              >
                {m.icon}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-8 animate-in fade-in zoom-in-95 duration-200">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
          <div className={`relative w-full max-w-sm rounded-[3rem] p-8 space-y-6 shadow-2xl border ${
            isLight ? 'bg-white border-slate-100' : 'bg-[#111] border-white/10'
          }`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg ${
                  isLight ? 'bg-indigo-600 text-white' : 'bg-white text-black'
                }`}>
                  <MessageSquareHeart size={20} />
                </div>
                <div>
                  <h4 className="text-xl font-black italic uppercase tracking-tighter">Add Note</h4>
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-[2px] opacity-40">Shared Reminder</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className={`p-2 rounded-full transition-colors ${
                isLight ? 'hover:bg-slate-100' : 'hover:bg-white/5'
              }`}>
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <textarea 
                autoFocus
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addTask(); } }}
                placeholder="Buy chocolates, don't forget the date, pick up laundry..."
                className={`w-full h-32 rounded-3xl p-5 text-sm font-medium focus:outline-none focus:ring-4 transition-all resize-none ${
                  isLight 
                    ? 'bg-slate-50 border-slate-100 focus:ring-indigo-500/10 text-slate-900' 
                    : 'bg-white/5 border-white/10 focus:ring-white/5 text-white'
                }`}
              />
              <button 
                onClick={addTask}
                disabled={!newTaskText.trim()}
                className={`w-full py-5 rounded-[1.8rem] font-black uppercase tracking-widest text-[11px] shadow-xl active:scale-95 transition-all disabled:opacity-30 ${
                  isLight ? 'bg-indigo-600 text-white' : 'bg-white text-black'
                }`}
              >
                Set Reminder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyNormal;
