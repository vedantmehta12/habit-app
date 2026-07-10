import { PROMPT_POOLS } from './prompts';

// Tunable thresholds — all the "judgment calls" live here, separate from the
// pool data and from how a caller wires this up. Safe to retune once you've
// seen this behave against real usage.
const LOOKBACK_DAYS = 7;
const CUTOVER_HOUR = 18; // 6pm local time — see isAfterCutover() below
const FRESH_START_MIN_DAYS = 4; // fewer distinct logged days than this = "freshStart"
const STRONG_COMPLETION_RATE = 0.75;
const REPEATED_SKIP_THRESHOLD = 3; // same skip reason this many times in the window
const ROUGH_PATCH_SKIP_THRESHOLD = 3; // total skips in the window (no single reason dominating)
const BOUNCING_BACK_LOOKBACK_DAYS = 3; // "prior 3 days" for the bouncing-back check

// Future soft signal: light, optional keyword matching on the intention
// field (e.g. "stressed", "tired") could nudge which prompt gets picked
// within a scenario's pool. Not wired in yet — selectPrompt() below only
// does anti-repeat filtering for now. When this gets added, pass the
// intention text into selectPrompt() and prefer pool entries whose
// `moods` array (see prompts.js) includes the detected mood.

// Self-contained date math (deliberately not shared with HabitsContext.js —
// this module only needs a `todayKey` string handed to it, no other coupling).
function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(dateKey, delta) {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + delta);
  return formatDateKey(date);
}

// Before 6pm, today's own completions are still very incomplete (the day
// isn't over), so analysis anchors on yesterday instead — "the data from the
// day before." At/after 6pm, today is far enough along to fold in, so
// analysis anchors on today itself.
export function isAfterCutover(now = new Date()) {
  return now.getHours() >= CUTOVER_HOUR;
}

export function getReferenceDay(todayKey, now = new Date()) {
  return isAfterCutover(now) ? todayKey : addDays(todayKey, -1);
}

// Did any habit log a status (any status at all) on this day?
function anyHabitLoggedOn(habits, dateKey) {
  return habits.some((habit) => Boolean(habit.log[dateKey]));
}

// Walks backward from referenceDay counting distinct calendar days that have
// any log entry (across any habit), until it either hits FRESH_START_MIN_DAYS
// (enough history — no need to keep scanning) or runs out of plausible
// history to look at. Deliberately not capped to LOOKBACK_DAYS: a long-time
// user who just had a quiet last-7-days shouldn't be misread as brand new.
function countLoggedDaysForFreshStartCheck(habits, referenceDay) {
  const earliestCreatedDate = habits.reduce((earliest, habit) => {
    return !earliest || habit.createdDate < earliest ? habit.createdDate : earliest;
  }, null);

  let loggedDays = 0;
  let cursor = referenceDay;
  // Stop once we've confirmed "enough" history, or we've walked back past
  // the oldest habit's creation date (nothing further back could be logged).
  while (loggedDays < FRESH_START_MIN_DAYS) {
    if (earliestCreatedDate && cursor < earliestCreatedDate) break;
    if (anyHabitLoggedOn(habits, cursor)) loggedDays += 1;
    cursor = addDays(cursor, -1);
  }
  return loggedDays;
}

// Scans every habit's log across the LOOKBACK_DAYS days ending at
// `referenceDay` (inclusive) and summarizes what's been happening, across
// all habits combined. Which day is passed as `referenceDay` — today or
// yesterday — is decided by the 6pm cutover above, not by this function.
export function analyzeHistory(habits, referenceDay) {
  const windowKeys = [];
  for (let i = 0; i < LOOKBACK_DAYS; i += 1) {
    windowKeys.push(addDays(referenceDay, -i));
  }

  let completedDays = 0;
  let skippedDays = 0;
  const skipReasonCounts = {};

  habits.forEach((habit) => {
    windowKeys.forEach((dateKey) => {
      const status = habit.log[dateKey];
      if (!status) return;

      if (status === 'full' || status === 'mini') completedDays += 1;
      if (status === 'skipped') {
        skippedDays += 1;
        const reason = habit.skipReasons?.[dateKey]?.reason;
        if (reason) {
          skipReasonCounts[reason] = (skipReasonCounts[reason] || 0) + 1;
        }
      }
    });
  });

  const totalDays = completedDays + skippedDays;
  const completionRate = totalDays > 0 ? completedDays / totalDays : 0;

  let topSkipReason = null;
  Object.entries(skipReasonCounts).forEach(([reason, count]) => {
    if (!topSkipReason || count > topSkipReason.count) {
      topSkipReason = { reason, count };
    }
  });

  // bouncingBack: did any habit get completed on the reference day itself,
  // and did any habit get skipped on any of the BOUNCING_BACK_LOOKBACK_DAYS
  // days immediately before it? Aggregate across all habits, not "the same
  // habit that skipped is the one that came back."
  const completedOnReferenceDay = habits.some((habit) => {
    const status = habit.log[referenceDay];
    return status === 'full' || status === 'mini';
  });

  const priorDayKeys = [];
  for (let i = 1; i <= BOUNCING_BACK_LOOKBACK_DAYS; i += 1) {
    priorDayKeys.push(addDays(referenceDay, -i));
  }
  const skippedInPriorThreeDays = habits.some((habit) =>
    priorDayKeys.some((dateKey) => habit.log[dateKey] === 'skipped')
  );

  const loggedDaysForFreshStart = countLoggedDaysForFreshStartCheck(habits, referenceDay);

  return {
    totalDays,
    completedDays,
    skippedDays,
    completionRate,
    topSkipReason,
    completedOnReferenceDay,
    skippedInPriorThreeDays,
    hasEnoughHistory: loggedDaysForFreshStart >= FRESH_START_MIN_DAYS,
  };
}

// The rules cascade — first match wins. Order matters, and matches the
// priority list this was specced against:
//   1. repeatedSkips  2. bouncingBack  3. roughPatch
//   4. strongWeek     5. freshStart    6. neutral (default)
export function classifyScenario(stats) {
  if (stats.topSkipReason && stats.topSkipReason.count >= REPEATED_SKIP_THRESHOLD) {
    return 'repeatedSkips';
  }
  if (stats.completedOnReferenceDay && stats.skippedInPriorThreeDays) {
    return 'bouncingBack';
  }
  if (stats.skippedDays >= ROUGH_PATCH_SKIP_THRESHOLD) {
    return 'roughPatch';
  }
  if (stats.completionRate >= STRONG_COMPLETION_RATE) {
    return 'strongWeek';
  }
  if (!stats.hasEnoughHistory) {
    return 'freshStart';
  }
  return 'neutral';
}

export function findPromptById(scenario, promptId) {
  const pool = PROMPT_POOLS[scenario];
  if (!pool) return null;
  return pool.find((prompt) => prompt.id === promptId) || null;
}

// Picks a prompt from the scenario's pool, excluding any ids in `excludeIds`
// (the last 2 prompts shown for this specific scenario). Falls back to the
// full pool if excluding those would leave nothing to pick from, and falls
// back to the `neutral` pool if a scenario's pool is ever empty (e.g.
// mid-edit).
export function selectPrompt(scenario, excludeIds = []) {
  const pool = PROMPT_POOLS[scenario]?.length > 0 ? PROMPT_POOLS[scenario] : PROMPT_POOLS.neutral;
  const resolvedScenario = PROMPT_POOLS[scenario]?.length > 0 ? scenario : 'neutral';

  const candidates = pool.filter((prompt) => !excludeIds.includes(prompt.id));
  const finalCandidates = candidates.length > 0 ? candidates : pool;

  const prompt = finalCandidates[Math.floor(Math.random() * finalCandidates.length)];
  return { scenario: resolvedScenario, prompt };
}

// The single entry point a caller needs: history in, today's scenario +
// prompt out. `lastShownByScenario` is a map of scenario -> array of the
// last (up to 2) prompt ids shown for that scenario, used for anti-repeat.
// `now` defaults to the real clock — only ever overridden in tests.
export function getTodaysPrompt({ habits, todayKey, lastShownByScenario = {}, now = new Date() }) {
  const afterCutover = isAfterCutover(now);
  const referenceDay = getReferenceDay(todayKey, now);
  const stats = analyzeHistory(habits, referenceDay);
  const scenario = classifyScenario(stats);
  const excludeIds = lastShownByScenario[scenario] ?? [];
  const selection = selectPrompt(scenario, excludeIds);
  return { ...selection, referenceDay, afterCutover };
}
