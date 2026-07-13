import { Stack } from 'expo-router';
import RewardNotifications from '../components/RewardNotifications';
import SkipReasonPrompt from '../components/SkipReasonPrompt';
import { HabitsProvider } from '../context/HabitsContext';
import { SettingsProvider } from '../context/SettingsContext';

export default function RootLayout() {
  return (
    <SettingsProvider>
      <HabitsProvider>
        <Stack>
          <Stack.Screen name="index" options={{ title: 'Habits' }} />
          <Stack.Screen name="create-habit" options={{ title: 'New Habit' }} />
          <Stack.Screen name="settings" options={{ title: 'Settings' }} />
          <Stack.Screen
            name="reward-unlocked"
            options={{ presentation: 'modal', headerShown: false }}
          />
        </Stack>
        <SkipReasonPrompt />
        <RewardNotifications />
      </HabitsProvider>
    </SettingsProvider>
  );
}
