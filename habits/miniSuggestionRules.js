// Keyword -> mini-habit suggestion rules for the "smallest version that
// still counts?" step of binary habit creation. Add more freely — each rule
// is { keywords, suggestion }. The habit name is matched case-insensitively
// as a substring check against `keywords`; the first rule with any keyword
// match wins, so put a rule earlier in the list if it should take priority
// over another when a name could match both.

export const MINI_SUGGESTION_RULES = [
  { keywords: ['gym', 'workout', 'lift'], suggestion: '10 minutes of stretching' },
  { keywords: ['read'], suggestion: 'One page' },
  { keywords: ['journal', 'write'], suggestion: 'Two sentences' },
  { keywords: ['meditate', 'meditation'], suggestion: 'One minute of breathing' },
  { keywords: ['run', 'jog', 'walk'], suggestion: 'Walk around the block' },
];

// Shown when no keyword matches, so the user still sees the pattern these
// suggestions follow (small, concrete, a couple minutes at most).
export const GENERIC_MINI_SUGGESTIONS = ['One page', 'Two sentences', '10 minutes of stretching'];
