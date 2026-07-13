import { Alert, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useHabits } from '../context/HabitsContext';

function pluralize(count, unit) {
  return `${unit}${count === 1 ? '' : 's'}`;
}

function formatGoalLabel(goal, periodUnit) {
  if (goal.metricType === 'streak') {
    return `${goal.targetDays} consecutive ${pluralize(goal.targetDays, periodUnit)}`;
  }
  if (goal.metricType === 'percentage') {
    return `${goal.targetPercentage}% completion over ${goal.windowDays} days`;
  }
  if (goal.metricType === 'total') {
    return `${goal.targetCount} total completions`;
  }
  return '';
}

function formatProgressLabel(progress) {
  if (progress.metricType === 'streak') {
    return `${progress.current} / ${progress.target} ${pluralize(progress.target, progress.periodUnit)}`;
  }
  if (progress.metricType === 'percentage') {
    return `${progress.current}% / ${progress.target}%`;
  }
  if (progress.metricType === 'total') {
    return `${progress.current} / ${progress.target} completions`;
  }
  return '';
}

export default function RewardModal({ visible, habit, progress, onClose }) {
  const { setRewardShowProgress } = useHabits();

  if (!visible || !habit?.reward || !progress) return null;

  const handleSkip = () => {
    Alert.alert(
      'Hide reward progress?',
      "This swaps the badge for a small muted icon on the habit's card — tap that anytime to bring it back.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Hide it',
          onPress: () => {
            setRewardShowProgress(habit.id, false);
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.dismiss} onPress={onClose}>
            <Text style={styles.dismissText}>✕</Text>
          </TouchableOpacity>

          <Text style={styles.title}>
            {progress.isUnlocked ? '🎁 Reward unlocked' : '🎯 Reward in progress'}
          </Text>

          <Text style={styles.rewardText}>{habit.reward.description}</Text>

          <View style={styles.divider} />

          <Text style={styles.label}>Goal</Text>
          <Text style={styles.value}>{formatGoalLabel(habit.reward.goal, progress.periodUnit)}</Text>

          <Text style={styles.label}>Current progress</Text>
          <Text style={styles.value}>{formatProgressLabel(progress)}</Text>
          <Text style={styles.percentText}>{Math.round(progress.progress * 100)}%</Text>

          <TouchableOpacity style={styles.skipLink} onPress={handleSkip}>
            <Text style={styles.skipLinkText}>Hide this progress badge</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  dismiss: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 1,
    padding: 4,
  },
  dismissText: {
    fontSize: 16,
    color: '#999',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    paddingRight: 24,
  },
  rewardText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    marginBottom: 4,
  },
  value: {
    fontSize: 15,
    color: '#222',
    marginBottom: 14,
  },
  percentText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#222',
  },
  skipLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  skipLinkText: {
    fontSize: 13,
    color: '#999',
    fontWeight: '600',
  },
});
