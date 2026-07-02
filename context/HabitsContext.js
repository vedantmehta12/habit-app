import { createContext, useContext, useReducer } from 'react';

const HabitsContext = createContext(null);

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

  const addHabit = (habit) => dispatch({ type: 'ADD_HABIT', payload: habit });

  const completeHabit = (id, completionType) =>
    dispatch({ type: 'COMPLETE_HABIT', payload: { id, completionType } });

  return (
    <HabitsContext.Provider value={{ habits, addHabit, completeHabit, getTodayKey }}>
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
