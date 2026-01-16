
export type Frequency = 'daily' | 'weekly';

export interface Habit {
  id: string;
  name: string;
  description: string;
  frequency: Frequency;
  color: string;
  createdAt: string;
}

export interface Completion {
  id: string;
  habitId: string;
  date: string; // YYYY-MM-DD
}

export interface HabitStats {
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  isCompletedToday: boolean;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
