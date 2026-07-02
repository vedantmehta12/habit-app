import { Stack } from 'expo-router';
import { HabitsProvider } from '../context/HabitsContext';

export default function RootLayout() {
  return (
    <HabitsProvider>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Habits' }} />
        <Stack.Screen name="create-habit" options={{ title: 'New Habit' }} />
      </Stack>
    </HabitsProvider>
  );
}
