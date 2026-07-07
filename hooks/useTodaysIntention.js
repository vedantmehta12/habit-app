import { useEffect, useRef, useState } from 'react';
import { Storage } from 'expo-sqlite/kv-store';
import { getTodayKey } from '../context/HabitsContext';

const STORAGE_KEY = 'todays-intention';

// Stored as { date, text } so "auto-reset at midnight" is just "ignore
// whatever's saved if its date isn't today" — no separate reset step needed.
export function useTodaysIntention() {
  const [intention, setIntentionState] = useState('');
  const [hasSetToday, setHasSetToday] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const hasHydrated = useRef(false);
  // Which day the in-memory intention state currently reflects.
  const lastCheckedDate = useRef(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const stored = await Storage.getItem(STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : null;
        const todayKey = getTodayKey();
        if (isMounted && parsed && parsed.date === todayKey && parsed.text) {
          setIntentionState(parsed.text);
          setHasSetToday(true);
        }
        // If the stored date isn't today (or nothing's stored), leave it
        // blank/unset — that's the "auto-reset at midnight" behavior.
        lastCheckedDate.current = todayKey;
      } catch (error) {
        console.warn("Failed to load today's intention, starting fresh.", error);
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

  // Re-checks on every render, not just at mount — this is what makes the
  // intention actually clear when the dev panel's day-jump is used mid-session.
  // Advancing the simulated day changes HabitsContext's pendingGaps state,
  // which re-renders every screen using this hook; that re-render is our
  // only signal that "today" moved on, since there's no live clock ticking.
  if (hasHydrated.current) {
    const todayKey = getTodayKey();
    if (lastCheckedDate.current !== todayKey) {
      lastCheckedDate.current = todayKey;
      if (intention !== '' || hasSetToday) {
        setIntentionState('');
        setHasSetToday(false);
      }
    }
  }

  const setIntention = (text) => {
    setIntentionState(text);
    setHasSetToday(text.trim().length > 0);
    if (!hasHydrated.current) return; // don't save over the loaded value before it's read
    Storage.setItem(STORAGE_KEY, JSON.stringify({ date: getTodayKey(), text })).catch((error) =>
      console.warn("Failed to save today's intention.", error)
    );
  };

  return { intention, setIntention, hasSetToday, isLoading };
}
