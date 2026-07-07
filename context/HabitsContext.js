import { createContext, useContext, useEffect, useReducer, useRef, useState } from 'react';
import { Storage } from 'expo-sqlite/kv-store';

const HabitsContext = createContext(null);
const STORAGE_KEY = 'habits';

// Uses local date parts instead of toISOString() (which is UTC) so the
// "day" boundary matches the user's actual midnight, not GMT's.
function getTodayKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function habitsReducer(state, action) {
  switch (action.type) {
    case 'HYDRATE':
      return action.payload;
    case 'ADD_HABIT': {
      const newHabit = {
        id: Date.now().toString(),
        streak: 0,
        lastCompletedDate: null,
        lastCompletionType: null,
        ...action.payload,
      };
      return [...state, newHabit];
    }
    case 'COMPLETE_HABIT': {
      const todayKey = getTodayKey();
      return state.map((habit) => {
        if (habit.id !== action.payload.id) return habit;
        if (habit.lastCompletedDate === todayKey) return habit; // already done today, no double-count
        return {
          ...habit,
          streak: habit.streak + 1,
          lastCompletedDate: todayKey,
          lastCompletionType: action.payload.completionType,
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
    <HabitsContext.Provider value={{ habits, addHabit, completeHabit, getTodayKey, isLoading }}>
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
