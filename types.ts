
export type HabitPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Habit {
  id: string;
  userId?: string;
  name: string;
  description: string;
  period: HabitPeriod;
  category: string;
  color: string;
  createdAt: string;
  updatedAt?: string;
  
  // Goal Settings
  targetFrequency: number; // e.g., 3 times
  targetValue?: number;    
  unit?: string;           
  reward?: string;         
}

export interface Completion {
  id: string;
  userId?: string;
  habitId: string;
  date: string; // YYYY-MM-DD
  value?: number; 
}

export interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  isCompletedToday: boolean;
  periodCompletions: number;
  isGoalMetInPeriod: boolean;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
