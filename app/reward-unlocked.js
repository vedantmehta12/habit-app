import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useHabits } from '../context/HabitsContext';

export default function RewardUnlocked() {
  const router = useRouter();
  const { habitId } = useLocalSearchParams();
  const { habits } = useHabits();
  const habit = habits.find((h) => h.id === habitId);

  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
    ]).start();
  }, [opacity, scale]);

  if (!habit) {
    return (
      <View style={styles.container}>
        <TouchableOpacity style={styles.plainButton} onPress={() => router.back()}>
          <Text style={styles.plainButtonText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: habit.color }]}>
      <Animated.View style={[styles.content, { opacity, transform: [{ scale }] }]}>
        <Text style={styles.emoji}>🎁</Text>
        <Text style={styles.eyebrow}>Reward unlocked</Text>
        <Text style={styles.rewardText}>{habit.reward.description}</Text>
        <Text style={styles.habitText}>
          {habit.emoji} {habit.name}
        </Text>

        <TouchableOpacity style={styles.doneButton} onPress={() => router.back()}>
          <Text style={styles.doneButtonText}>Nice!</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  content: {
    alignItems: 'center',
  },
  emoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  eyebrow: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  rewardText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  habitText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 40,
  },
  doneButton: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 40,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
  },
  plainButton: {
    padding: 16,
  },
  plainButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});
