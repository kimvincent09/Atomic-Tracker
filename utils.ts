
import { format, subDays, isSameDay, parseISO, differenceInDays } from 'date-fns';
import { Habit, Completion, HabitStats } from './types';

export const formatDate = (date: Date) => format(date, 'yyyy-MM-dd');

export const getHabitStats = (habit: Habit, completions: Completion[]): HabitStats => {
  const habitCompletions = completions
    .filter(c => c.habitId === habit.id)
    .sort((a, b) => b.date.localeCompare(a.date));

  const todayStr = formatDate(new Date());
  const isCompletedToday = habitCompletions.some(c => c.date === todayStr);

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // For current streak
  let checkDate = isCompletedToday ? new Date() : subDays(new Date(), 1);
  let streakBroken = false;

  const completionDates = new Set(habitCompletions.map(c => c.date));

  // Current Streak Calculation
  let i = 0;
  while (!streakBroken) {
    const dStr = formatDate(checkDate);
    if (completionDates.has(dStr)) {
      currentStreak++;
      checkDate = subDays(checkDate, 1);
    } else {
      streakBroken = true;
    }
    // Safety break
    if (i++ > 1000) break;
  }

  // Longest Streak Calculation
  const sortedDates = Array.from(completionDates).sort();
  if (sortedDates.length > 0) {
    tempStreak = 1;
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
    isCompletedToday
  };
};

export const generateLastYearDates = () => {
  const dates = [];
  const today = new Date();
  for (let i = 364; i >= 0; i--) {
    dates.push(formatDate(subDays(today, i)));
  }
  return dates;
};
