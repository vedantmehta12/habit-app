# Habit App — Build State Snapshot

*Last updated: July 23, 2026. This is a running snapshot of where the build actually is. Update it whenever something ships or a decision resolves. When starting a new chat, this doc plus the PRD and the four user interviews should orient Claude fully — but always trust the live repo over this doc if they disagree.*

---

## What this is

An elastic habit tracker for high-agency students / young professionals. Core thesis: **reward showing up in any form instead of binary streaks.** Missing a day should never trigger a shame spiral — there's always a smaller way back in (the mini-habit), and recovery from a miss is treated as a first-class product interaction, not a failure state.

Built by Vedant (rising sophomore, minimal coding experience) as both a real product and a **PM recruiting portfolio piece.** The research → build → iterate loop and the product-judgment decisions matter as much as the shipped app. Built via Claude Code.

**Stack:** React Native + Expo (Expo Router, SDK 54), local-first storage (expo-sqlite/kv-store), PostHog planned for analytics. No backend yet — Supabase deliberately deferred.

---

## Core product thesis (do not drift from this)

- **Elastic compliance beats rigid streaks.** The mini-habit mechanic IS the product, not a feature — it's the one thing that differentiates this from Streaks/Habitica.
- **The streak protects you, the reward rewards you.** Mini completions keep the streak alive and earn resilience points; only full completions drive reward progress. (Decided, may revisit with real usage data.)
- **Journaling and meditation are need-triggered, not daily.** Never put them on a daily streak model — contradicts 4/4 interviews.
- **No social or comparison mechanics, ever.** Directly contraindicated by interview data (Cole).
- **Anti-shame tone everywhere.** Especially in friction capture and journal prompts — supportive, never accusatory.
- **Screen-avoidance is real.** Physical journalers use paper specifically to get off screens; app involvement stays before/after the writing moment, never during.

---

## What's BUILT and working

- **Vertical slice** — create a habit, mark full or mini complete, streak increments. Both binary (yes/no) and numeric (with unit) habit types.
- **Local persistence** — habits, completions, and streaks survive full app close/reopen (expo-sqlite/kv-store).
- **Log-based data model** — each habit has a dated log (`{date: "full" | "mini" | "skipped"}`) instead of a running counter. Streak is computed by walking backward through the log. Includes a one-time migration from the old counter-based format.
- **Backfill on app open** — missed days get retroactively marked "skipped" when the app is next opened (not in real time). Today gets a grace period (streak doesn't drop until the day is actually over).
- **Friction capture** — on a skipped day, a next-morning neutral prompt asks why (no time / low energy / forgot / overwhelmed, plus an optional "Other" free-text). Data collected silently; no pattern report in MVP.
  - Multi-day gaps handled: 1 day → single ask; 2–4 days → choice of one-reason-for-all or per-day; 5+ days → auto single shared reason.
  - Multi-habit queue: prompts shown one habit at a time, with a "Same reason for all remaining" button when multiple habits are queued.
  - **Streak-reveal sequencing fix:** the dropped streak is NOT shown until the user has responded to the friction prompt — so the app asks "what happened?" before it ever shows a zeroed number. (This was a real catch — technically-correct code that was emotionally wrong.)
- **Rules-based journal prompt engine** — classifies the user into one scenario (priority order: repeated same-reason skips → bouncing back → rough patch → strong week → fresh start → neutral default) from their intention text + completion/skip history, then picks a prompt from that scenario's pool, excluding the last 2 shown per scenario. 36 prompts written (6 per scenario, Vedant's own voice). No AI — deliberately a rules engine.
- **Today's intention** — free-text field on home screen, placeholder "ex: be present," daily auto-reset, dismissible nudge if not set.
- **Rewards / unlock system** — set optionally at habit creation. Reward description (free text) + goal with one of three metric types (streak / X% completion over Y days / X total completions). Streak goals track in the habit's own goal period — consecutive days, weeks, or months, not always days. Only full completions count toward reward progress; minis keep the regular streak alive but don't move reward progress up or down — this is a hardcoded default, not a user-facing toggle (see "Mini→reward credit toggle" below, still unbuilt). Local notification at 50% progress, dedicated reward-unlocked screen at 100%. Reward progress shown as a square rounded button on the habit card, tap to view details; hideable per-habit from that view and reversible (a small muted icon takes its place, tap to bring it back). Global toggle (Settings screen) + per-habit toggle — global off overrides all, global on = each habit follows its own.
- **Delete habit** — long-press → confirm dialog → removes habit and its log.
- **Multi-page habit creation (4 steps)** — (1) name + emoji + color, (2) frequency/goal, (3) mini, (4) optional reward. Step indicator + back nav. Header shows the entered habit name instead of "New habit."
- **Mini-habit helpers** — numeric mini prefills at 25% of full target (floored, min 1). Binary mini shows tappable suggestion chips via keyword matching on the habit name (gym→stretch, read→one page, etc.), editable. Framing line: "What's the smallest version that still counts?"
- **Dev time-machine** — `__DEV__`-only debug panel to advance simulated days / jump N days forward, for testing streak/backfill/friction/reward logic without touching the real device clock. **Must be confirmed stripped from production builds before distributing.**
- **Cold-start fix (2026-07-22)** — fresh installs previously rendered the home screen with all buttons inert. Root cause: the journal engine's fresh-start check (`journal/promptEngine.js`) walked backward through history with no habits to bound the walk, so on zero habits it looped forever and froze the JS thread on Home's first render. Fixed with a one-line early return for the zero-habits case. See "Bugs found and fixed" below.

---

## Bugs found and fixed

- **Cold-start JS hang on fresh installs (found 2026-07-22, during a remote usability session).**
  - **Symptom:** on a device with no prior local data, the home screen rendered but no button responded to taps. Text inputs still accepted focus and typing (the intention field, the dev time-machine day field). Metro logs showed a clean bundle and no errors — it failed silently.
  - **Diagnosis path:** text-input focus is handled natively by iOS; `onPress` requires the JS thread. Native interactions working while JS callbacks didn't pointed at a blocked/hung JS thread during init rather than a crash or a touch-blocking overlay.
  - **Root cause:** `countLoggedDaysForFreshStartCheck` walks backward looking for logged days, bounded by the earliest habit's `createdDate`. With zero habits that bound is `null`, which silently disabled the loop's only break condition (`null && ...`) while its increment condition (`habits.some(...)` on an empty array) could also never fire — an infinite synchronous loop, called unconditionally from `JournalPromptCard` on Home's very first render. Fixed with a one-line early return: zero habits means zero possible logged days, so return 0 before the loop instead of relying on its exit conditions.
  - **Why it went undetected:** every prior test ran on a device that already had data. The empty-data path had never been exercised by a real user.
  - **Severity in hindsight:** this would have broken the app for 100% of new installs — i.e. every TestFlight tester.

---

## Testing log

- **Session 1 — sister, in person (July 2026).** Handed her the phone, sat beside her, said nothing. Ran on an install that already had data. Went smoothly; signal collected. *Caveat discovered later: this was not a cold start, so it did not exercise the first-run path.*
- **Session 2 — friend in Boston, remote via Expo Go tunnel (2026-07-22).** App loaded, home screen rendered, no buttons responded. Session aborted. **This session surfaced the cold-start bug** — the first genuine first-run experience any real user had hit. Needs to be re-run once the fix is verified.
  - Follow-up owed: re-book 20 minutes with him. He is already oriented and costs nothing to re-recruit.

---

## Remote testing setup (working, as of 2026-07-22)

For **moderated** remote sessions — the right method while the goal is watching people, not measuring retention.

- **Command:** `caffeinate -i npx expo start --tunnel --go`
  - `--go` forces the Expo Go target (the project has `expo-dev-client` installed, so Expo otherwise defaults to a dev build, which a remote tester can't open).
  - `--tunnel` exposes the dev server publicly; the default `localhost:8081` is LAN-only and unreachable remotely.
  - `caffeinate -i` prevents macOS idle sleep from killing the tunnel mid-session.
- **Optional npm scripts** (in `package.json`): `"start": "expo start --go"` and `"tunnel": "caffeinate -i expo start --tunnel --go"`. Invoke as `npm start` and `npm run tunnel`.
- **Distribution:** wait for `Tunnel ready`, then text the tester the `exp://...exp.direct` link. Links beat QR screenshots. Tester needs Expo Go installed (free, no account).
- **Observation:** tester screen-shares over FaceTime/Zoom. Say nothing, especially at the mini-habit step.
- **Reload remotely:** press `r` in the terminal — faster than talking a tester through the shake-to-open dev menu.

### Known constraints of this setup

- **Requires the dev server live.** Vedant's laptop must stay awake and running the command for the whole session. This supports scheduled moderated sessions only — never send-and-forget or multi-day usage testing.
- **Anonymous tunnel URLs appear stable across restarts** (observed: the same `exp://hzfo0vi-anonymous-8081.exp.direct` returned after restarting). Do not fully rely on this; re-send the link if a session fails to connect.
- **Expo Go only supports the latest Expo SDK version.** As of May 2026 the App Store build of Expo Go was still on SDK 54 (the SDK 55 build was pending Apple approval), which is why this project's SDK 54 works. **If a tester's fresh Expo Go install ever rejects the project, this route is dead** — re-verify before each new tester by deleting and reinstalling Expo Go, then opening the link. On Android, specific older Expo Go versions can be installed from expo.dev/go; on physical iOS devices, only the latest is available.
- **Notifications cannot be trusted in Expo Go.** Remote push was removed from Expo Go on Android in SDK 53 (irrelevant here — this app has no backend and sends no remote push). Local notifications do still work in Expo Go, but background and killed-app behavior can't be fully replicated. **The 50%-reward local notification must be verified on a real dev build, not in an Expo Go session.** If it doesn't fire during a tester session, that is not evidence of a bug.
- The `expo-notifications` warnings printed at every startup are expected noise, not errors.

---

## Decided but NOT yet built / open threads

- **Empty-state regression tests** — **highest priority after the cold-start fix.** Every init function needs a test that runs against a zero-state database: the counter→log migration on an empty DB, backfill with no prior "last opened" date, streak computation on an empty log, intention auto-reset with no prior date. The cold-start bug proved that empty state is the state that never gets tested.
- **`__DEV__` "wipe all local data and reload" button** — add to the existing dev time-machine panel. Makes reproducing a cold start a one-tap operation instead of a delete-and-reinstall cycle. Needed before every future session.
- **Mini→reward credit toggle** — Vedant considered letting users choose whether minis count toward rewards. Recommendation was NOT to build it (asks users to decide about a mechanic they don't understand yet; ship the opinionated default and instrument instead). Currently unresolved — leaning don't-build, validate with data.
- **Onboarding that teaches the mini-habit concept** — flagged as likely the #1 usability finding. A new user currently gets no explanation of what "mini" means or why it matters. High-value, not yet built. *Still unvalidated: the Boston session that would have tested this was aborted by the cold-start bug.*
- **"After unlock" behavior for rewards** — what happens once a reward hits 100%? Reset, set a new goal, or carry on unlocked forever? Noted, not yet decided.
- **Post-MVP / parked:** meditation module (v1.1, branch into hype/calm/reframe), habit stacking/sequencing (Samaira's "system building" insight — strongest v2 differentiator), shopping API for rewards, AI-driven prompts grounded in behavior data (v2, not the cold "type your vibe" version), wellness assistant (v3), home/lock-screen widget (deferred — isolated runtime complexity), OCR/photo journal, Habit Lab, Skill Sprints.

---

## Immediate next steps (the plan)

1. **Verify the cold-start fix on a genuinely wiped install** — delete Expo Go (or erase the simulator) and open cold. Not "it works on my phone."
2. **Write the empty-state regression tests** before building anything new.
3. **Add the `__DEV__` wipe-data button** so step 1 costs one tap next time.
4. **Re-run the Boston session**, plus 3–5 more moderated sessions. Biggest thing to watch: **do people understand the mini-habit step?** (central unvalidated assumption.)
5. **Fix design + build onboarding** informed by real observed friction. Design pass with Claude Design — with a specific brief from what testing surfaced, not vibes.
6. **Pre-launch checklist before ANY real tester installs:**
   - **Open the build on a wiped install and confirm it's fully interactive.** (Added 2026-07-22 — this is the gate that would have caught the cold-start bug.)
   - PostHog wired in, instrumented for the PRD's real questions: mini-toggle usage, friction-reason distribution, reward step fill vs skip, intention-field usage over time, app-open by day 7/14/30.
   - EAS Update configured (so bugs can be hotfixed mid-test without a reinstall).
   - Dev time-machine confirmed stripped from production.
   - Apple Developer account ($99/yr) + TestFlight build.
7. **Distribute to friends/family, then LEAVE IT ALONE for ~2 weeks.** Fix bugs, ship no new features. Measure a stable thing.
8. **Read the data → that's the product/recruiting story.**

**The single question the live test most needs to answer:** do people actually use the mini-habit toggle on bad days, or do they just skip like every other app? The whole thesis rests on this. Instrument so it's answerable cleanly.

**Note on cost:** the $99/yr Apple Developer account is the only unavoidable spend, and it's only required for the unmoderated multi-day iOS test. Moderated sessions via Expo Go are free. Don't pay early; don't cheap out when the retention test arrives.

---

## The four users (grounding for all product decisions)

- **Aadi** — college athlete, physical journaler. Spirals on misses, recovers by "stacking small things" (closest thing to direct mini-habit support). Went analog specifically to stay off his phone.
- **Cole** — high-agency club student. Does NOT spiral — resets cleanly next day. Explicitly dislikes comparison/competitive mechanics ("unhealthy pressure" in a bad headspace).
- **Samaira** — system-builder. "Haven't found success in habit building, found success in system building" (→ habit stacking as v2). Strong screen-avoidance; journals to get off screens.
- **Ram** — young professional. Backfills misses ("makes it up"), conditional self-judgment (only mad when the cause was being tired). Journaling lapsed under busyness, framed as a duty.

Recovery behavior is NOT universal — three distinct patterns (mini/stack, clean reset, backfill). Design for the spiral-prone user as primary, but don't assume everyone spirals.

---

## Working notes for future chats

- **Code questions** ("what does X currently do?") → ask Claude Code with real files, don't have chat-Claude reconstruct from memory.
- **Current Expo/EAS/library behavior** → search, don't answer from training data. This has already mattered twice (Expo Go SDK compatibility, notification support in Expo Go).
- **Push back is wanted.** Off-thesis / unvalidated / scope-creep → say so before implementing. Vedant has a known tendency to expand scope; catching it is part of the job.
- **Test the empty state.** Established the hard way on 2026-07-22.
- This doc lives in the repo and is maintained by Claude Code as part of shipping work (see `CLAUDE.md`). Re-upload it to the Claude project when it has drifted. It doubles as the raw material for the recruiting narrative.
