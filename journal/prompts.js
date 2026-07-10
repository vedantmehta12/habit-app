// Journal prompt pools, grouped by scenario. Edit the `text` on any prompt
// freely — just keep `id` unique and stable, since it's what the anti-repeat
// check (last 2 shown per scenario) tracks against, not the wording itself.
//
// `moods` is an optional per-prompt field reserved for a future soft signal:
// intention-text keyword matching isn't wired into promptEngine.js yet, so
// this field currently has no effect. Once it's wired in, a prompt tagged
// `moods: ['stressed']` etc. would be preferred within its pool when that
// mood is detected. Leave it off entirely for now.

export const PROMPT_POOLS = {
  strongWeek: [
    { id: 'strongWeek-1', text: "What's working in your routine that you want to hold onto?" },
    { id: 'strongWeek-2', text: 'What felt lighter than usual lately?' },
    { id: 'strongWeek-3', text: "What's something you're quietly proud of?" },
    { id: 'strongWeek-4', text: 'Where did your momentum come from this week?' },
    { id: 'strongWeek-5', text: 'What would make the next stretch even better?' },
    { id: 'strongWeek-6', text: "What's a win you haven't fully given yourself credit for?" },
  ],

  roughPatch: [
    { id: 'roughPatch-1', text: "What's taking up the most space in your head today?" },
    { id: 'roughPatch-2', text: "What are you carrying that isn't yours to carry?" },
    { id: 'roughPatch-3', text: "What's the smallest thing that would help you today?" },
    { id: 'roughPatch-4', text: 'If you set the pressure down for a day, what would you do?' },
    { id: 'roughPatch-5', text: "What's one thing that's actually in your hands today?" },
    { id: 'roughPatch-6', text: 'What would you say to a friend sitting where you are?' },
  ],

  bouncingBack: [
    { id: 'bouncingBack-1', text: 'What made today feel possible?' },
    { id: 'bouncingBack-2', text: "What's pulling you forward right now?" },
    { id: 'bouncingBack-3', text: 'What do you want more of from your days?' },
    { id: 'bouncingBack-4', text: "What's one habit you're glad to be doing?" },
    { id: 'bouncingBack-5', text: 'How do you want to treat yourself as you build your routine?' },
    { id: 'bouncingBack-6', text: "What's the next easy step you actually want to take?" },
  ],

  repeatedSkips: [
    { id: 'repeatedSkips-1', text: 'What tends to get in the way when you sit down for your habits?' },
    { id: 'repeatedSkips-2', text: 'If one obstacle in your routine got easier, which would you pick?' },
    { id: 'repeatedSkips-3', text: 'Is it the habit that needs adjusting, or the timing?' },
    { id: 'repeatedSkips-4', text: 'What would make your habits feel lighter to return to?' },
    { id: 'repeatedSkips-5', text: "What's something about your routine you haven't put into words yet?" },
    { id: 'repeatedSkips-6', text: 'What would "good enough" look like on a busy day?' },
  ],

  freshStart: [
    { id: 'freshStart-1', text: 'Why do your habits matter to you right now?' },
    { id: 'freshStart-2', text: 'What does a good version of your routine look like in a week?' },
    { id: 'freshStart-3', text: "What's the one thing about starting you don't want to overthink?" },
    { id: 'freshStart-4', text: 'Who are you building these habits for?' },
    { id: 'freshStart-5', text: "What's your first, easiest move?" },
    { id: 'freshStart-6', text: 'What would make today feel like a real start?' },
  ],

  neutral: [
    { id: 'neutral-1', text: "What's on your mind before you begin?" },
    { id: 'neutral-2', text: 'One word for how you\'re showing up today?' },
    { id: 'neutral-3', text: 'What do you want to remember about today?' },
    { id: 'neutral-4', text: "What's one thing you're noticing today?" },
    { id: 'neutral-5', text: 'What would make today feel worthwhile?' },
    { id: 'neutral-6', text: "What's on your mind that you haven't said out loud yet?" },
  ],
};
