import { createContext, useContext, useEffect, useReducer, useRef, useState } from 'react';
import { Storage } from 'expo-sqlite/kv-store';

const HabitsContext = createContext(null);
const STORAGE_KEY = 'habits';

// Uses local date parts instead of toISOString() (which is UTC) so the
// "day" boundary matches the user's actual midnight, not GMT's.
function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTodayKey() {
  return formatDateKey(new Date());
}

// 'YYYY-MM-DD' strings sort the same lexicographically as chronologically,
// so date math below stays as string keys wherever possible.
function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function addDays(dateKey, delta) {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + delta);
  return formatDateKey(date);
}

// Walks backward from today through the log, counting consecutive full/mini
// days. Today itself only counts if already logged — if today hasn't been
// completed yet, the streak from prior days still holds until the day ends.
function getCurrentStreak(log, todayKey) {
  let streak = 0;
  let cursorKey = todayKey;

  if (log[cursorKey] === 'full' || log[cursorKey] === 'mini') {
    streak += 1;
  }
  cursorKey = addDays(cursorKey, -1);

  while (log[cursorKey] === 'full' || log[cursorKey] === 'mini') {
    streak += 1;
    cursorKey = addDays(cursorKey, -1);
  }

  return streak;
}

// Old habits (saved before the dated log existed) had streak/lastCompletedDate/
// lastCompletionType instead of a log. Converts them the first time they're loaded.
function migrateHabit(habit) {
  if (habit.log) return habit;
  const { streak, lastCompletedDate, lastCompletionType, ...rest } = habit;
  const log = lastCompletedDate ? { [lastCompletedDate]: lastCompletionType } : {};
  return { ...rest, log, createdDate: lastCompletedDate || getTodayKey() };
}

// Fills in 'skipped' for any day between the last logged day (or the habit's
// creation date, if nothing's logged yet) and yesterday. Never touches today —
// today's outcome isn't decided until the day is actually over.
function backfillSkippedDays(habit, todayKey) {
  const yesterdayKey = addDays(todayKey, -1);
  const loggedKeys = Object.keys(habit.log).sort();
  const lastLoggedKey = loggedKeys.length > 0 ? loggedKeys[loggedKeys.length - 1] : null;
  let cursorKey = lastLoggedKey ? addDays(lastLoggedKey, 1) : habit.createdDate;

  const updatedLog = { ...habit.log };
  while (cursorKey <= yesterdayKey) {
    if (!updatedLog[cursorKey]) {
      updatedLog[cursorKey] = 'skipped';
    }
    cursorKey = addDays(cursorKey, 1);
  }
  return { ...habit, log: updatedLog };
}

function habitsReducer(state, action) {
  switch (action.type) {
    case 'HYDRATE': {
      const todayKey = getTodayKey();
      return action.payload.map((habit) => backfillSkippedDays(migrateHabit(habit), todayKey));
    }
    case 'ADD_HABIT': {
      const newHabit = {
        id: Date.now().toString(),
        createdDate: getTodayKey(),
        log: {},
        ...action.payload,
      };
      return [...state, newHabit];
    }
    case 'COMPLETE_HABIT': {
      const todayKey = getTodayKey();
      return state.map((habit) => {
        if (habit.id !== action.payload.id) return habit;
        if (habit.log[todayKey] === 'full' || habit.log[todayKey] === 'mini') return habit; // already done today, no double-count
        return {
          ...habit,
          log: { ...habit.log, [todayKey]: action.payload.completionType },
        };
      });
    }
    default:
      return state;
  }
}

export function HabitsProvider({ children }) {
  const [habits, dispatch] = useReducer(habitsReducer, []);
  const [isLoading, setIsLoading] = useState(true);
  const hasHydrated = useRef(false);

  // Load whatever was saved from the last session, once, on app start.
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const stored = await Storage.getItem(STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : [];
        if (isMounted) dispatch({ type: 'HYDRATE', payload: parsed });
      } catch (error) {
        console.warn('Failed to load saved habits, starting fresh.', error);
      } finally {
        if (isMounted) {
          hasHydrated.current = true;
          setIsLoading(false);
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save on every change, but not before the initial load finishes —
  // otherwise the empty starting state would overwrite what was saved last time.
  useEffect(() => {
    if (!hasHydrated.current) return;
    Storage.setItem(STORAGE_KEY, JSON.stringify(habits)).catch((error) =>
      console.warn('Failed to save habits.', error)
    );
  }, [habits]);

  const addHabit = (habit) => dispatch({ type: 'ADD_HABIT', payload: habit });

  const completeHabit = (id, completionType) =>
    dispatch({ type: 'COMPLETE_HABIT', payload: { id, completionType } });

  return (
    <HabitsContext.Provider
      value={{ habits, addHabit, completeHabit, getTodayKey, getCurrentStreak, isLoading }}
    >
      {children}
    </HabitsContext.Provider>
  );
}

export function useHabits() {
  const context = useContext(HabitsContext);
  if (!context) {
    throw new Error('useHabits must be used within a HabitsProvider');
  }
  return context;
}
