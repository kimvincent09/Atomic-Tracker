
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Flame, CheckCircle2, TrendingUp, Calendar, BrainCircuit, 
  X, Trash2, ChevronRight, MessageSquare, Loader2, LogOut, Mail, Lock, UserPlus, LogIn 
} from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { Habit, Completion, HabitStats, ChatMessage } from './types';
import { formatDate, getHabitStats, generateLastYearDates } from './utils';
import { getHabitAdvice } from './services/geminiService';
import { dbService, auth } from './services/db';

// --- Sub-components ---

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode; title: string }> = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden scale-in transition-all duration-300">
        <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded-lg transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

const AuthScreen: React.FC<{ onAuthSuccess: (user: User) => void }> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let userCredential;
      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      }
      onAuthSuccess(userCredential.user);
    } catch (err: any) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 auth-gradient">
      <div className="w-full max-w-md space-y-8 bg-zinc-900/50 border border-zinc-800 p-8 rounded-3xl backdrop-blur-xl shadow-2xl">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-indigo-600/20 mb-4">
            <CheckCircle2 className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-black tracking-tight">Atomic Tracker</h1>
          <p className="text-zinc-400 font-medium">Build your identity, one habit at a time.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input 
                type="email" 
                required
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-white"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input 
                type="password" 
                required
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-white"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-medium">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? <LogIn size={20} /> : <UserPlus size={20} />)}
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="pt-4 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-zinc-400 hover:text-white text-sm font-medium transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCoachOpen, setIsCoachOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitColor, setNewHabitColor] = useState('#3b82f6');
  const [chatInput, setChatInput] = useState('');

  // Handle Authentication State
  useEffect(() => {
    const unsubscribe = dbService.onAuthChange((authUser) => {
      setUser(authUser);
      if (!authUser) {
        setHabits([]);
        setCompletions([]);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  // Fetch data when user exists
  useEffect(() => {
    if (user) {
      async function loadData() {
        setLoading(true);
        try {
          const [fetchedHabits, fetchedCompletions] = await Promise.all([
            dbService.getHabits(user!.uid),
            dbService.getCompletions(user!.uid)
          ]);
          setHabits(fetchedHabits);
          setCompletions(fetchedCompletions);
        } finally {
          setLoading(false);
        }
      }
      loadData();
    }
  }, [user]);

  const handleLogout = () => signOut(auth);

  const addHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim() || !user) return;
    
    const tempId = crypto.randomUUID();
    const habitData: Omit<Habit, 'id'> = {
      name: newHabitName,
      description: '',
      frequency: 'daily',
      color: newHabitColor,
      createdAt: new Date().toISOString()
    };

    setHabits([...habits, { id: tempId, ...habitData }]);
    setNewHabitName('');
    setIsAddModalOpen(false);

    try {
      const realId = await dbService.addHabit(user.uid, habitData);
      setHabits(prev => prev.map(h => h.id === tempId ? { ...h, id: realId } : h));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteHabit = async (id: string) => {
    setHabits(habits.filter(h => h.id !== id));
    setCompletions(completions.filter(c => c.habitId !== id));
    try {
      await dbService.deleteHabit(id);
    } catch (err) { console.error(err); }
  };

  const toggleCompletion = async (habitId: string) => {
    if (!user) return;
    const today = formatDate(new Date());
    const existingIndex = completions.findIndex(c => c.habitId === habitId && c.date === today);

    if (existingIndex > -1) {
      setCompletions(completions.filter((_, i) => i !== existingIndex));
      try {
        await dbService.removeCompletion(habitId, today);
      } catch (err) { console.error(err); }
    } else {
      const tempId = crypto.randomUUID();
      const completionData = { habitId, date: today };
      setCompletions([...completions, { id: tempId, ...completionData }]);
      try {
        const realId = await dbService.addCompletion(user.uid, completionData);
        setCompletions(prev => prev.map(c => c.id === tempId ? { ...c, id: realId } : c));
      } catch (err) { console.error(err); }
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const userMsg: ChatMessage = { role: 'user', text: chatInput };
    setChatHistory(prev => [...prev, userMsg]);
    setChatInput('');
    setIsThinking(true);
    const advice = await getHabitAdvice(habits, completions, chatInput);
    setChatHistory(prev => [...prev, { role: 'model', text: advice }]);
    setIsThinking(false);
  };

  const stats = useMemo(() => {
    const today = formatDate(new Date());
    const totalHabits = habits.length;
    const completedToday = habits.filter(h => completions.some(c => c.habitId === h.id && c.date === today)).length;
    const habitStatsMap = habits.map(h => getHabitStats(h, completions));
    const bestStreak = habitStatsMap.length > 0 ? Math.max(...habitStatsMap.map(s => s.longestStreak)) : 0;
    const currentBestStreak = habitStatsMap.length > 0 ? Math.max(...habitStatsMap.map(s => s.currentStreak)) : 0;
    return { totalHabits, completedToday, bestStreak, currentBestStreak };
  }, [habits, completions]);

  const heatmapDates = useMemo(() => generateLastYearDates(), []);

  if (!user && !loading) {
    return <AuthScreen onAuthSuccess={setUser} />;
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8 flex flex-col items-center">
      <header className="w-full max-w-5xl px-6 py-8 flex items-center justify-between sticky top-0 bg-[#09090b]/80 backdrop-blur-md z-40 border-b border-zinc-800/50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <CheckCircle2 className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Atomic Tracker</h1>
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{user?.email?.split('@')[0]}</p>
              {loading && <Loader2 className="animate-spin text-indigo-400" size={10} />}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsCoachOpen(true)}
            className="p-2 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl transition-all flex items-center gap-2 group border border-zinc-700/50"
          >
            <BrainCircuit size={20} className="text-indigo-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline text-sm font-medium">AI Coach</span>
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
          >
            <Plus size={20} className="text-white" />
            <span className="hidden sm:inline text-sm font-medium text-white">Add Habit</span>
          </button>
          <button 
            onClick={handleLogout}
            className="p-2 bg-zinc-800/50 hover:bg-red-500/20 hover:text-red-400 rounded-xl transition-all border border-zinc-700/50"
            title="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="w-full max-w-5xl px-6 space-y-8 mt-8">
        {loading && habits.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-4 text-zinc-500">
             <Loader2 className="animate-spin text-indigo-500" size={40} />
             <p className="animate-pulse">Loading your journey...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={<TrendingUp className="text-green-400" />} label="Today" value={`${stats.completedToday}/${stats.totalHabits}`} subValue={`${stats.totalHabits > 0 ? Math.round((stats.completedToday/stats.totalHabits)*100) : 0}%`} />
              <StatCard icon={<Flame className="text-orange-400" />} label="Best Streak" value={stats.bestStreak} subValue="Days" />
              <StatCard icon={<Calendar className="text-blue-400" />} label="Active" value={stats.totalHabits} subValue="Habits" />
              <StatCard icon={<CheckCircle2 className="text-purple-400" />} label="Current" value={stats.currentBestStreak} subValue="Streak" />
            </div>

            <section className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">Daily Rituals</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {habits.length === 0 ? (
                  <div className="col-span-full py-12 flex flex-col items-center text-zinc-500 border-2 border-dashed border-zinc-800 rounded-3xl">
                    <Plus className="mb-2" size={32} />
                    <p>No habits yet. Start with something small.</p>
                    <button onClick={() => setIsAddModalOpen(true)} className="mt-4 text-indigo-400 font-medium hover:underline text-sm">Create habit</button>
                  </div>
                ) : (
                  habits.map(habit => (
                    <HabitCard 
                      key={habit.id} 
                      habit={habit} 
                      stats={getHabitStats(habit, completions)}
                      onToggle={() => toggleCompletion(habit.id)}
                      onDelete={() => deleteHabit(habit.id)}
                    />
                  ))
                )}
              </div>
            </section>

            <section className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 overflow-x-auto">
              <h2 className="text-lg font-bold mb-6 flex items-center gap-2">Consistency Heatmap</h2>
              <div className="flex gap-[2px] min-w-[800px]">
                <div className="grid grid-flow-col grid-rows-7 gap-[2px]">
                  {heatmapDates.map(date => {
                    const count = completions.filter(c => c.date === date).length;
                    const opacity = count === 0 ? 'bg-zinc-800/40' : 
                                  count === 1 ? 'bg-indigo-900/60' :
                                  count === 2 ? 'bg-indigo-700/80' : 
                                  'bg-indigo-500';
                    return (
                      <div key={date} title={`${date}`} className={`w-[10px] h-[10px] rounded-[1px] ${opacity}`} />
                    );
                  })}
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="New Habit">
        <form onSubmit={addHabit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Name</label>
            <input 
              type="text" 
              autoFocus
              className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl px-4 py-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-white"
              placeholder="e.g., Read for 30 mins"
              value={newHabitName}
              onChange={e => setNewHabitName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Color Theme</label>
            <div className="flex gap-2 justify-between">
              {['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'].map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewHabitColor(c)}
                  className={`w-10 h-10 rounded-full transition-all ${newHabitColor === c ? 'ring-4 ring-white/20 scale-110 shadow-lg' : 'scale-90 opacity-50'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-[0.98]">
            Create Habit
          </button>
        </form>
      </Modal>

      {isCoachOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-zinc-900 w-full max-w-md border-l border-zinc-800 h-full flex flex-col shadow-2xl slide-in-from-right animate-in duration-300">
            <div className="px-6 py-6 border-b border-zinc-800 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600/20 rounded-xl flex items-center justify-center">
                  <BrainCircuit className="text-indigo-400" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Habit Coach</h2>
                  <p className="text-xs text-indigo-400/80 font-medium uppercase tracking-widest font-black">AI Advisor</p>
                </div>
              </div>
              <button onClick={() => setIsCoachOpen(false)} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"><X size={20} /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {chatHistory.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                  <MessageSquare size={48} />
                  <p className="text-sm px-12">Ask for advice on consistency, overcoming friction, or habit stacking.</p>
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-zinc-800 text-zinc-100 rounded-bl-none'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              {isThinking && (
                <div className="flex justify-start">
                  <div className="bg-zinc-800 px-4 py-3 rounded-2xl rounded-bl-none flex gap-1">
                    <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" />
                    <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce delay-100" />
                    <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-zinc-800">
              <div className="relative flex items-center">
                <input 
                  type="text"
                  placeholder="Ask for advice..."
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl pl-4 pr-12 py-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-white"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                />
                <button 
                  onClick={handleSendMessage}
                  disabled={isThinking || !chatInput.trim()}
                  className="absolute right-2 p-2 bg-indigo-600 rounded-xl hover:bg-indigo-500 disabled:opacity-50 transition-all text-white"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; subValue: string }> = ({ icon, label, value, subValue }) => (
  <div className="bg-zinc-900/50 border border-zinc-800/80 p-5 rounded-3xl space-y-3 shadow-sm hover:shadow-md transition-all hover:bg-zinc-900/80 group">
    <div className="flex items-center justify-between">
      <div className="p-2 bg-zinc-800/50 rounded-lg group-hover:scale-110 transition-transform">{icon}</div>
    </div>
    <div>
      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{label}</p>
      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-2xl font-black text-white">{value}</span>
        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">{subValue}</span>
      </div>
    </div>
  </div>
);

const HabitCard: React.FC<{ habit: Habit; stats: HabitStats; onToggle: () => void; onDelete: () => void }> = ({ habit, stats, onToggle, onDelete }) => {
  const [showDelete, setShowDelete] = useState(false);
  return (
    <div className={`relative group bg-zinc-900/60 border ${stats.isCompletedToday ? 'border-indigo-500/20' : 'border-zinc-800/40'} rounded-3xl p-5 transition-all hover:shadow-xl`}>
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-1">
          <h3 className={`text-lg font-bold transition-all ${stats.isCompletedToday ? 'text-zinc-500 line-through' : 'text-white'}`}>{habit.name}</h3>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-orange-400">
              <Flame size={14} fill="currentColor" className={stats.currentStreak > 0 ? 'animate-pulse' : 'opacity-40'} />
              <span className="text-xs font-bold">{stats.currentStreak} day streak</span>
            </div>
          </div>
        </div>
        <button 
          onClick={onToggle}
          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg active:scale-90 ${
            stats.isCompletedToday ? 'bg-zinc-800 text-zinc-500' : 'bg-white text-zinc-950 hover:bg-zinc-200 shadow-white/10'
          }`}
          style={!stats.isCompletedToday ? { backgroundColor: habit.color, color: 'white' } : {}}
        >
          {stats.isCompletedToday ? <CheckCircle2 size={24} /> : <Plus size={24} />}
        </button>
      </div>
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-800/50">
        <div className="flex gap-1">
          {[...Array(7)].map((_, i) => (
             <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < (stats.currentStreak % 7) ? 'bg-indigo-500' : 'bg-zinc-800'}`} />
          ))}
        </div>
        <button onClick={() => setShowDelete(true)} className="text-zinc-600 hover:text-red-400 transition-colors p-1"><Trash2 size={16} /></button>
      </div>
      {showDelete && (
        <div className="absolute inset-0 bg-zinc-950/95 z-10 rounded-3xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-200">
          <p className="text-sm font-bold mb-4">Remove this habit?</p>
          <div className="flex gap-2 w-full">
            <button onClick={() => setShowDelete(false)} className="flex-1 bg-zinc-800 py-3 rounded-2xl text-xs font-bold">Cancel</button>
            <button onClick={onDelete} className="flex-1 bg-red-500/10 text-red-400 border border-red-500/20 py-3 rounded-2xl text-xs font-bold">Delete</button>
          </div>
        </div>
      )}
    </div>
  );
};
