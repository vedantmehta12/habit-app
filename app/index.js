import { Link } from 'expo-router';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DevTimePanel from '../components/DevTimePanel';
import { useHabits } from '../context/HabitsContext';

function HabitCard({ habit }) {
  const { completeHabit, deleteHabit, getTodayKey, getCurrentStreak } = useHabits();
  const todayKey = getTodayKey();
  const doneToday = habit.log[todayKey] === 'full' || habit.log[todayKey] === 'mini';
  const streak = getCurrentStreak(habit.log, todayKey);

  const miniLabel =
    habit.goalType === 'binary' ? habit.miniDescription : `${habit.miniThreshold} ${habit.unit}`;
  const fullLabel =
    habit.goalType === 'binary' ? 'Complete' : `${habit.fullTarget} ${habit.unit}`;

  const handleLongPress = () => {
    Alert.alert(`Delete ${habit.name}?`, "This can't be undone.", [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteHabit(habit.id) },
    ]);
  };

  return (
    <TouchableOpacity
      style={[styles.card, { borderColor: habit.color }]}
      onLongPress={handleLongPress}
      activeOpacity={0.9}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.emoji}>{habit.emoji}</Text>
        <View style={styles.cardHeaderText}>
          <Text style={styles.habitName}>{habit.name}</Text>
          <Text style={styles.streak}>🔥 {streak} day{streak === 1 ? '' : 's'}</Text>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: habit.color }, doneToday && styles.buttonDone]}
          disabled={doneToday}
          onPress={() => completeHabit(habit.id, 'full')}
        >
          <Text style={styles.buttonText}>{doneToday ? 'Done today' : fullLabel}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.miniButton, doneToday && styles.buttonDone]}
          disabled={doneToday}
          onPress={() => completeHabit(habit.id, 'mini')}
        >
          <Text style={styles.miniButtonText}>
            {doneToday ? 'Done today' : `Mini: ${miniLabel}`}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export default function Home() {
  const { habits, isLoading } = useHabits();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#222" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Link href="/create-habit" asChild>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add Habit</Text>
        </TouchableOpacity>
      </Link>

      {habits.length === 0 && (
        <Text style={styles.emptyText}>No habits yet — add your first one above.</Text>
      )}

      {habits.map((habit) => (
        <HabitCard key={habit.id} habit={habit} />
      ))}

      {__DEV__ && <DevTimePanel />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  addButton: {
    backgroundColor: '#222',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 40,
  },
  card: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  emoji: {
    fontSize: 32,
    marginRight: 12,
  },
  cardHeaderText: {
    flex: 1,
  },
  habitName: {
    fontSize: 18,
    fontWeight: '700',
  },
  streak: {
    fontSize: 14,
    color: '#555',
    marginTop: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  miniButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#eee',
  },
  buttonDone: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  miniButtonText: {
    color: '#333',
    fontWeight: '600',
  },
});
