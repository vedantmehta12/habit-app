import { useEffect, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useHabits } from '../context/HabitsContext';

const REASONS = [
  { key: 'no_time', label: 'No time' },
  { key: 'low_energy', label: 'Low energy' },
  { key: 'forgot', label: 'Forgot' },
  { key: 'overwhelmed', label: 'Overwhelmed' },
  { key: 'other', label: 'Other' },
];

export default function SkipReasonPrompt() {
  const { habits, pendingGaps, resolveGap, resolveAllRemaining } = useHabits();

  const currentGap = pendingGaps[0];
  const gapSize = currentGap ? currentGap.dates.length : 0;

  // null = still needs the "one for all" vs "different per day" choice
  // (only relevant for 2-4 day gaps); 'all' or 'per-day' otherwise.
  const [dayMode, setDayMode] = useState(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [perDayAnswers, setPerDayAnswers] = useState([]);
  const [selectedReason, setSelectedReason] = useState(null);
  const [otherText, setOtherText] = useState('');

  // Reset the wizard whenever a new habit's gap comes to the front of the queue.
  useEffect(() => {
    if (!currentGap) return;
    const size = currentGap.dates.length;
    setDayMode(size >= 2 && size <= 4 ? null : 'all');
    setStepIndex(0);
    setPerDayAnswers([]);
    setSelectedReason(null);
    setOtherText('');
  }, [currentGap?.habitId]);

  if (!currentGap) return null;

  const habit = habits.find((h) => h.id === currentGap.habitId);
  if (!habit) return null;

  const otherHabitsWaiting = pendingGaps.length > 1;
  const isPerDay = dayMode === 'per-day';
  const currentDate = isPerDay ? currentGap.dates[stepIndex] : null;

  const resetReasonPick = () => {
    setSelectedReason(null);
    setOtherText('');
  };

  const buildNote = () => (selectedReason === 'other' && otherText.trim() ? otherText.trim() : undefined);

  const handleConfirm = () => {
    const reason = selectedReason;
    const note = buildNote();

    if (isPerDay) {
      const newAnswers = [...perDayAnswers, { date: currentDate, reason, note }];
      if (stepIndex + 1 < gapSize) {
        setPerDayAnswers(newAnswers);
        setStepIndex(stepIndex + 1);
        resetReasonPick();
      } else {
        resolveGap(currentGap.habitId, newAnswers);
      }
    } else {
      const resolutions = currentGap.dates.map((date) => ({ date, reason, note }));
      resolveGap(currentGap.habitId, resolutions);
    }
  };

  const handleSameForAllRemaining = () => {
    resolveAllRemaining(selectedReason, buildNote());
  };

  const handleDismiss = () => {
    const resolutions = currentGap.dates.map((date) => ({ date }));
    resolveGap(currentGap.habitId, resolutions);
  };

  const title = isPerDay
    ? `${habit.emoji} ${habit.name} — day ${stepIndex + 1} of ${gapSize} (${currentDate})`
    : gapSize === 1
      ? `${habit.emoji} You missed ${habit.name} on ${currentGap.dates[0]}`
      : `${habit.emoji} You missed ${habit.name} for ${gapSize} days`;

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.dismiss} onPress={handleDismiss}>
            <Text style={styles.dismissText}>✕</Text>
          </TouchableOpacity>

          <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.title}>{title}</Text>

          {dayMode === null ? (
            <>
              <Text style={styles.subtitle}>How do you want to log these?</Text>
              <TouchableOpacity style={styles.choiceButton} onPress={() => setDayMode('all')}>
                <Text style={styles.choiceButtonText}>One reason for all {gapSize} days</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.choiceButton} onPress={() => setDayMode('per-day')}>
                <Text style={styles.choiceButtonText}>Different reason per day</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.subtitle}>What happened?</Text>
              <View style={styles.reasonGrid}>
                {REASONS.map((reason) => (
                  <TouchableOpacity
                    key={reason.key}
                    style={[
                      styles.reasonButton,
                      selectedReason === reason.key && styles.reasonButtonSelected,
                    ]}
                    onPress={() => setSelectedReason(reason.key)}
                  >
                    <Text
                      style={[
                        styles.reasonButtonText,
                        selectedReason === reason.key && styles.reasonButtonTextSelected,
                      ]}
                    >
                      {reason.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {selectedReason === 'other' && (
                <TextInput
                  style={styles.input}
                  value={otherText}
                  onChangeText={setOtherText}
                  placeholder="Optional note"
                  placeholderTextColor="#999"
                />
              )}

              {selectedReason && (
                <>
                  <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                    <Text style={styles.confirmButtonText}>
                      {isPerDay && stepIndex + 1 < gapSize ? 'Next day' : 'Confirm'}
                    </Text>
                  </TouchableOpacity>

                  {otherHabitsWaiting && (
                    <TouchableOpacity style={styles.remainingButton} onPress={handleSameForAllRemaining}>
                      <Text style={styles.remainingButtonText}>Same reason for all remaining</Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </>
          )}
          </ScrollView>
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
    maxHeight: '85%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  scrollArea: {
    flexShrink: 1,
  },
  scrollContent: {
    paddingBottom: 4,
  },
  dismiss: {
    alignSelf: 'flex-end',
  },
  dismissText: {
    fontSize: 18,
    color: '#999',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 12,
  },
  choiceButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  choiceButtonText: {
    fontWeight: '600',
    color: '#222',
  },
  reasonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  reasonButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  reasonButtonSelected: {
    backgroundColor: '#222',
    borderColor: '#222',
  },
  reasonButtonText: {
    color: '#333',
    fontWeight: '600',
  },
  reasonButtonTextSelected: {
    color: '#fff',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 12,
  },
  confirmButton: {
    backgroundColor: '#222',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
  remainingButton: {
    marginTop: 10,
    alignItems: 'center',
    paddingVertical: 8,
  },
  remainingButtonText: {
    color: '#555',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
