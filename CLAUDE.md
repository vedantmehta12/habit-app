# Habit App

## What this is
An elastic habit tracker for high-agency students/young professionals. Core thesis: reward showing up in any form instead of binary streaks, keep journaling/meditation on-demand rather than daily-tracked, and never use social/comparison mechanics. Built by a solo founder as both a real product and a PM recruiting portfolio project — the research, tradeoffs, and reasoning matter as much as the shipped app.

Full product spec, user research findings, and decision rationale: see PRD.md. Read it when scoping a new feature, resolving an ambiguous requirement, or before touching the data model — not needed for routine implementation tasks.

## Tech stack
- React Native + Expo (Expo Router)
- Supabase (Postgres + Auth) — not wired up yet, currently building with local React state
- PostHog for analytics — not yet integrated

## Current build phase
Building a thin vertical slice first: one habit, create it, mark full/mini complete, see it reflected. No auth, no backend yet. Add features one at a time after that loop works end to end on device via Expo Go.

## Explicit non-goals — do not build without discussion first
- Quit-type habits — build-type only for now
- Social or comparison features of any kind
- Daily streak tracking on journaling/meditation — on-demand only
- Ambient timer or any screen interaction during physical journaling
- Home screen/lock screen widget — deferred until core app is stable
- OCR/photo journal archiving, Habit Lab, Skill Sprints, shopping API, wellness assistant — out of scope

## Working agreement
- I have minimal coding experience — explain non-obvious choices in plain language as you make them, don't assume I'll catch subtle issues in a diff
- Make minimal, scoped changes — don't refactor or restructure files beyond what was asked
- One feature per commit, with a clear message
- If a request is ambiguous or could be built two reasonable ways, ask or state the assumption before writing code
- Don't add new dependencies without flagging it first
