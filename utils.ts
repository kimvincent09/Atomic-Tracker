
import { 
  format, 
  subDays, 
  parseISO, 
  differenceInDays, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear, 
  isWithinInterval, 
  parse 
} from 'date-fns';
import { Habit, Completion, HabitStats } from './types';

export const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');

export const getHabitStats = (habit: Habit, completions: Completion[]): HabitStats => {
  const habitCompletions = completions
    .filter(c => c.habitId === habit.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const now = new Date();
  const todayStr = formatDate(now);
  const isCompletedToday = habitCompletions.some(c => c.date === todayStr);

  // Interval Logic
  let start: Date;
  let end: Date;

  switch (habit.period) {
    case 'weekly':
      start = startOfWeek(now, { weekStartsOn: 1 });
      end = endOfWeek(now, { weekStartsOn: 1 });
      break;
    case 'monthly':
      start = startOfMonth(now);
      end = endOfMonth(now);
      break;
    case 'yearly':
      start = startOfYear(now);
      end = endOfYear(now);
      break;
    case 'daily':
    default:
      start = now;
      end = now;
      break;
  }

  const periodCompletionsList = habitCompletions.filter(c => {
    const compDate = parseISO(c.date);
    if (habit.period === 'daily') return c.date === todayStr;
    return isWithinInterval(compDate, { start, end });
  });
  
  const periodCompletions = periodCompletionsList.length;
  const isGoalMetInPeriod = periodCompletions >= (habit.targetFrequency || 1);

  // Streak Calculation (Daily focus)
  let currentStreak = 0;
  let longestStreak = 0;
  const completionDates = new Set(habitCompletions.map(c => c.date));

  if (habit.period === 'daily') {
    let checkDate = isCompletedToday ? now : subDays(now, 1);
    let streakBroken = false;
    let i = 0;
    while (!streakBroken) {
      const dStr = formatDate(checkDate);
      if (completionDates.has(dStr)) {
        currentStreak++;
        checkDate = subDays(checkDate, 1);
      } else {
        streakBroken = true;
      }
      if (i++ > 1000) break;
    }
  }

  // Longest Streak (Continuous days ever)
  const sortedDates = Array.from(completionDates).sort();
  if (sortedDates.length > 0) {
    let tempStreak = 1;
    longestStreak = 1;
    for (let j = 1; j < sortedDates.length; j++) {
      const d1 = parseISO(sortedDates[j - 1]);
      const d2 = parseISO(sortedDates[j]);
      if (differenceInDays(d2, d1) === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    }
  }

  return {
    currentStreak,
    longestStreak,
    totalCompletions: completionDates.size,
    isCompletedToday,
    periodCompletions,
    isGoalMetInPeriod
  };
};

export const groupCompletionsByMonth = (completions: Completion[], habits: Habit[]) => {
  const groups: Record<string, Record<string, number>> = {};
  
  completions.forEach(c => {
    const month = format(parseISO(c.date), 'MMMM yyyy');
    if (!groups[month]) groups[month] = {};
    if (!groups[month][c.habitId]) groups[month][c.habitId] = 0;
    groups[month][c.habitId]++;
  });

  return Object.entries(groups).sort((a, b) => {
    const da = parse(a[0], 'MMMM yyyy', new Date());
    const db = parse(b[0], 'MMMM yyyy', new Date());
    return db.getTime() - da.getTime();
  });
};
