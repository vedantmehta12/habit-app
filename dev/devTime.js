import { Storage } from 'expo-sqlite/kv-store';

const DEV_OFFSET_KEY = 'dev-day-offset';

// getTodayKey() is called synchronously all over HabitsContext (inside the
// reducer, inside getCurrentStreak, etc.), so it can't await storage. This
// in-memory value is the fast read path; it's loaded from storage once on
// app start and kept in sync on every write.
let dayOffset = 0;

export async function loadDevOffset() {
  if (!__DEV__) return;
  try {
    const stored = await Storage.getItem(DEV_OFFSET_KEY);
    dayOffset = stored ? Number(stored) : 0;
  } catch (error) {
    console.warn('Failed to load dev day offset, defaulting to 0.', error);
    dayOffset = 0;
  }
}

export function getDevOffset() {
  return __DEV__ ? dayOffset : 0;
}

export async function setDevOffset(newOffset) {
  if (!__DEV__) return;
  dayOffset = newOffset;
  try {
    await Storage.setItem(DEV_OFFSET_KEY, String(newOffset));
  } catch (error) {
    console.warn('Failed to persist dev day offset.', error);
  }
}
