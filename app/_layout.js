import { Stack } from 'expo-router';
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
        </Stack>
        <SkipReasonPrompt />
      </HabitsProvider>
    </SettingsProvider>
  );
}
