# Backlog: future features

These features were decided on but deliberately **not built yet**. Following `docs/v3-migration-plan.md` D8, the code has
no stubs, placeholders or "coming soon" UI for them. Each entry says what the feature needs and where to recover any old
code from git.

## Robot evolution on tracks
**Decided:** 2026-10-21. Track phases should unlock robot forms. The order is builder → rover → gardener → orb → cat,
one per phase; confirm it when this is built.

**Background.**
- Before the cleanup, only the general lessons (`LearnScreen`, V1) could evolve the robot. Each phase in a `lessons_*.json`
  file could name an `unlocksForm`, and only phase 1 did (`builder`).
- Finishing that phase ran `useAppStore.completeLesson`, which unlocked and equipped the form and set `pendingEvolution`.
  `LearnScreen` then opened `EvolutionScreen` once the lesson screen closed.
- Track lessons only call `creditTrack` (bolts and streak), so track learners never evolved.
- The cleanup (plan step 3.1) deletes that trigger and `EvolutionScreen`, and keeps `ROBOT_FORMS`, `currentForm`,
  `unlockedForms` and `equip`.

**To build it:**
1. Track files: add `unlocksForm?: RobotForm` per phase, and add it to the `TrackPhase` type (the TRACKS registry may
   instead own the order).
2. When `phaseComplete` turns true for a phase with a form the learner doesn't own (check in `useFinishRun` after
   `track.record`), add it to `unlockedForms`, set `currentForm`, and queue the evolution.
3. Show the evolution screen after the checkpoint result closes. Use the same pattern as before: a pending value in the
   store, read by the track path screen's `useFocusEffect`.
4. Step 3.1 also removes choosing a form: `unlockedForms`, `currentForm`, `equip`, `ROBOT_FORMS`/`ROBOT_NAMES` and the
   pictures for builder, rover, gardener, orb and cat. Restore those, then show the locked forms in the Workshop with how
   to earn each one. Profile: bring back the "Hatched" badge.
5. Recover the old screen with `git show <step-3.1 commit>^:src/screens/EvolutionScreen.tsx`, and the other files and
   pictures the same way. Fill in the hash when step 3.1 lands: `TBD`.

## AI chat on questions (`ai_context`)
**Decided:** 2026-10-21. V3 questions came with an `ai_context` field for a future "ask about this question" chat.
Nothing read it, so plan step 2a.0 strips it from the content.
To build it later:
- Design the chat.
- Decide what context each question needs; it can usually be derived from `ask`, `code`, `options` and
  `explanation_after_check`.
- Recover the old field values with `git show <step-2a.0 commit>^:assets/content/<file>`. Hash: `TBD`.

## Workshop parts
The Workshop showed antennas (always unlocked) and wheels and hands (locked; nothing ever unlocked them). Step 3.1
removes the Parts section and the `antennas`/`wheels`/`hands` pictures. The Workshop tab stays as a page that only shows
the robot.
To build this later:
- Decide what earns each part (for example, a phase or a badge).
- Store the unlocked parts in progress.
- Show them in the Workshop again.
- Recover the pictures with `git show <step-3.1 commit>^:assets/images/<name>_updated.png`.

## Paywall / Premium
**Decided:** 2026-10-21. Removed in plan step 1b, because no real paywall was integrated (`isPremium` gated nothing).
To build it later:
- Decide what Premium unlocks.
- Re-add RevenueCat (`react-native-purchases`; it needs a development build, not Expo Go).
- Gate the content in the TRACKS registry or path screen.
- Recover the old `src/components/PaywallOverlay.tsx` and `src/services/purchases.ts` with
  `git show 5282c9b:<path>` (the commit before step 1b).

## Mini-games (loop games and stage labs)
**Decided:** 2026-10-22 (plan 2b.0). Deleted in step 2b.3; nobody could reach them, so nothing was lost.

**What they were.** One loop game and one stage lab per field, added to the V1 general lessons by
`addingGames` in `services/gameCatalog.ts`:

| Field | Loop game (added to phase 2) | Stage lab (an extra phase at the end, 5 parts) |
|---|---|---|
| Healthcare | Water the plant (`loop_plant`) | GC content lab (`stage_gc`) |
| Engineering | Spin the wheel (`loop_wheel`) | Duty cycle lab (`stage_duty`) |
| Business & finance | Invest each cycle (`loop_fund`) | Conversion lab (`stage_conversion`) |

The loop games played a loop back step by step; the stage labs built one small program over 5 parts. They only ran in
`GameLessonScreen` on the V1 path, and only for those three fields with Python, which had tracks long before 2b.3, so no
learner ever saw them.

**To build it:** decide where a game sits in a V3 track (a lesson item type, or a bonus after a phase), add it to the
track file and the TRACKS lookup, and play it inside `TrackFlowScreen` so stars and bolts use the track store. Recover
the old code from commit `8c16fa1` (the last commit that has it):
`src/screens/GameLessonScreen.tsx`, `src/screens/games/LoopGame.tsx`, `src/screens/games/StageGame.tsx`,
`src/services/gameCatalog.ts`, and `money` in `src/utils/codeJoin.ts`, for example
`git show 8c16fa1:src/screens/games/LoopGame.tsx`.
