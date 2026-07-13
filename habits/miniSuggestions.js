import { GENERIC_MINI_SUGGESTIONS, MINI_SUGGESTION_RULES } from './miniSuggestionRules';

const MAX_SUGGESTIONS = 3;

// Up to 3 tappable suggestion strings for the binary mini-habit step, based
// on a light case-insensitive keyword match against the habit name — same
// "soft signal, first match wins" approach as the journal prompt engine's
// mood matching, not full parsing. When a keyword matches, its suggestion is
// shown first, padded out with generic examples (deduped) to fill the rest.
export function getMiniSuggestions(habitName) {
  const lower = (habitName || '').toLowerCase();
  const matchedRule = MINI_SUGGESTION_RULES.find((rule) =>
    rule.keywords.some((keyword) => lower.includes(keyword))
  );

  if (!matchedRule) {
    return GENERIC_MINI_SUGGESTIONS.slice(0, MAX_SUGGESTIONS);
  }

  const rest = GENERIC_MINI_SUGGESTIONS.filter((suggestion) => suggestion !== matchedRule.suggestion);
  return [matchedRule.suggestion, ...rest].slice(0, MAX_SUGGESTIONS);
}
