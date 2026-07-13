import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useHabits } from '../context/HabitsContext';
import { getRewardProgress } from '../reward/rewardProgress';

// Local-only notifications (no push infra) — this works fine in Expo Go,
// unlike remote push which SDK 54 dropped from Expo Go. Foreground display
// still needs an explicit handler, otherwise nothing shows while the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Only asks for permission the first time a notification actually needs to
// fire, not proactively at app launch. If denied (or the OS won't let us ask
// again), the caller just skips scheduling — everything else keeps working.
async function ensurePermission() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

async function fireNotification(title, body) {
  const granted = await ensurePermission();
  if (!granted) return;
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null, // deliver immediately
  });
}

// No visual output — same "always-mounted, logic-only" pattern as
// SkipReasonPrompt. Watches every habit's reward progress and fires each
// milestone notification exactly once, ever, per habit.
export default function RewardNotifications() {
  const { habits, getTodayKey, getCurrentStreak, markRewardNotified } = useHabits();
  const router = useRouter();

  useEffect(() => {
    let isCancelled = false;

    (async () => {
      const todayKey = getTodayKey();

      for (const habit of habits) {
        if (!habit.reward) continue;
        if (isCancelled) return;

        const currentStreak = getCurrentStreak(habit.log, todayKey);
        const progress = getRewardProgress({ habit, todayKey, currentStreak });
        if (!progress) continue;

        const notified = habit.reward.notified || {};

        if (progress.progress >= 0.5 && !notified.halfway) {
          await fireNotification('Halfway there!', `You're 50% toward: ${habit.reward.description}`);
          if (isCancelled) return;
          markRewardNotified(habit.id, 'halfway');
        }

        if (progress.isUnlocked && !notified.complete) {
          await fireNotification('Reward unlocked!', habit.reward.description);
          if (isCancelled) return;
          markRewardNotified(habit.id, 'complete');
          router.push({ pathname: '/reward-unlocked', params: { habitId: habit.id } });
        }
      }
    })();

    return () => {
      isCancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habits]);

  return null;
}
