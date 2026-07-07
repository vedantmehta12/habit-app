import { createContext, useContext, useEffect, useReducer, useRef, useState } from 'react';
import { Storage } from 'expo-sqlite/kv-store';
import { getDevOffset, loadDevOffset, setDevOffset } from '../dev/devTime';

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

// Single source of truth for "what day is it" — everything in this file
// (and every screen) goes through this instead of calling `new Date()`
// directly. In a dev build this is nudged forward by the debug panel's
// simulated-day offset; getDevOffset() always returns 0 outside __DEV__,
// so a production build behaves exactly like plain `new Date()`.
export function getTodayKey() {
  const date = new Date();
  if (__DEV__) {
    date.setDate(date.getDate() + getDevOffset());
  }
  return formatDateKey(date);
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
// Gap days that haven't been committed to the log yet (still pending a
// friction-capture prompt) simply aren't there, so the streak stays at its
// pre-gap value until that prompt is resolved.
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
  if (habit.log) return { skipReasons: {}, ...habit };
  const { streak, lastCompletedDate, lastCompletionType, ...rest } = habit;
  const log = lastCompletedDate ? { [lastCompletedDate]: lastCompletionType } : {};
  return { ...rest, log, createdDate: lastCompletedDate || getTodayKey(), skipReasons: {} };
}

// Finds which days *would* be backfilled as "skipped" — from the day after
// the last logged day (or the habit's creation date, if nothing's logged yet)
// through yesterday. Never includes today — today's outcome isn't decided
// until the day is actually over. Doesn't write anything; just reports the gap
// so a friction-capture prompt can be shown before it's committed to the log.
function computeGapDays(habit, todayKey) {
  const yesterdayKey = addDays(todayKey, -1);
  const loggedKeys = Object.keys(habit.log).sort();
  const lastLoggedKey = loggedKeys.length > 0 ? loggedKeys[loggedKeys.length - 1] : null;
  let cursorKey = lastLoggedKey ? addDays(lastLoggedKey, 1) : habit.createdDate;

  const gapDates = [];
  while (cursorKey <= yesterdayKey) {
    if (!habit.log[cursorKey]) {
      gapDates.push(cursorKey);
    }
    cursorKey = addDays(cursorKey, 1);
  }
  return gapDates;
}

// Shared by the initial hydration and by the dev debug panel's "advance
// simulated day" actions, so both trigger the exact same gap-detection logic.
function computeAllGaps(habitsList, todayKey) {
  return habitsList
    .map((habit) => ({ habitId: habit.id, dates: computeGapDays(habit, todayKey) }))
    .filter((gap) => gap.dates.length > 0);
}

function habitsReducer(state, action) {
  switch (action.type) {
    case 'HYDRATE':
      return action.payload;
    case 'ADD_HABIT': {
      const newHabit = {
        id: Date.now().toString(),
        createdDate: getTodayKey(),
        log: {},
        skipReasons: {},
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
    case 'RESOLVE_GAP': {
      const { habitId, resolutions } = action.payload;
      return state.map((habit) => {
        if (habit.id !== habitId) return habit;
        const updatedLog = { ...habit.log };
        const updatedSkipReasons = { ...habit.skipReasons };
        resolutions.forEach(({ date, reason, note }) => {
          updatedLog[date] = 'skipped';
          if (reason) {
            updatedSkipReasons[date] = note ? { reason, note } : { reason };
          }
        });
        return { ...habit, log: updatedLog, skipReasons: updatedSkipReasons };
      });
    }
    case 'RESOLVE_ALL_REMAINING': {
      const { gaps, reason, note } = action.payload;
      const datesByHabitId = new Map(gaps.map((gap) => [gap.habitId, gap.dates]));
      return state.map((habit) => {
        const dates = datesByHabitId.get(habit.id);
        if (!dates) return habit;
        const updatedLog = { ...habit.log };
        const updatedSkipReasons = { ...habit.skipReasons };
        dates.forEach((date) => {
          updatedLog[date] = 'skipped';
          updatedSkipReasons[date] = note ? { reason, note } : { reason };
        });
        return { ...habit, log: updatedLog, skipReasons: updatedSkipReasons };
      });
    }
    case 'DELETE_HABIT':
      return state.filter((habit) => habit.id !== action.payload.id);
    default:
      return state;
  }
}

export function HabitsProvider({ children }) {
  const [habits, dispatch] = useReducer(habitsReducer, []);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingGaps, setPendingGaps] = useState([]);
  const hasHydrated = useRef(false);

  // Load whatever was saved from the last session, once, on app start, and
  // work out which habits have missed days awaiting a friction-capture prompt.
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        await loadDevOffset(); // must resolve before getTodayKey() is used below
        const stored = await Storage.getItem(STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : [];
        const todayKey = getTodayKey();
        const migrated = parsed.map(migrateHabit);
        const gaps = computeAllGaps(migrated, todayKey);

        if (isMounted) {
          dispatch({ type: 'HYDRATE', payload: migrated });
          setPendingGaps(gaps);
        }
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

  // Removes the habit (and its whole log/skipReasons with it, since they live
  // on the same object) — the next save-effect run persists the shorter array,
  // which is what actually clears it out of storage. Also drops any pending
  // gap for this habit, so a deleted habit can't get stuck at the front of the
  // friction-capture queue forever.
  const deleteHabit = (id) => {
    dispatch({ type: 'DELETE_HABIT', payload: { id } });
    setPendingGaps((prev) => prev.filter((gap) => gap.habitId !== id));
  };

  // resolutions: [{ date, reason?, note? }] — one entry per date in that
  // habit's gap. Reason/note omitted means "dismissed, no reason given."
  const resolveGap = (habitId, resolutions) => {
    dispatch({ type: 'RESOLVE_GAP', payload: { habitId, resolutions } });
    setPendingGaps((prev) => prev.filter((gap) => gap.habitId !== habitId));
  };

  // Applies one reason to every date of every habit still waiting in the
  // queue (including any not-yet-answered days of the habit on screen), then
  // empties the queue in one shot — backs the "Same reason for all remaining" button.
  const resolveAllRemaining = (reason, note) => {
    dispatch({ type: 'RESOLVE_ALL_REMAINING', payload: { gaps: pendingGaps, reason, note } });
    setPendingGaps([]);
  };

  // Re-runs gap detection against the current habits + current (possibly
  // simulated) today. Setting pendingGaps here is also what forces every
  // screen reading from this context to re-render and pick up the new
  // getTodayKey() — the day offset itself lives outside React state (see
  // dev/devTime.js), so without this the UI wouldn't otherwise notice it changed.
  const recomputeGaps = () => {
    setPendingGaps(computeAllGaps(habits, getTodayKey()));
  };

  // Dev-only: advances the simulated day by `days` and immediately re-checks
  // for newly-exposed gaps, so you can watch the streak/prompt behavior
  // without closing and reopening the app. No-op outside __DEV__.
  const advanceSimulatedDay = async (days) => {
    if (!__DEV__) return;
    await setDevOffset(getDevOffset() + days);
    recomputeGaps();
  };

  return (
    <HabitsContext.Provider
      value={{
        habits,
        addHabit,
        completeHabit,
        deleteHabit,
        getTodayKey,
        getCurrentStreak,
        isLoading,
        pendingGaps,
        resolveGap,
        resolveAllRemaining,
        advanceSimulatedDay,
      }}
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
