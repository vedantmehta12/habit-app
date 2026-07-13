import { Link } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DevTimePanel from '../components/DevTimePanel';
import JournalPromptCard from '../components/JournalPromptCard';
import RewardModal from '../components/RewardModal';
import { useHabits } from '../context/HabitsContext';
import { useSettings } from '../context/SettingsContext';
import { useTodaysIntention } from '../hooks/useTodaysIntention';
import { getRewardProgress } from '../reward/rewardProgress';

function HabitCard({ habit }) {
  const { completeHabit, deleteHabit, getTodayKey, getCurrentStreak, setRewardShowProgress } =
    useHabits();
  const { showRewardProgress: globalShowRewardProgress } = useSettings();
  const [rewardModalVisible, setRewardModalVisible] = useState(false);
  const todayKey = getTodayKey();
  const doneToday = habit.log[todayKey] === 'full' || habit.log[todayKey] === 'mini';
  const streak = getCurrentStreak(habit.log, todayKey);

  const miniLabel =
    habit.goalType === 'binary' ? habit.miniDescription : `${habit.miniThreshold} ${habit.unit}`;
  const fullLabel =
    habit.goalType === 'binary' ? 'Complete' : `${habit.fullTarget} ${habit.unit}`;

  const rewardProgress = habit.reward
    ? getRewardProgress({ habit, todayKey })
    : null;

  // TEMPORARY — remove once the reward-progress math has been eyeballed
  // against real data. Logs for every habit with a reward regardless of
  // whether the button is actually visible, so the toggles don't hide bugs.
  if (__DEV__ && rewardProgress) {
    console.log(
      `[RewardProgress] ${habit.name}: metricType=${rewardProgress.metricType} current=${rewardProgress.current} target=${rewardProgress.target} ratio=${rewardProgress.ratio.toFixed(3)} progress=${rewardProgress.progress.toFixed(3)} isUnlocked=${rewardProgress.isUnlocked}`
    );
  }

  const showRewardButton =
    globalShowRewardProgress && habit.reward?.showProgress && Boolean(rewardProgress);
  // Shown instead of the full badge when a reward exists but its per-habit
  // showProgress has been turned off — a muted toggle back on, so skipping
  // it isn't a dead end. Still hidden entirely if the global setting is off.
  const showRewardUndoButton =
    globalShowRewardProgress && habit.reward && habit.reward.showProgress === false && Boolean(rewardProgress);

  const handleShowRewardAgain = () => {
    setRewardShowProgress(habit.id, true);
    setRewardModalVisible(true);
  };

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

        {showRewardButton && (
          <TouchableOpacity
            style={[styles.rewardButton, rewardProgress.isUnlocked && styles.rewardButtonUnlocked]}
            onPress={() => setRewardModalVisible(true)}
          >
            {rewardProgress.isUnlocked ? (
              <Text style={styles.rewardButtonIcon}>🎁</Text>
            ) : (
              <Text style={styles.rewardButtonText}>{Math.round(rewardProgress.progress * 100)}%</Text>
            )}
          </TouchableOpacity>
        )}

        {showRewardUndoButton && (
          <TouchableOpacity style={styles.rewardUndoButton} onPress={handleShowRewardAgain}>
            <Text style={styles.rewardUndoButtonIcon}>🎁</Text>
          </TouchableOpacity>
        )}
      </View>

      <RewardModal
        visible={rewardModalVisible}
        habit={habit}
        progress={rewardProgress}
        onClose={() => setRewardModalVisible(false)}
      />

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
  const { intention, setIntention, hasSetToday, isLoading: intentionLoading } = useTodaysIntention();
  const [bannerDismissed, setBannerDismissed] = useState(false);

  if (isLoading || intentionLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#222" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Link href="/settings" asChild>
        <TouchableOpacity style={styles.settingsLink}>
          <Text style={styles.settingsLinkText}>Settings</Text>
        </TouchableOpacity>
      </Link>

      {!hasSetToday && !bannerDismissed && (
        <View style={styles.nudgeBanner}>
          <Text style={styles.nudgeText}>Haven't set an intention for today yet.</Text>
          <TouchableOpacity onPress={() => setBannerDismissed(true)} hitSlop={8}>
            <Text style={styles.nudgeDismiss}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <TextInput
        style={styles.intentionInput}
        value={intention}
        onChangeText={setIntention}
        placeholder="ex: be present"
        placeholderTextColor="#ccc"
      />

      <JournalPromptCard />

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
  settingsLink: {
    alignSelf: 'flex-end',
    marginBottom: 10,
  },
  settingsLinkText: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
  },
  nudgeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  nudgeText: {
    color: '#777',
    fontSize: 13,
    flex: 1,
    marginRight: 8,
  },
  nudgeDismiss: {
    color: '#aaa',
    fontSize: 16,
  },
  intentionInput: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 10,
    fontSize: 16,
    color: '#222',
    marginBottom: 20,
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
  rewardButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  rewardButtonUnlocked: {
    backgroundColor: '#FFD93D',
  },
  rewardButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#333',
  },
  rewardButtonIcon: {
    fontSize: 20,
  },
  rewardUndoButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
    opacity: 0.5,
  },
  rewardUndoButtonIcon: {
    fontSize: 18,
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
