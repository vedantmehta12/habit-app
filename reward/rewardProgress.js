// Pure reward-progress math — no RN dependencies, so it can be exercised
// with plain Node scripts the same way journal/promptEngine.js is.

// Self-contained date math (same reasoning as journal/promptEngine.js:
// this module only needs a `todayKey` string, no coupling to HabitsContext).
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

// Only 'full' counts toward reward progress — 'mini' keeps the regular
// day-based streak (HabitsContext.js's getCurrentStreak) alive but is
// deliberately neutral here: it never moves a reward metric up (it's not a
// qualifying completion) or down (it's treated exactly like a day nothing
// was logged at all, not like a broken commitment).
function isFullCompletion(status) {
  return status === 'full';
}

// Maps a habit's goalPeriod to the unit its streak should be measured and
// displayed in. Habits saved before goalPeriod existed (or any unrecognized
// value) fall back to 'day', matching the original day-based behavior.
export function getPeriodUnit(goalPeriod) {
  if (goalPeriod === 'weekly') return 'week';
  if (goalPeriod === 'monthly') return 'month';
  return 'day';
}

// Sunday-start calendar week containing dateKey.
function getWeekStart(dateKey) {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() - date.getDay());
  return formatDateKey(date);
}

// First-of-month containing dateKey.
function getMonthStart(dateKey) {
  const date = parseDateKey(dateKey);
  date.setDate(1);
  return formatDateKey(date);
}

function getPeriodStart(dateKey, periodUnit) {
  if (periodUnit === 'month') return getMonthStart(dateKey);
  if (periodUnit === 'week') return getWeekStart(dateKey);
  return dateKey; // day — the period *is* the day itself
}

function getPreviousPeriodStart(periodStartKey, periodUnit) {
  if (periodUnit === 'month') {
    const date = parseDateKey(periodStartKey);
    date.setMonth(date.getMonth() - 1);
    return formatDateKey(date);
  }
  if (periodUnit === 'week') return addDays(periodStartKey, -7);
  return addDays(periodStartKey, -1);
}

function getPeriodEnd(periodStartKey, periodUnit) {
  if (periodUnit === 'month') {
    const date = parseDateKey(periodStartKey);
    date.setMonth(date.getMonth() + 1);
    date.setDate(date.getDate() - 1);
    return formatDateKey(date);
  }
  if (periodUnit === 'week') return addDays(periodStartKey, 6);
  return periodStartKey;
}

// True if the period contains at least one 'full' day. A period with only
// mini completions (or nothing at all) behaves identically here — mini
// doesn't earn the period, but it also isn't singled out as worse than an
// empty period.
function periodHasCompletion(log, periodStartKey, periodUnit) {
  const endKey = getPeriodEnd(periodStartKey, periodUnit);
  let cursor = periodStartKey;
  while (cursor <= endKey) {
    if (isFullCompletion(log[cursor])) return true;
    cursor = addDays(cursor, 1);
  }
  return false;
}

// Same walk-backward-until-the-first-gap shape as HabitsContext.js's
// day-based getCurrentStreak: the period containing `todayKey` only counts
// if it already has a qualifying (full) completion — an in-progress
// week/month with nothing logged yet doesn't break the streak, it just
// doesn't count yet — then every consecutive period before that must have
// at least one full completion.
function getConsecutivePeriodStreak(log, todayKey, periodUnit) {
  let streak = 0;
  let cursorStart = getPeriodStart(todayKey, periodUnit);

  if (periodHasCompletion(log, cursorStart, periodUnit)) {
    streak += 1;
  }
  cursorStart = getPreviousPeriodStart(cursorStart, periodUnit);

  while (periodHasCompletion(log, cursorStart, periodUnit)) {
    streak += 1;
    cursorStart = getPreviousPeriodStart(cursorStart, periodUnit);
  }

  return streak;
}

// Percentage metric's denominator is the goal's own window size (Y days),
// not however long the habit has existed — days before the habit was
// created simply have no log entry and correctly count as not-completed,
// same as any other day nothing was logged. This is the literal reading of
// "completion rate over the window": a fixed Y-day period ending today.
// Only 'full' days add to the numerator — a 'mini' day counts the same as
// an unlogged day here, neither helping nor hurting the rate.
function countCompletedInWindow(log, todayKey, windowDays) {
  let count = 0;
  for (let i = 0; i < windowDays; i += 1) {
    const key = addDays(todayKey, -i);
    if (isFullCompletion(log[key])) count += 1;
  }
  return count;
}

function countAllTimeCompletions(log) {
  return Object.values(log).filter(isFullCompletion).length;
}

// Daily-goalPeriod counterpart to getConsecutivePeriodStreak — same
// walk-backward-until-the-first-gap shape as HabitsContext.js's
// getCurrentStreak, but requiring 'full' specifically. A 'mini' day is
// treated exactly like an unlogged day: today's mini doesn't break
// yesterday's chain (today never breaks the walk backward, same special
// case as the regular streak), but a past mini day does end the walk,
// same as a past gap would — it's just not a qualifying day, not a penalty.
function getFullOnlyDailyStreak(log, todayKey) {
  let streak = 0;
  let cursorKey = todayKey;

  if (log[cursorKey] === 'full') {
    streak += 1;
  }
  cursorKey = addDays(cursorKey, -1);

  while (log[cursorKey] === 'full') {
    streak += 1;
    cursorKey = addDays(cursorKey, -1);
  }

  return streak;
}

// Returns null if the habit has no reward goal at all. Otherwise:
// { metricType, current, target, ratio, progress, isUnlocked, periodUnit }
// - `ratio` is the raw, uncapped current/target fraction
// - `progress` is `ratio` clamped to [0, 1] — what the UI should render
// - `current`/`target` are metric-specific numbers meant for display
//   (e.g. for 'percentage', both are already expressed as whole percentages)
// - `periodUnit` ('day' | 'week' | 'month') only applies to the 'streak'
//   metric — it's the display unit for `current`/`target`, driven by the
//   habit's goalPeriod. The goal's target value is still stored under the
//   field name `targetDays` regardless of unit (kept as-is to avoid
//   breaking already-created habits' saved data — it just means "target
//   periods" now).
// Note this deliberately does *not* take the regular day-based streak
// (HabitsContext.js's getCurrentStreak, which counts 'full' and 'mini') as
// an input — reward progress always derives its own full-only numbers, since
// the two are meant to disagree whenever mini completions are involved.
export function getRewardProgress({ habit, todayKey }) {
  const goal = habit.reward?.goal;
  if (!goal) return null;

  let current;
  let target;
  let ratio;
  let periodUnit;

  if (goal.metricType === 'streak') {
    periodUnit = getPeriodUnit(habit.goalPeriod);
    current =
      periodUnit === 'day'
        ? getFullOnlyDailyStreak(habit.log, todayKey)
        : getConsecutivePeriodStreak(habit.log, todayKey, periodUnit);
    target = goal.targetDays;
    ratio = target > 0 ? current / target : 0;
  } else if (goal.metricType === 'percentage') {
    const completedInWindow = countCompletedInWindow(habit.log, todayKey, goal.windowDays);
    const actualRate = goal.windowDays > 0 ? completedInWindow / goal.windowDays : 0;
    current = Math.round(actualRate * 100);
    target = goal.targetPercentage;
    ratio = target > 0 ? actualRate / (target / 100) : 0;
  } else if (goal.metricType === 'total') {
    current = countAllTimeCompletions(habit.log);
    target = goal.targetCount;
    ratio = target > 0 ? current / target : 0;
  } else {
    return null;
  }

  const progress = Math.min(Math.max(ratio, 0), 1);

  return {
    metricType: goal.metricType,
    current,
    target,
    ratio,
    progress,
    isUnlocked: ratio >= 1,
    periodUnit,
  };
}
