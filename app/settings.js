import { StyleSheet, Switch, Text, View } from 'react-native';
import { useSettings } from '../context/SettingsContext';

export default function Settings() {
  const { showRewardProgress, setShowRewardProgress, isLoading } = useSettings();

  if (isLoading) return null;

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.rowText}>
          <Text style={styles.rowLabel}>Show reward progress</Text>
          <Text style={styles.rowHint}>
            When off, no reward progress is shown anywhere, even for habits with it enabled.
          </Text>
        </View>
        <Switch value={showRewardProgress} onValueChange={setShowRewardProgress} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  rowText: {
    flex: 1,
    marginRight: 12,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#222',
  },
  rowHint: {
    fontSize: 13,
    color: '#888',
    marginTop: 4,
  },
});
