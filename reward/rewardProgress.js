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

function isCompleted(status) {
  return status === 'full' || status === 'mini';
}

// Percentage metric's denominator is the goal's own window size (Y days),
// not however long the habit has existed — days before the habit was
// created simply have no log entry and correctly count as not-completed,
// same as any other day nothing was logged. This is the literal reading of
// "completion rate over the window": a fixed Y-day period ending today.
function countCompletedInWindow(log, todayKey, windowDays) {
  let count = 0;
  for (let i = 0; i < windowDays; i += 1) {
    const key = addDays(todayKey, -i);
    if (isCompleted(log[key])) count += 1;
  }
  return count;
}

function countAllTimeCompletions(log) {
  return Object.values(log).filter(isCompleted).length;
}

// Returns null if the habit has no reward goal at all. Otherwise:
// { metricType, current, target, ratio, progress, isUnlocked }
// - `ratio` is the raw, uncapped current/target fraction
// - `progress` is `ratio` clamped to [0, 1] — what the UI should render
// - `current`/`target` are metric-specific numbers meant for display
//   (e.g. for 'percentage', both are already expressed as whole percentages)
export function getRewardProgress({ habit, todayKey, currentStreak }) {
  const goal = habit.reward?.goal;
  if (!goal) return null;

  let current;
  let target;
  let ratio;

  if (goal.metricType === 'streak') {
    current = currentStreak;
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
  };
}
