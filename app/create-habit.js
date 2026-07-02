import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useHabits } from '../context/HabitsContext';

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

export default function CreateHabit() {
  const router = useRouter();
  const { addHabit } = useHabits();

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState(null);
  const [color, setColor] = useState(null);
  const [goalType, setGoalType] = useState('binary'); // 'binary' | 'numeric'
  const [unit, setUnit] = useState('');
  const [fullTarget, setFullTarget] = useState('');
  const [miniDescription, setMiniDescription] = useState('');
  const [miniThreshold, setMiniThreshold] = useState('');

  const handleSave = () => {
    if (!name.trim()) return Alert.alert('Missing name', 'Give the habit a name.');
    if (!emoji) return Alert.alert('Missing emoji', 'Pick an emoji.');
    if (!color) return Alert.alert('Missing color', 'Pick a color.');

    if (goalType === 'binary' && !miniDescription.trim()) {
      return Alert.alert('Missing mini version', 'Describe the easier "mini" version.');
    }

    if (goalType === 'numeric') {
      if (!unit.trim()) return Alert.alert('Missing unit', 'What is being counted (e.g. glasses)?');
      const fullValue = Number(fullTarget);
      const miniValue = Number(miniThreshold);
      if (!fullTarget || Number.isNaN(fullValue) || fullValue <= 0) {
        return Alert.alert('Invalid goal', 'Enter a full goal number greater than 0.');
      }
      if (!miniThreshold || Number.isNaN(miniValue) || miniValue < 0) {
        return Alert.alert('Invalid mini goal', 'Enter a mini goal number of 0 or more.');
      }
    }

    addHabit({
      name: name.trim(),
      emoji,
      color,
      goalType,
      unit: goalType === 'numeric' ? unit.trim() : undefined,
      fullTarget: goalType === 'numeric' ? Number(fullTarget) : undefined,
      miniDescription: goalType === 'binary' ? miniDescription.trim() : undefined,
      miniThreshold: goalType === 'numeric' ? Number(miniThreshold) : undefined,
    });

    router.back();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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

          <Text style={styles.label}>Mini goal (easier target)</Text>
          <TextInput
            style={styles.input}
            value={miniThreshold}
            onChangeText={setMiniThreshold}
            placeholder="e.g. 2"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
        </>
      )}

      {goalType === 'binary' && (
        <>
          <Text style={styles.label}>Mini version (easier alternative)</Text>
          <TextInput
            style={styles.input}
            value={miniDescription}
            onChangeText={setMiniDescription}
            placeholder="e.g. Just write one sentence"
            placeholderTextColor="#999"
          />
        </>
      )}

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Habit</Text>
      </TouchableOpacity>
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
  saveButton: {
    backgroundColor: '#222',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 30,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});
