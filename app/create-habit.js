import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useHabits } from '../context/HabitsContext';
import { getMiniSuggestions } from '../habits/miniSuggestions';
import { getPeriodUnit } from '../reward/rewardProgress';

const EMOJI_OPTIONS = ['💪', '📚', '🏃', '🧘', '💧', '😴', '✍️', '🎯'];
const COLOR_OPTIONS = [
  '#FF6B6B',
  '#4D96FF',
  '#FFB86B',
  '#6BCB77',
  '#B983FF',
  '#FFD93D',
  '#4DD0E1',
  '#FF6FB5',
];
const GOAL_PERIOD_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];
const METRIC_TYPE_OPTIONS = [
  { value: 'streak', label: 'Streak' },
  { value: 'percentage', label: 'Percentage' },
  { value: 'total', label: 'Total' },
];

const TOTAL_STEPS = 4;

function StepIndicator({ step }) {
  return (
    <View style={styles.stepIndicatorContainer}>
      <Text style={styles.stepIndicatorText}>
        Step {step} of {TOTAL_STEPS}
      </Text>
      <View style={styles.stepDotsRow}>
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
          <View key={s} style={[styles.stepDot, s <= step && styles.stepDotFilled]} />
        ))}
      </View>
    </View>
  );
}

export default function CreateHabit() {
  const router = useRouter();
  const { addHabit } = useHabits();

  const [step, setStep] = useState(1);

  // Step 1
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(null);
  const [color, setColor] = useState(null);

  // Step 2
  const [goalPeriod, setGoalPeriod] = useState('daily');
  const [goalType, setGoalType] = useState('binary'); // 'binary' | 'numeric'
  const [unit, setUnit] = useState('');
  const [fullTarget, setFullTarget] = useState('');

  // Step 3
  const [miniDescription, setMiniDescription] = useState('');
  const [miniThreshold, setMiniThreshold] = useState('');

  // Step 4 (optional)
  const [rewardDescription, setRewardDescription] = useState('');
  const [rewardMetricType, setRewardMetricType] = useState(null);
  const [rewardTargetDays, setRewardTargetDays] = useState('');
  const [rewardTargetPercentage, setRewardTargetPercentage] = useState('');
  const [rewardWindowDays, setRewardWindowDays] = useState('');
  const [rewardTargetCount, setRewardTargetCount] = useState('');
  const [rewardShowProgress, setRewardShowProgress] = useState(true);

  const handleNext = () => {
    if (step === 1) {
      if (!name.trim()) return Alert.alert('Missing name', 'Give the habit a name.');
      if (!emoji) return Alert.alert('Missing emoji', 'Pick an emoji.');
      if (!color) return Alert.alert('Missing color', 'Pick a color.');
      setStep(2);
      return;
    }

    if (step === 2) {
      if (goalType === 'numeric') {
        if (!unit.trim()) return Alert.alert('Missing unit', 'What is being counted (e.g. glasses)?');
        const fullValue = Number(fullTarget);
        if (!fullTarget || Number.isNaN(fullValue) || fullValue <= 0) {
          return Alert.alert('Invalid goal', 'Enter a full goal number greater than 0.');
        }
        // Prefill a starting-point mini threshold at 25% of the full target
        // the first time this step is reached — never overwrites a value
        // the user already has, so going back and adjusting fullTarget
        // won't stomp on an edit they've made.
        if (!miniThreshold) {
          setMiniThreshold(String(Math.max(1, Math.floor(fullValue * 0.25))));
        }
      }
      setStep(3);
      return;
    }

    if (step === 3) {
      if (goalType === 'binary' && !miniDescription.trim()) {
        return Alert.alert('Missing mini version', 'Describe the easier "mini" version.');
      }
      if (goalType === 'numeric') {
        const miniValue = Number(miniThreshold);
        if (!miniThreshold || Number.isNaN(miniValue) || miniValue < 0) {
          return Alert.alert('Invalid mini goal', 'Enter a mini goal number of 0 or more.');
        }
      }
      setStep(4);
      return;
    }
  };

  const handleBack = () => setStep((current) => Math.max(1, current - 1));

  // Returns an error message if the reward fields are in a half-finished
  // state (some filled, some not), or null if it's either fully skippable
  // (nothing entered) or fully valid.
  const getRewardValidationError = () => {
    const hasDescription = rewardDescription.trim().length > 0;
    const hasMetric = rewardMetricType !== null;

    if (!hasDescription && !hasMetric) return null; // nothing entered — skip is fine

    if (hasDescription !== hasMetric) {
      return 'A reward needs both a description and a goal — finish both, or clear them to skip this step.';
    }

    if (rewardMetricType === 'streak') {
      const days = Number(rewardTargetDays);
      if (!rewardTargetDays || Number.isNaN(days) || days <= 0) {
        return 'Enter a number of consecutive days greater than 0.';
      }
    } else if (rewardMetricType === 'percentage') {
      const percentage = Number(rewardTargetPercentage);
      const windowDays = Number(rewardWindowDays);
      if (!rewardTargetPercentage || Number.isNaN(percentage) || percentage <= 0 || percentage > 100) {
        return 'Enter a percentage between 1 and 100.';
      }
      if (!rewardWindowDays || Number.isNaN(windowDays) || windowDays <= 0) {
        return 'Enter a number of days (greater than 0) for the percentage window.';
      }
    } else if (rewardMetricType === 'total') {
      const count = Number(rewardTargetCount);
      if (!rewardTargetCount || Number.isNaN(count) || count <= 0) {
        return 'Enter a total number of completions greater than 0.';
      }
    }

    return null;
  };

  const buildReward = () => {
    const hasDescription = rewardDescription.trim().length > 0;
    const hasMetric = rewardMetricType !== null;
    if (!hasDescription || !hasMetric) return undefined;

    const goal = { metricType: rewardMetricType };
    if (rewardMetricType === 'streak') goal.targetDays = Number(rewardTargetDays);
    if (rewardMetricType === 'percentage') {
      goal.targetPercentage = Number(rewardTargetPercentage);
      goal.windowDays = Number(rewardWindowDays);
    }
    if (rewardMetricType === 'total') goal.targetCount = Number(rewardTargetCount);

    return {
      description: rewardDescription.trim(),
      showProgress: rewardShowProgress,
      goal,
    };
  };

  const saveHabit = (reward) => {
    addHabit({
      name: name.trim(),
      emoji,
      color,
      goalPeriod,
      goalType,
      unit: goalType === 'numeric' ? unit.trim() : undefined,
      fullTarget: goalType === 'numeric' ? Number(fullTarget) : undefined,
      miniDescription: goalType === 'binary' ? miniDescription.trim() : undefined,
      miniThreshold: goalType === 'numeric' ? Number(miniThreshold) : undefined,
      reward,
    });
    router.back();
  };

  const handleSkipReward = () => saveHabit(undefined);

  const handleSaveWithReward = () => {
    const error = getRewardValidationError();
    if (error) return Alert.alert('Incomplete reward', error);
    saveHabit(buildReward());
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: name.trim() || 'New Habit' }} />

      <StepIndicator step={step} />

      {step === 1 && (
        <>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Drink water"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Emoji</Text>
          <View style={styles.optionRow}>
            {EMOJI_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={[styles.emojiOption, emoji === option && styles.optionSelected]}
                onPress={() => setEmoji(option)}
              >
                <Text style={styles.emojiOptionText}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Color</Text>
          <View style={styles.optionRow}>
            {COLOR_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.colorOption,
                  { backgroundColor: option },
                  color === option && styles.colorSelected,
                ]}
                onPress={() => setColor(option)}
              />
            ))}
          </View>
        </>
      )}

      {step === 2 && (
        <>
          <Text style={styles.label}>Goal period</Text>
          <View style={styles.toggleRow}>
            {GOAL_PERIOD_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.toggleButton, goalPeriod === option.value && styles.toggleSelected]}
                onPress={() => setGoalPeriod(option.value)}
              >
                <Text
                  style={goalPeriod === option.value ? styles.toggleTextSelected : styles.toggleText}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Goal type</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleButton, goalType === 'binary' && styles.toggleSelected]}
              onPress={() => setGoalType('binary')}
            >
              <Text style={goalType === 'binary' ? styles.toggleTextSelected : styles.toggleText}>
                Yes / No
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, goalType === 'numeric' && styles.toggleSelected]}
              onPress={() => setGoalType('numeric')}
            >
              <Text style={goalType === 'numeric' ? styles.toggleTextSelected : styles.toggleText}>
                Number
              </Text>
            </TouchableOpacity>
          </View>

          {goalType === 'numeric' && (
            <>
              <Text style={styles.label}>Unit</Text>
              <TextInput
                style={styles.input}
                value={unit}
                onChangeText={setUnit}
                placeholder="e.g. glasses"
                placeholderTextColor="#999"
              />

              <Text style={styles.label}>Full goal</Text>
              <TextInput
                style={styles.input}
                value={fullTarget}
                onChangeText={setFullTarget}
                placeholder="e.g. 8"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </>
          )}
        </>
      )}

      {step === 3 && (
        <>
          <Text style={styles.label}>What's the smallest version that still counts?</Text>

          {goalType === 'numeric' ? (
            <TextInput
              style={styles.input}
              value={miniThreshold}
              onChangeText={setMiniThreshold}
              placeholder="e.g. 2"
              placeholderTextColor="#999"
              keyboardType="numeric"
            />
          ) : (
            <>
              <View style={styles.suggestionRow}>
                {getMiniSuggestions(name).map((suggestion) => (
                  <TouchableOpacity
                    key={suggestion}
                    style={styles.suggestionChip}
                    onPress={() => setMiniDescription(suggestion)}
                  >
                    <Text style={styles.suggestionChipText}>{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TextInput
                style={styles.input}
                value={miniDescription}
                onChangeText={setMiniDescription}
                placeholder="e.g. Just write one sentence"
                placeholderTextColor="#999"
              />
            </>
          )}
        </>
      )}

      {step === 4 && (
        <>
          <Text style={styles.label}>How do you want to reward yourself?</Text>
          <TextInput
            style={styles.input}
            value={rewardDescription}
            onChangeText={setRewardDescription}
            placeholder="e.g. New pair of running shoes"
            placeholderTextColor="#999"
          />

          <Text style={styles.label}>Reward goal type</Text>
          <View style={styles.toggleRow}>
            {METRIC_TYPE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.toggleButton,
                  rewardMetricType === option.value && styles.toggleSelected,
                ]}
                onPress={() => setRewardMetricType(option.value)}
              >
                <Text
                  style={
                    rewardMetricType === option.value ? styles.toggleTextSelected : styles.toggleText
                  }
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {rewardMetricType === 'streak' && (
            <>
              <Text style={styles.label}>Consecutive {getPeriodUnit(goalPeriod)}s</Text>
              <TextInput
                style={styles.input}
                value={rewardTargetDays}
                onChangeText={setRewardTargetDays}
                placeholder="e.g. 14"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </>
          )}

          {rewardMetricType === 'percentage' && (
            <>
              <Text style={styles.label}>Completion percentage</Text>
              <TextInput
                style={styles.input}
                value={rewardTargetPercentage}
                onChangeText={setRewardTargetPercentage}
                placeholder="e.g. 80"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />

              <Text style={styles.label}>Over how many days</Text>
              <TextInput
                style={styles.input}
                value={rewardWindowDays}
                onChangeText={setRewardWindowDays}
                placeholder="e.g. 30"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </>
          )}

          {rewardMetricType === 'total' && (
            <>
              <Text style={styles.label}>Total completions</Text>
              <TextInput
                style={styles.input}
                value={rewardTargetCount}
                onChangeText={setRewardTargetCount}
                placeholder="e.g. 50"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </>
          )}

          {rewardMetricType !== null && (
            <View style={styles.rewardToggleRow}>
              <Text style={styles.rewardToggleLabel}>Show reward progress for this habit</Text>
              <Switch value={rewardShowProgress} onValueChange={setRewardShowProgress} />
            </View>
          )}
        </>
      )}

      <View style={styles.navRow}>
        {step > 1 && (
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}

        {step < TOTAL_STEPS && (
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>Next</Text>
          </TouchableOpacity>
        )}
      </View>

      {step === TOTAL_STEPS && (
        <>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkipReward}>
            <Text style={styles.skipButtonText}>Skip for now</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveWithReward}>
            <Text style={styles.saveButtonText}>Save Habit</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  stepIndicatorContainer: {
    marginBottom: 10,
  },
  stepIndicatorText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
    marginBottom: 8,
  },
  stepDotsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  stepDot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#eee',
  },
  stepDotFilled: {
    backgroundColor: '#222',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 18,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  emojiOption: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiOptionText: {
    fontSize: 24,
  },
  optionSelected: {
    borderColor: '#222',
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorSelected: {
    borderColor: '#222',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  toggleSelected: {
    backgroundColor: '#222',
    borderColor: '#222',
  },
  toggleText: {
    color: '#333',
    fontWeight: '600',
  },
  toggleTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  suggestionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  suggestionChip: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: '#fafafa',
  },
  suggestionChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  rewardToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  rewardToggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 12,
  },
  navRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 30,
  },
  backButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  backButtonText: {
    color: '#333',
    fontWeight: '700',
    fontSize: 16,
  },
  nextButton: {
    flex: 2,
    backgroundColor: '#222',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  nextButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  skipButton: {
    alignItems: 'center',
    marginTop: 16,
  },
  skipButtonText: {
    color: '#888',
    fontWeight: '600',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: '#222',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 14,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
