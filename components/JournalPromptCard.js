import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useJournalPrompt } from '../hooks/useJournalPrompt';

export default function JournalPromptCard() {
  const { prompt, isLoading } = useJournalPrompt();
  const [isExpanded, setIsExpanded] = useState(false);

  if (isLoading || !prompt) return null;

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => setIsExpanded((prev) => !prev)}
      activeOpacity={0.8}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>Today's Journal Prompt</Text>
        <Text style={styles.chevron}>{isExpanded ? '▲' : '▼'}</Text>
      </View>
      {isExpanded && <Text style={styles.promptText}>{prompt.text}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
  },
  chevron: {
    fontSize: 12,
    color: '#999',
  },
  promptText: {
    marginTop: 10,
    fontSize: 15,
    color: '#444',
    fontStyle: 'italic',
    lineHeight: 21,
  },
});
