import { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useHabits } from '../context/HabitsContext';

export default function DevTimePanel() {
  const { getTodayKey, advanceSimulatedDay } = useHabits();
  const [jumpDays, setJumpDays] = useState('');

  const handleJump = () => {
    const days = parseInt(jumpDays, 10);
    if (!Number.isNaN(days) && days > 0) {
      advanceSimulatedDay(days);
      setJumpDays('');
    }
  };

  return (
    <View style={styles.panel}>
      <Text style={styles.label}>DEV ONLY — simulated today: {getTodayKey()}</Text>
      <View style={styles.row}>
        <TouchableOpacity style={styles.button} onPress={() => advanceSimulatedDay(1)}>
          <Text style={styles.buttonText}>+1 day</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          value={jumpDays}
          onChangeText={setJumpDays}
          placeholder="N days"
          placeholderTextColor="#a68a5b"
          keyboardType="numeric"
        />
        <TouchableOpacity style={styles.button} onPress={handleJump}>
          <Text style={styles.buttonText}>Jump</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginTop: 24,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f0ad4e',
    backgroundColor: '#fff8e6',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8a6d3b',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#f0ad4e',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e0c080',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
  },
});
