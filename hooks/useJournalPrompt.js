import { useEffect, useRef, useState } from 'react';
import { Storage } from 'expo-sqlite/kv-store';
import { useHabits } from '../context/HabitsContext';
import { findPromptById, getTodaysPrompt, isAfterCutover } from '../journal/promptEngine';

const STORAGE_KEY = 'journal-prompt-state';
const MAX_TRACKED_PER_SCENARIO = 2;

// A "slot" is a calendar day split into a before-6pm half and an at/after-6pm
// half — the two halves can classify differently since the 6pm cutover
// changes which day's data gets analyzed. This combined key is what "the
// same prompt persists until something meaningful changes" is checked against.
function getSlotKey(todayKey) {
  return `${todayKey}:${isAfterCutover()}`;
}

// Future soft signal: intention-text keyword matching isn't wired in yet —
// see the comment in journal/promptEngine.js. When it is, this hook would
// read `intention` from useTodaysIntention() again and pass it through to
// getTodaysPrompt().

// Surfaces today's journal prompt: same prompt for the rest of the current
// slot once picked (so reopening the app doesn't reshuffle it), a fresh pick
// once the slot moves on — real midnight, crossing 6pm, or the dev panel's
// simulated day-jump all count as the slot changing.
export function useJournalPrompt() {
  const { habits, getTodayKey } = useHabits();

  const [result, setResult] = useState(null); // { scenario, prompt: { id, text } }
  const [isLoading, setIsLoading] = useState(true);
  const hasHydrated = useRef(false);
  const lastCheckedSlot = useRef(null);
  // Last (up to 2) prompt ids shown per scenario, persisted so anti-repeat
  // survives app restarts. Independent of the currently-displayed prompt —
  // e.g. yesterday's roughPatch history stays intact even if today is strongWeek.
  const lastShownByScenarioRef = useRef({});

  const computeAndPersist = (todayKey) => {
    const selection = getTodaysPrompt({
      habits,
      todayKey,
      lastShownByScenario: lastShownByScenarioRef.current,
    });
    setResult(selection);

    const prevList = lastShownByScenarioRef.current[selection.scenario] ?? [];
    const updatedList = [...prevList, selection.prompt.id].slice(-MAX_TRACKED_PER_SCENARIO);
    lastShownByScenarioRef.current = {
      ...lastShownByScenarioRef.current,
      [selection.scenario]: updatedList,
    };

    lastCheckedSlot.current = getSlotKey(todayKey);
    Storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        date: todayKey,
        afterCutover: selection.afterCutover,
        scenario: selection.scenario,
        promptId: selection.prompt.id,
        lastShownByScenario: lastShownByScenarioRef.current,
      })
    ).catch((error) => console.warn('Failed to save journal prompt state.', error));
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const stored = await Storage.getItem(STORAGE_KEY);
        const parsed = stored ? JSON.parse(stored) : null;
        const todayKey = getTodayKey();
        if (parsed?.lastShownByScenario) {
          lastShownByScenarioRef.current = parsed.lastShownByScenario;
        }

        if (!isMounted) return;

        const currentSlot = getSlotKey(todayKey);
        const storedSlot = parsed ? `${parsed.date}:${parsed.afterCutover}` : null;

        if (parsed && storedSlot === currentSlot) {
          const existingPrompt = findPromptById(parsed.scenario, parsed.promptId);
          if (existingPrompt) {
            setResult({ scenario: parsed.scenario, prompt: existingPrompt });
            lastCheckedSlot.current = currentSlot;
          } else {
            // Pool must have changed since this was picked — fall back to a fresh pick.
            computeAndPersist(todayKey);
          }
        } else {
          computeAndPersist(todayKey);
        }
      } catch (error) {
        console.warn('Failed to load journal prompt state, computing fresh.', error);
        if (isMounted) computeAndPersist(getTodayKey());
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-checks on every render, not just at mount — same pattern as
  // useTodaysIntention, so a mid-session dev-panel day-jump (or the app
  // staying open across real midnight or real 6pm) picks a fresh prompt
  // without needing the app to be closed and reopened.
  if (hasHydrated.current) {
    const todayKey = getTodayKey();
    const currentSlot = getSlotKey(todayKey);
    if (lastCheckedSlot.current !== currentSlot) {
      computeAndPersist(todayKey);
    }
  }

  return { scenario: result?.scenario ?? null, prompt: result?.prompt ?? null, isLoading };
}
