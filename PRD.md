# PRD: Habit App — Final (v1.0, Build-Ready)

## 1. Overview

Participants: Vedant — sole product owner and builder. 4 user interviews completed (Aadi, Cole, Samaira, Ram); 1 additional interview (Kshitij) recommended before v1.1 scoping, not blocking MVP build. Project serves dual purpose: a real product and a PM recruiting portfolio piece.

Status: Discovery complete for MVP scope. All open questions resolved. Ready to build.

Target release: Working MVP by end of summer. Primary success metric is a concrete "research → build → iterate" story for fall PM recruiting, secondarily 5–10 users retained past 30 days.

## 2. Team goals and business objectives

Primary: documented product loop — user research, defined MVP, shipped product, iteration based on real usage — that can be spoken to in PM interviews.

Secondary: retain 5–10 real users past 30 days as informal retention validation.

Non-goal: revenue, fundraising, scale. This is not a startup decision yet.

## 3. Background and strategic fit

Existing habit/journal/meditation tools fail for high-agency users in three consistent ways: binary compliance creates shame spirals when a habit is missed, rigid streak models don't flex with real life, and one-size-fits-all mechanics ignore distinct user recovery behaviors. Across 4 interviews, three distinct recovery patterns emerged (mini-version completion, backfill, no-guilt reset), journaling and meditation showed consistently need-triggered rather than daily usage, and comparison-based mechanics were rejected without exception.

The product thesis: replace binary compliance with elastic compliance. Reward showing up in any form, remove friction from the logging moment, and treat recovery from a miss as a first-class product interaction rather than a failure state.

Strategic fit: this is the technical and product-judgment credibility piece your Optigenix work doesn't cover. It's end-to-end product ownership — problem definition, user research, scoping, building, iterating.

## 4. Assumptions

Mini-habit toggle is the right single recovery mechanic — plausible, directionally supported by Aadi; direct validation pending real usage data. Ship it and watch.

Journaling and meditation are on-demand, not daily rituals — confirmed 4/4 interviews.

App involvement during physical writing undermines screen-free value of analog journaling — confirmed 2/4 explicitly, 0 contradicting. Mitigation: all app interaction before or after writing, never during.

Reward mechanics must be self-referential only — confirmed 2/4 explicitly, 0 contradicting.

Setting a reward at habit creation anchors motivation at the moment of commitment — design assumption, unvalidated (later interview confirmed appetite for the mechanic itself). Watch whether users actually fill it in during onboarding or skip it.

Daily intention reset creates a useful morning ritual touch point — design assumption. Watch whether users set it daily or treat it as a one-time input and ignore it.

Quit habits behave differently enough from build habits that they require separate design — reason for exclusion from MVP, not a validated finding. Revisit in v1.1.

## 5. User research synthesis

4 interviews completed: Aadi (college athlete, physical journaler), Cole (high-agency club student, resilient recovery type), Samaira (system-builder, strong screen-avoidance motivation), Ram (young professional, conditional self-judgment, backfill recovery type).

Key confirmed findings:
- Spiral pattern on missed habits is real but not universal — Aadi spirals, Cole resets cleanly, Ram feels conditional guilt, Samaira uses systems not habits. Design for the spiral-prone user as primary, don't assume universal.
- Screen-avoidance is an active motivation for physical journalers, not a neutral preference. Samaira journals specifically to get off screens. Aadi went analog because it "keeps him off his phone." Any app involvement at the writing moment directly undercuts the value prop for this segment.
- No interviewee responded to the "app during physical journaling" question with enthusiasm. Build the journaling module light, validate before investing more.
- Pre-stress state is not uniform — users need hype, calm, or reframe depending on context. A single generic meditation track serves nobody. Reason meditation is cut from MVP.
- Comparison mechanics are a hard no — Cole explicitly flagged competitive features as harmful in a bad headspace. Zero contradicting data.
- Rewards/unlock mechanic later validated directly in a follow-up interview: user engaged with the idea of a progress notification at 50% toward a self-set goal.

## 6. Decisions log

Recovery mechanic: mini-habit toggle only. No backfill in MVP. Rationale: backfill implicitly rewards procrastination; can't meaningfully backfill time-based habits like sleep; simpler data model. Watch whether users find workarounds — that's the v1.1 signal.

Prompt delivery: in-app "today's prompt" card on open. No ambient timer, no screen interaction during writing. Entry complete tap afterward.

Intention field: free-text, daily auto-reset at midnight, placeholder "ex: be present" in light gray, persists on home screen throughout the day as a passive reminder. Gentle nudge if app is opened without setting one.

Rewards: set at habit creation as part of habit setup flow. User defines the reward, the metric type (streak / completion count / percentage over time period), and the target value. 50% progress triggers push notification. 100% surfaces a dedicated reward unlocked screen. No social visibility. Shopping API integration is a future-stage feature, not on the roadmap.

Habit type: build habits only in MVP. Quit habits have fundamentally different mini-habit logic and introduce relapse management UX that's out of scope.

Habit input type: binary complete/incomplete for effort-based habits (meditate, journal, read); numeric value entry for measurable habits (glasses of water, pages read, minutes of exercise). Mini version for numeric habits is a user-defined lower threshold set at creation.

Time range: morning / afternoon / evening tagging per habit. Surfaces habits in the right daily context.

Meditation module: cut from MVP. Ship as v1.1 after proving retention on core tracker. When it ships, branch into hype / calm / reframe modes — minimum 3 distinct tracks, not one generic audio file.

## 7. MVP feature scope

**Elastic habit tracker**
Each habit has a full version and a mini version, both defined at creation. Streak logic counts mini completions as streak-preserving. Full and mini completions tracked separately in the data model. Lock-screen/home-screen widget deferred (see non-goals) — build the in-app logging flow first.

Habit creation inputs: name, emoji, color, description (optional), habit type (build only), goal period (daily/weekly/monthly), goal value (binary or numeric with unit), mini version (binary alternate description or numeric lower threshold), time range, task days, reminders, reward setup (reward description, metric type, target value).

**Friction capture**
On any skip, one-tap reason selection: no time / low energy / forgot / overwhelmed. No free text. Data collected silently in MVP — no pattern report until v1.1. Following morning, on first app open, a brief neutral pop-up surfaces the previous day's skipped habit and logged reason.

**Journal prompt engine**
Today's prompt card surfaces on app open, earlier in the day — not at the writing moment. No timer, no ambient audio, no screen interaction during physical journaling. Single "entry complete" tap afterward logs the habit. Minimum 30 prompts at launch to avoid repetition over a 30-day retention window.

**Today's intention**
Free-text field on home screen. Placeholder "ex: be present" in light gray. Auto-resets daily at midnight. Persists as a passive reminder throughout the day. Gentle, dismissible nudge if not set.

**Rewards / unlock system**
Set at habit creation. Reward description (free text), metric type (streak / total completions / percentage over time period), target value. Push notification at 50% progress. Dedicated reward-unlocked screen at 100%. Shopping API integration is future scope, not current.

**Momentum score**
Self-referential only. Resilience points for mini completions. Personal streak and completion history. No social layer of any kind.

## 8. What we're not building

- Quit habits — different UX problem, unvalidated, out of scope
- Meditation module — v1.1 after retention baseline is proven
- Social or comparison features — hard no from interview data
- Daily streak model for journaling/meditation — contradicts 4/4 interviews
- Any screen interaction during physical writing moment
- Habit stacking/sequencing — strongest v2 differentiator in the data, needs dedicated interview round first
- Pattern report in MVP — collect friction data, surface insights only once volume exists
- Shopping API integration — future monetization lever
- OCR, photo journal archiving, Habit Lab, Skill Sprints, chart type selection, Apple Health integration, habit grouping — unvalidated or out of scope for a summer build
- Wellness assistant — v3 idea requiring a real user base and usage data to do anything useful
- Home screen/lock screen widget — genuinely more feasible now than before, but adds real complexity (isolated runtime, no React state access). Build after the core app is stable and tested, not in the first build pass.
