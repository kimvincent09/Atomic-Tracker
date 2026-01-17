
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Flame, CheckCircle2, TrendingUp, BrainCircuit, 
  X, Trash2, ChevronRight, Loader2, LogOut, Mail, Lock, AlertTriangle,
  UserPlus, LogIn, Trophy, History, LayoutDashboard, Target, Edit2,
  Tag, Clock, Gift, Sparkles, CloudOff, CloudSync
} from 'lucide-react';
// Fix: Added 'type' for User and ensured modular auth functions are imported correctly
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import confetti from 'canvas-confetti';
import { Habit, Completion, HabitStats, ChatMessage, HabitPeriod } from './types';
import { formatDate, getHabitStats, groupCompletionsByMonth } from './utils';
import { getHabitAdvice } from './services/geminiService';
import { dbService, auth, isFirebaseConfigured } from './services/db';

const DEFAULT_CATEGORIES = ['Physical', 'Mental', 'Social', 'Professional', 'Finance', 'Spirituality'];

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode; title: string }> = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden scale-in transition-all duration-300">
        <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded-lg transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
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
    
    if (!isFirebaseConfigured()) {
      setError("CONFIGURATION ERROR: You must add your Firebase API keys to 'services/db.ts' before you can sign in.");
      return;
    }

    setLoading(true);
    try {
      let userCredential;
      if (isLogin) {
        userCredential = await signInWithEmailAndPassword(auth!, email, password);
        await dbService.createProfile(userCredential.user.uid, userCredential.user.email!);
      } else {
        userCredential = await createUserWithEmailAndPassword(auth!, email, password);
        await dbService.createProfile(userCredential.user.uid, userCredential.user.email!);
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
        {!isFirebaseConfigured() && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-xs font-bold flex items-start gap-3">
            <AlertTriangle className="shrink-0" size={16} />
            <div>
              <p className="font-black uppercase mb-1">Backend Disconnected</p>
              <p className="font-medium opacity-90 leading-relaxed">Please paste your Firebase keys into <code>services/db.ts</code>.</p>
            </div>
          </div>
        )}
        
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-indigo-600/20 mb-4">
            <CheckCircle2 className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-black tracking-tight">Atomic Tracker</h1>
          <p className="text-zinc-400 font-medium">Build the person you want to become.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input type="email" required className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-white" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input type="password" required className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-white" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
          </div>
          {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm font-medium">{error}</div>}
          <button type="submit" disabled={loading || !isFirebaseConfigured()} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isLogin ? <LogIn size={20} /> : <UserPlus size={20} />)}
            {isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>
        <div className="pt-4 text-center">
          <button onClick={() => setIsLogin(!isLogin)} className="text-zinc-400 hover:text-white text-sm font-medium transition-colors">
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
  
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isCoachOpen, setIsCoachOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [view, setView] = useState<'dashboard' | 'history'>('dashboard');
  const [activePeriod, setActivePeriod] = useState<HabitPeriod>('daily');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Form State
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitColor, setNewHabitColor] = useState('#3b82f6');
  const [newHabitCategory, setNewHabitCategory] = useState('Physical');
  const [newHabitPeriod, setNewHabitPeriod] = useState<HabitPeriod>('daily');
  const [targetFreq, setTargetFreq] = useState(1);
  const [reward, setReward] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);

  // Derived state for categories
  const categories = useMemo(() => {
    const habitCats = habits.map(h => h.category);
    return Array.from(new Set([...DEFAULT_CATEGORIES, ...habitCats]));
  }, [habits]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = dbService.onAuthChange((authUser) => {
      setUser(authUser);
      setIsAuthenticating(false);
    });
    return unsubscribe;
  }, []);

  // Real-time Cloud Synchronization
  useEffect(() => {
    if (user && isFirebaseConfigured()) {
      setIsSyncing(true);
      const unsubHabits = dbService.subscribeToHabits(user.uid, (cloudHabits) => {
        setHabits(cloudHabits);
        setIsSyncing(false);
      });
      const unsubCompletions = dbService.subscribeToCompletions(user.uid, (cloudCompletions) => {
        setCompletions(cloudCompletions);
      });
      return () => { unsubHabits(); unsubCompletions(); };
    }
  }, [user]);

  const handleLogout = () => { if (auth) signOut(auth); };

  const saveHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim() || !user) return;
    setErrorMessage(null);
    const prevHabits = [...habits];
    
    const habitData = {
      name: newHabitName,
      description: '',
      period: newHabitPeriod,
      category: newHabitCategory,
      color: newHabitColor,
      targetFrequency: targetFreq,
      reward: reward,
      createdAt: editingHabit?.createdAt || new Date().toISOString()
    };

    try {
      if (editingHabit) {
        setHabits(prev => prev.map(h => h.id === editingHabit.id ? { ...h, ...habitData } as Habit : h));
        setIsAddModalOpen(false);
        await dbService.updateHabit(editingHabit.id, habitData);
      } else {
        const tempId = crypto.randomUUID();
        setHabits(prev => [...prev, { id: tempId, ...habitData } as Habit]);
        setIsAddModalOpen(false);
        await dbService.addHabit(user.uid, habitData);
      }
    } catch (err: any) {
      setHabits(prevHabits);
      setErrorMessage(err.message || "Failed to sync with cloud.");
    }
  };

  const toggleCompletion = async (habitId: string) => {
    if (!user) return;
    setErrorMessage(null);
    const today = formatDate(new Date());
    const existingIndex = completions.findIndex(c => c.habitId === habitId && c.date === today);
    const oldCompletions = [...completions];

    try {
      if (existingIndex > -1) {
        setCompletions(completions.filter((_, i) => i !== existingIndex));
        await dbService.removeCompletion(habitId, today);
      } else {
        const tempId = crypto.randomUUID();
        const completionData = { habitId, date: today };
        const newCompletions = [...completions, { id: tempId, ...completionData }];
        setCompletions(newCompletions);

        const habit = habits.find(h => h.id === habitId);
        if (habit) {
          const stats = getHabitStats(habit, newCompletions);
          if (stats.isGoalMetInPeriod) {
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: [habit.color, '#ffffff'] });
          }
        }
        await dbService.addCompletion(user.uid, completionData);
      }
    } catch (err: any) { 
      setCompletions(oldCompletions);
      setErrorMessage("Cloud sync failed. Check your connection.");
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isThinking) return;
    const userMsg = chatInput;
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setChatInput('');
    setIsThinking(true);
    try {
      const advice = await getHabitAdvice(habits, completions, userMsg);
      setChatHistory(prev => [...prev, { role: 'model', text: advice }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'model', text: "Expert currently unavailable." }]);
    } finally { setIsThinking(false); }
  };

  const dashboardStats = useMemo(() => {
    const today = formatDate(new Date());
    const totalHabits = habits.length;
    const completedToday = habits.filter(h => completions.some(c => c.habitId === h.id && c.date === today)).length;
    const habitStatsMap = habits.map(h => getHabitStats(h, completions));
    const currentBestStreak = habitStatsMap.length > 0 ? Math.max(...habitStatsMap.map(s => s.currentStreak)) : 0;
    const goalsMetThisWeek = habitStatsMap.filter(s => s.isGoalMetInPeriod).length;
    return { totalHabits, completedToday, currentBestStreak, goalsMetThisWeek };
  }, [habits, completions]);

  const filteredHabits = habits.filter(h => h.period === activePeriod);
  const groupedHabits = useMemo(() => {
    const groups: Record<string, Habit[]> = {};
    filteredHabits.forEach(h => {
      if (!groups[h.category]) groups[h.category] = [];
      groups[h.category].push(h);
    });
    return Object.entries(groups).sort();
  }, [filteredHabits]);

  if (isAuthenticating) return <div className="min-h-screen flex items-center justify-center bg-[#09090b]"><Loader2 className="animate-spin text-indigo-500" size={32} /></div>;
  if (!user) return <AuthScreen onAuthSuccess={setUser} />;

  return (
    <div className="min-h-screen pb-24 md:pb-8 flex flex-col items-center">
      {errorMessage && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-lg px-6">
          <div className="bg-red-500 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center justify-between scale-in">
            <div className="flex items-center gap-3">
              <CloudOff size={20} />
              <p className="text-sm font-bold">{errorMessage}</p>
            </div>
            <button onClick={() => setErrorMessage(null)} className="p-1 hover:bg-black/10 rounded-lg"><X size={18} /></button>
          </div>
        </div>
      )}

      <header className="w-full max-w-5xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between sticky top-0 bg-[#09090b]/90 backdrop-blur-md z-40 border-b border-zinc-800/50 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <CheckCircle2 className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight leading-none">Atomic Tracker</h1>
            <div className="flex items-center gap-2 mt-1">
               <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{user?.email?.split('@')[0]}</p>
               {!isFirebaseConfigured() ? <CloudOff size={10} className="text-red-500" /> : isSyncing ? <CloudSync size={10} className="text-indigo-500 animate-pulse" /> : <div className="w-1 h-1 bg-green-500 rounded-full" />}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-zinc-900/50 p-1 rounded-2xl border border-zinc-800/50">
          <button onClick={() => setView('dashboard')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${view === 'dashboard' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <LayoutDashboard size={14} /> Dashboard
          </button>
          <button onClick={() => setView('history')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${view === 'history' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'}`}>
            <History size={14} /> Timeline
          </button>
        </div>

        <div className="flex gap-2">
          <button onClick={() => setIsCoachOpen(true)} className="p-2.5 bg-zinc-800/50 hover:bg-zinc-800 rounded-xl transition-all border border-zinc-700/50 text-indigo-400"><BrainCircuit size={18} /></button>
          <button onClick={() => { setEditingHabit(null); setNewHabitName(''); setTargetFreq(1); setReward(''); setIsAddModalOpen(true); }} className="p-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-all shadow-lg text-white"><Plus size={18} /></button>
          <button onClick={handleLogout} className="p-2.5 bg-zinc-800/50 hover:bg-red-500/20 hover:text-red-400 rounded-xl border border-zinc-700/50 transition-all"><LogOut size={18} /></button>
        </div>
      </header>

      <main className="w-full max-w-5xl px-6 space-y-8 mt-6">
        {view === 'dashboard' ? (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={<TrendingUp className="text-green-400" />} label="Today" value={dashboardStats.completedToday} subValue="Done" />
              <StatCard icon={<Trophy className="text-yellow-400" />} label="Success" value={dashboardStats.goalsMetThisWeek} subValue="Met" />
              <StatCard icon={<Flame className="text-orange-400" />} label="Streak" value={dashboardStats.currentBestStreak} subValue="Days" />
              <StatCard icon={<Target className="text-purple-400" />} label="Habits" value={dashboardStats.totalHabits} subValue="Active" />
            </div>

            {/* Period Tabs */}
            <div className="flex items-center justify-between gap-4 overflow-x-auto no-scrollbar pb-2">
              <div className="flex bg-zinc-900/50 p-1.5 rounded-2xl border border-zinc-800/50 w-full md:w-auto">
                {(['daily', 'weekly', 'monthly', 'yearly'] as HabitPeriod[]).map(p => (
                  <button 
                    key={p} 
                    onClick={() => setActivePeriod(p)} 
                    className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activePeriod === p ? 'bg-zinc-100 text-zinc-900 shadow-xl' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Categorized Habit List */}
            <div className="space-y-12">
              {groupedHabits.length === 0 ? (
                <div className="py-20 flex flex-col items-center text-zinc-600 border-2 border-dashed border-zinc-800/50 rounded-[2.5rem] animate-in fade-in zoom-in">
                  <Plus className="mb-4 opacity-20" size={48} />
                  <p className="font-bold tracking-tight text-sm uppercase">No {activePeriod} habits found.</p>
                </div>
              ) : (
                groupedHabits.map(([category, habits]) => (
                  <section key={category} className="space-y-4">
                    <div className="flex items-center gap-3 px-2">
                      <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                      <h2 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-500">{category}</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {habits.map(habit => (
                        <HabitCard 
                          key={habit.id} 
                          habit={habit} 
                          stats={getHabitStats(habit, completions)}
                          onToggle={() => toggleCompletion(habit.id)}
                          onEdit={() => {
                            setEditingHabit(habit);
                            setNewHabitName(habit.name);
                            setNewHabitCategory(habit.category);
                            setNewHabitPeriod(habit.period);
                            setTargetFreq(habit.targetFrequency);
                            setReward(habit.reward || '');
                            setNewHabitColor(habit.color);
                            setIsAddModalOpen(true);
                          }}
                          onDelete={() => {
                            setHabits(prev => prev.filter(h => h.id !== habit.id));
                            dbService.deleteHabit(habit.id);
                          }}
                        />
                      ))}
                    </div>
                  </section>
                ))
              )}
            </div>
          </>
        ) : (
          <HistoryView monthlyHistory={groupCompletionsByMonth(completions, habits)} habits={habits} />
        )}
      </main>

      {/* Add/Edit Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={editingHabit ? "Update System" : "New Strategy"}>
        <form onSubmit={saveHabit} className="space-y-6 pb-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Habit Identity</label>
            <input type="text" autoFocus required className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-indigo-500 outline-none text-white text-lg font-bold" value={newHabitName} onChange={e => setNewHabitName(e.target.value)} placeholder="e.g. Identity: Meditator" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Category</label>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                <select 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-10 pr-4 py-4 focus:outline-none text-white text-sm appearance-none" 
                  value={showCustomCategory ? 'custom' : newHabitCategory} 
                  onChange={e => {
                    if (e.target.value === 'custom') {
                      setShowCustomCategory(true);
                    } else {
                      setShowCustomCategory(false);
                      setNewHabitCategory(e.target.value);
                    }
                  }}
                >
                   {categories.map(c => <option key={c} value={c}>{c}</option>)}
                   <option value="custom">+ Create New...</option>
                </select>
                {showCustomCategory && (
                  <input 
                    type="text" 
                    className="w-full mt-2 bg-zinc-950 border border-zinc-800 rounded-2xl px-4 py-3 text-sm focus:ring-1 focus:ring-indigo-500" 
                    placeholder="New category name..." 
                    onChange={e => setNewHabitCategory(e.target.value)} 
                  />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Interval</label>
              <div className="relative">
                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                <select className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-10 pr-4 py-4 focus:outline-none text-white text-sm appearance-none" value={newHabitPeriod} onChange={e => setNewHabitPeriod(e.target.value as HabitPeriod)}>
                   <option value="daily">Daily</option>
                   <option value="weekly">Weekly</option>
                   <option value="monthly">Monthly</option>
                   <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Target Freq</label>
              <input type="number" min="1" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 focus:outline-none text-white font-bold" value={targetFreq} onChange={e => setTargetFreq(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Personal Reward</label>
              <div className="relative">
                <Gift className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={14} />
                <input type="text" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-10 pr-4 py-4 focus:outline-none text-white text-sm" value={reward} onChange={e => setReward(e.target.value)} placeholder="e.g. A warm coffee" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Visual Theme</label>
            <div className="flex gap-2.5">
              {['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#ffffff'].map(c => (
                <button key={c} type="button" onClick={() => setNewHabitColor(c)} className={`w-10 h-10 rounded-xl border-2 transition-all ${newHabitColor === c ? 'border-white scale-110 shadow-lg shadow-white/10' : 'border-transparent'}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
          <button type="submit" className="w-full bg-indigo-600 py-5 rounded-[1.25rem] text-sm font-black uppercase tracking-widest transition-all hover:bg-indigo-500 shadow-xl shadow-indigo-900/20 active:scale-95">
            {editingHabit ? 'Update Strategy' : 'Launch System'}
          </button>
        </form>
      </Modal>

      {isCoachOpen && <CoachDrawer onClose={() => setIsCoachOpen(false)} history={chatHistory} onSend={handleSendMessage} input={chatInput} setInput={setChatInput} isThinking={isThinking} />}
    </div>
  );
}

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: string | number; subValue: string }> = ({ icon, label, value, subValue }) => (
  <div className="bg-zinc-900/40 border border-zinc-800/50 p-6 rounded-[2rem] space-y-4 group hover:bg-zinc-900/80 hover:border-zinc-700/50 transition-all">
    <div className="p-2.5 bg-zinc-950 rounded-xl w-fit group-hover:scale-110 transition-transform">{icon}</div>
    <div>
      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.15em]">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-black text-white">{value}</span>
        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">{subValue}</span>
      </div>
    </div>
  </div>
);

const HabitCard: React.FC<{ habit: Habit; stats: HabitStats; onToggle: () => void; onEdit: () => void; onDelete: () => void }> = ({ habit, stats, onToggle, onEdit, onDelete }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const progress = Math.min((stats.periodCompletions / (habit.targetFrequency || 1)) * 100, 100);
  const isDoneToday = stats.isCompletedToday;

  return (
    <div className={`relative group bg-zinc-900/30 border ${isDoneToday ? 'border-indigo-500/20 shadow-inner' : 'border-zinc-800/50'} rounded-[2rem] p-6 transition-all`}>
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h3 className={`text-lg font-black leading-none ${isDoneToday ? 'text-zinc-500 line-through' : 'text-white'}`}>{habit.name}</h3>
            <button onClick={onEdit} className="opacity-0 group-hover:opacity-100 p-1 text-zinc-600 hover:text-indigo-400 transition-all"><Edit2 size={12} /></button>
          </div>
          {habit.period === 'daily' && (
            <div className="flex items-center gap-1.5 text-orange-500">
              <Flame size={12} fill="currentColor" />
              <span className="text-[10px] font-black uppercase tracking-widest">{stats.currentStreak} Day Streak</span>
            </div>
          )}
          <div className="inline-flex items-center px-2 py-0.5 rounded bg-zinc-800/50 border border-zinc-700/30 text-[9px] font-black text-zinc-500 uppercase tracking-widest">
            {habit.category}
          </div>
        </div>
        <button 
          onClick={onToggle} 
          className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90 shadow-xl shrink-0" 
          style={!isDoneToday ? { backgroundColor: habit.color, color: habit.color === '#ffffff' ? '#000000' : 'white' } : { backgroundColor: '#18181b', color: '#52525b' }}
        >
          {isDoneToday ? <CheckCircle2 size={24} /> : <Plus size={24} />}
        </button>
      </div>

      <div className="mt-8 space-y-2">
        <div className="flex justify-between items-end">
          <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.1em]">
            {stats.periodCompletions} / {habit.targetFrequency} <span className="text-[8px] opacity-60">{habit.period} target</span>
          </p>
          <span className="text-[10px] font-black text-zinc-400">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-800/30">
          <div className="h-full transition-all duration-1000 shadow-[0_0_15px_rgba(0,0,0,0.5)]" style={{ width: `${progress}%`, backgroundColor: habit.color }} />
        </div>
      </div>

      <div className="mt-6 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex gap-2">
          {habit.reward && (
            <div className="flex items-center gap-1 text-[9px] font-bold text-zinc-600">
              <Gift size={12} /> {habit.reward}
            </div>
          )}
        </div>
        <button onClick={() => setShowConfirm(true)} className="text-zinc-700 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
      </div>

      {showConfirm && (
        <div className="absolute inset-0 bg-zinc-950/95 z-20 rounded-[2rem] flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-200">
          <p className="text-xs font-black uppercase tracking-widest mb-6">Archive Habit?</p>
          <div className="flex gap-3 w-full">
            <button onClick={() => setShowConfirm(false)} className="flex-1 bg-zinc-800 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest">Keep</button>
            <button onClick={onDelete} className="flex-1 bg-red-600 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest">Archive</button>
          </div>
        </div>
      )}
    </div>
  );
};

const HistoryView = ({ monthlyHistory, habits }: { monthlyHistory: any[]; habits: Habit[] }) => (
  <section className="space-y-12">
    <div className="flex items-center gap-4">
      <h2 className="text-2xl font-black">Timeline</h2>
      <div className="flex-1 h-px bg-zinc-800" />
    </div>
    {monthlyHistory.map(([month, data]) => (
      <div key={month} className="space-y-6">
        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-indigo-500 bg-zinc-900/50 w-fit px-4 py-1.5 rounded-full border border-zinc-800/50">{month}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {habits.filter(h => data[h.id]).map(habit => (
            <div key={habit.id} className="bg-zinc-900/20 border border-zinc-800/40 p-5 rounded-3xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-2.5 h-10 rounded-full" style={{ backgroundColor: habit.color }} />
                <div>
                  <p className="font-bold text-white text-sm">{habit.name}</p>
                  <p className="text-[10px] font-bold text-zinc-600 uppercase">{habit.category}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-indigo-400 leading-none">{data[habit.id]}</p>
                <p className="text-[8px] text-zinc-600 font-black uppercase mt-1">Actions</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </section>
);

const CoachDrawer = ({ onClose, history, onSend, input, setInput, isThinking }: any) => (
  <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm animate-in fade-in">
    <div className="bg-[#09090b] w-full max-w-md border-l border-zinc-800 h-full flex flex-col shadow-2xl scale-in">
      <div className="px-6 py-8 border-b border-zinc-800 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <BrainCircuit className="text-indigo-400" size={24} />
          <h2 className="text-xl font-black tracking-tight">Identity Coach</h2>
        </div>
        <button onClick={onClose} className="p-2 bg-zinc-900 rounded-xl hover:bg-zinc-800 transition-all"><X /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {history.length === 0 && (
          <div className="text-center py-12 space-y-4">
            <Sparkles className="mx-auto text-indigo-500/40" size={40} />
            <p className="text-zinc-500 text-sm font-medium px-8">"Every action you take is a vote for the type of person you wish to become."</p>
          </div>
        )}
        {history.map((msg: any, i: number) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-5 py-3 rounded-[1.25rem] text-sm leading-relaxed ${msg.role === 'user' ? 'bg-indigo-600 text-white font-bold' : 'bg-zinc-900 border border-zinc-800 text-zinc-100'}`}>{msg.text}</div>
          </div>
        ))}
        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-zinc-900 border border-zinc-800 px-5 py-3 rounded-[1.25rem] flex gap-1.5 items-center">
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" />
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
              <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>
      <div className="p-6 border-t border-zinc-800 bg-[#09090b]">
        <div className="relative flex items-center gap-2">
          <input type="text" className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 focus:ring-1 focus:ring-indigo-500 outline-none text-sm" placeholder="Ask identity advice..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && onSend()} />
          <button onClick={onSend} className="p-3 bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-colors shadow-lg"><ChevronRight /></button>
        </div>
      </div>
    </div>
  </div>
);
