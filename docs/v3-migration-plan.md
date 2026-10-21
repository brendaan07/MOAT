# MOAT: plan to make V3 the only lesson format, then clean up the code

Written 2026-10-21, from an audit of branch `v3` at commit `d19aad1`.

Each step below is meant for **one agent session, run in order**, with a check after every step. An agent doing a step
should read **§0 (rules)**, **§1 (how the app works today)** and **its own step**, and touch nothing that belongs to
another step. If a step finds work that belongs to a later step, it writes it under "Notes for later steps" (§8) and leaves
it alone.

---

## 0. Rules for every step

### Branch and commits
- All work happens on one branch, **`v3-cleanup`**, cut from `v3`. Step 1 creates it. Every later step starts by checking
  that it is on `v3-cleanup` and that the working tree is clean (`git status`). If not, stop and ask the user.
- Commit **once per step or sub-step** (for example `2a.1`), with the message
  `Step <id>: <what changed>` plus the attribution lines from the session's instructions. **Never push.**
- Commit only files the step meant to change. Never `git stash`, `git reset --hard` or switch branches.

### Checks that must pass at the end of every step
1. `npx tsc --noEmit` reports **0 errors**. Before step 1 runs, the only errors are in the three stray root files.
2. `npm run build:web` succeeds and writes `dist/` (`dist/` is ignored by git).
3. **Web preview smoke test.** Start the `web` server from `.claude/launch.json` (port 8081, using the preview tool, not
   Bash), then do this for every combination the step touched, plus Biology R as a regression check:
   - Pick the combination. Either use Profile → reset and redo onboarding, or set saved progress in the browser console
     and reload:
     ```js
     const p = JSON.parse(localStorage.getItem('moat.progress.v1') || '{}');
     localStorage.setItem('moat.progress.v1', JSON.stringify({ ...p, hasOnboarded: true, studyArea: 'Engineering', language: 'Python' }));
     localStorage.removeItem('moat.track.v1'); // fresh track progress, so the first lesson is open
     location.reload();
     ```
   - The Learn tab shows the right path. Open lesson 1 and play it to the recap (wrong answers too, so the wrong-option
     pictures show). Check that bolts go up and there are **no console errors** (`read_console_messages`).
   - For checkpoint work: finish every lesson in phase 1 (setting `moat.track.v1` by hand is fine, see §1.5), then open
     the checkpoint and finish it. The phase 2 banner must unlock only at full stars.
   - Take a screenshot as proof.
4. **Content steps also run the content validator** (`scripts/validate-content.mjs`, written in step 2a.0) with 0 errors.
5. In the final message, report: what changed, the check results, anything not verified, and the commit hash.

### Combinations to know
| Study area | Language | Learn tab today | Content |
|---|---|---|---|
| Biology research | always R | track | `track_bio_r_updated.json` + `biology_r_v3.json` (+ V2 for P3 L1–L4) |
| Engineering | Python | track | `track_eng_py.json` + V2 `track_lessons_v2_more.json` |
| Healthcare | Python / R | track | `track_hx_py.json` / `track_hx_r.json` + `healthcare_*_v3.json` |
| Business & finance | Python | track | `track_fin_py.json` + `finance_python_v3.json` |
| Physics & maths, Arts & humanities, General | Python | general lessons | `lessons_<area>.json` (V1) |
| any area without a track for that language | R, SQL, JavaScript, MATLAB, Java | general lessons | `lessons_<language>.json` (V1) |

---

## 1. How the app works today (reference)

### 1.1 Two kinds of Learn tab
`src/navigation/MainTabs_updated.tsx` calls `hasTrack(studyArea, language)`:
- **true**: the Learn tab is `TrackPathScreen_updated` (project track; progress in `useTrackStore_updated`, saved under
  AsyncStorage key `moat.track.v1`).
- **false**: the Learn tab is `LearnScreen` (general lessons; progress in `useAppStore`, key `moat.progress.v1`). Only this
  path has:
  - **The Premium upsell on later phases.** A phase whose first lesson isn't open yet is dimmed. Tapping it, or its
    banner, opens the Premium paywall (`store.openPaywall('premium')`).
    - It isn't a real paywall: `isPremium` is never checked anywhere, so buying Premium unlocks nothing.
    - The phase still opens once the lessons before it are done.
  - **Robot evolution.** Finishing every lesson in a phase with `unlocksForm` adds that form to `unlockedForms`, sets
    `currentForm` and shows `EvolutionScreen` (`useAppStore.completeLesson` → `pendingEvolution` → `LearnScreen`'s
    `useFocusEffect`).
    - Only phase 1 of each `lessons_*.json` has an `unlocksForm` (`builder`), so the other forms (rover, gardener, orb,
      cat) are never unlocked anywhere.
    - Track learners never evolve: `creditTrack` adds bolts and the streak only. Yet the Workshop, the Profile "Hatched"
      badge and every track screen's robot read `unlockedForms`/`currentForm`.
  - **The mini-games** (`lesson.game` → `GameLessonScreen`).

### 1.2 The three lesson formats
| Format | Data | Player | Used by |
|---|---|---|---|
| **V1 general** | `assets/content/lessons_*.json` (`Course` → phases → lessons → questions of kind `choice`, `build`, `judge`, `bug`, `match`) | `src/screens/LessonScreen.tsx` | all general lessons |
| **V1 track** | `questions` inside `track_*.json` (kinds `order`/plan, code, predict, debug, build) | `src/screens/track/TrackPlayer.tsx` + `TrackResults.tsx` | **Biology phase checkpoints** (`bio_p{n}_cp`) |
| **V2** | flat `lessons[]` in `track_bio_r_lessons_v2.json` and `track_lessons_v2_more.json` | `LessonPlayerV2` in `src/components/lessonKitV2_updated.tsx`, pictures in `src/components/picturesV2.tsx` | Engineering (all), Biology P3 L1–L4 |
| **V3** | `biology_r_v3.json`, `healthcare_python_v3.json`, `healthcare_r_v3.json`, `finance_python_v3.json` | the same `LessonPlayerV2`, after `fromV3()` converts it; pictures in `src/components/picturesV3.tsx`, images in `src/utils/imageMapV3.ts` | Biology (except P3 L1–L4 and the checkpoints), Healthcare, Finance |

### 1.3 How a V3 track is put together
1. `src/utils/content_updated.ts` `CONTENT` registers each JSON file by name.
2. `trackFileFor()` in `src/services/contentLoader_updated.ts` picks the **track file** (`track_*.json`): the path's
   structure (phases, lesson ids and titles, one `checkpoint` per phase, `code` for "project built", `cycle2`).
3. `loadTrack()` then adds the V3 questions to that structure, so stars and unlocking can count them:
   - `withHealthcareV3()` fills `lesson.questions` and `checkpoint.questions`. Ids are `<itemId>_q<n>`.
   - `withBiologyV3()` **does not fill questions**. Lessons keep stale V1 questions, and L5 gets `[]`. That's a bug:
     `phaseComplete` counts `stars >= questions.length`, so a lesson with `[]` counts as complete without being played.
4. Separately, `lessonKitV2_updated.tsx` imports the same V3 files and builds a `LESSONS` map when the module loads:
   - `fromV3()` builds the app lesson id `${prefix}_p${phase}_${l|c}${part}`.
   - `addV3(data, {prefix, lang, domain, name, phaseCheckpoint})` with `phaseCheckpoint: true` renames the checkpoint to
     `${prefix}_cp${phase}`.
5. `TrackFlowScreen_updated.tsx` is the state machine:
   - `v2Lesson(id)` decides between the new player and `TrackPlayer`.
   - `v2Checkpoint(lessonId)` (regex `_l(\d)$` → `_c$1`) adds a checkpoint after each lesson. This is Finance's
     per-lesson rule.
   - `cpV2 = v2Lesson(phase.checkpoint.id)` uses the new player for the phase checkpoint. Otherwise it falls back to
     `TrackPlayer`.
   - After the last lesson, the checkpoint only follows if `phase.checkpoint.questions.length > 0`.

### 1.4 V3 JSON schema (as used today)
```
{ track: { id, name, language, phases, lessons_per_phase, item_order_rule },
  design?: "assets/content/healthcare_design.json" | {...},         // ignored by the app
  phases: [ { phase: n, title, coding_idea | r_idea, order: [...], items: [Item] } ] }

Item = { id: "XpP1L1" | "XpP1C" | "BioP3L1" | "FpP1C1", type: "lesson" | "checkpoint", part, parts_in_phase?,
         title, person, intro, script_file, start_button, notebook: [{label, value}] (one per question),
         recap: {title, subtitle, celebration}, page_style: "lesson_cream" | checkpoint style,
         questions: [Question], status?: "legacy: ..."  // status present = not rebuilt yet, the app skips it }

Question (predict | fill) = { number, kind, label, ask, xp: 10, known_from_earlier: [], hint_before_check,
         explanation_after_check, takeaway, next_bridge, code_note: {title,text}, science_note: {title,text},
         scene_label, picture: [Picture], worked: [string | {t, c}], code: [lines, "___" marks a fill blank],
         options: [{id: "a".., label, correct, feedback}], option_layout?, display?, ai_context? }
         // the player treats option "a" as correct (fromV3: correct: 'a'), so the right option must have id "a"
Question (fix) = { ..., script_file, lines: [{id, code, given_correct}], buggy_line: "<line id>",
         fixes_by_line: { <lineId>: [{id, replacement, correct, feedback}] }, wrong_line_feedback?, output_after_fix? }

Picture = { type, label, description, args?, options?, assets?, icon_asset?, correct_state,
            states: { idle, correct, wrong_by_option: { <optionId>: state } } }
```
- **Rule:** a lesson has 5 questions. The phase checkpoint is one item `type: "checkpoint"`, `part: 5`, with 5 questions,
  after the phase's 5 lessons (Healthcare `XpP1C`). A checkpoint has no hints, notes or chips, and ends on a green
  confetti recap.
- **Picture renderers** (`PictureV3`):
  - Dedicated renderers: `tiles`, `ratebars`, `dots`, `steps`, `strands`, `thermo`.
  - Anything with `assets.strips` / `assets.device.strips` → `DeviceV3`, a device image whose screen counts up. This needs
    `.webp` strip images.
  - Everything else → `StateCardV3`: an icon from `icon_asset`/`assets`/`TYPE_ICON` plus the caption from `correct_state`
    or the wrong option's state.
  - **New content should use the dedicated types or `StateCardV3` with an existing icon.** A new picture type needs a new
    renderer (code), which goes in the same sub-step as its content.
- **Images:** any file the content names must be registered in `src/utils/imageMapV3.ts` (key = the path as written in the
  JSON). A path that's missing there renders nothing.

### 1.5 Progress, ids and rewards
- `moat.track.v1` = `{ finished: string[], bestStars: {id: n}, paid: string[] (question ids), secondsByDay }`.
- Stars = questions right on the first try. 10 bolts per first-try question (paid only once), +30 for a perfect first
  attempt (`useTrackStore.record`). The bolts are credited with `app.creditTrack`.
- Unlock rules: a lesson opens when the previous one is finished; the checkpoint opens when every lesson in the phase is
  finished; the next phase opens when every lesson **and** the checkpoint have full stars.
- **Changing an id resets that item's saved progress.** Keep existing app ids unless a step says otherwise.

| Track | Lesson ids | Phase checkpoint id |
|---|---|---|
| Biology R | `bio_p{n}_l{k}` | `bio_p{n}_cp` |
| Healthcare | `hx_py_p{n}_l{k}`, `hx_r_…` | `hx_py_cp{n}`, `hx_r_cp{n}` |
| Finance | `fin_py_p{n}_l{k}` (per-lesson checkpoints `fin_py_p1_c{k}`) | `fin_py_cp{n}` (empty today) |
| Engineering (V2) | `EngP1L1`… | `eng_py_cp1`, `eng_py_cp3` (empty) |

---

## 2. Decisions (defaults the steps follow; the user can override)

| # | Question | Default |
|---|---|---|
| D1 | Who writes new V3 content? | The agent writes it, keeping each lesson's style the same as the Healthcare and Biology V3 files. The user reviews each sub-step's lessons before the next sub-step starts. If the user supplies a content pack instead, the agent imports it. |
| D2 | Saved progress when ids change | **Decided (user, 2026-10-21): resets are fine; there are no active users.** Agents may change ids and don't need to migrate saved progress. Keep existing ids anyway where it costs nothing (Biology, Finance). Engineering moves to `eng_py_p{n}_l{k}` / `eng_py_cp{n}`. |
| D3 | Engineering's size | The standard shape: 5 phases × 5 lessons + 1 checkpoint per phase, mirroring Healthcare's skill order (values and arithmetic → text and formatting → decisions → lists and loops → applied calculations). The 5 existing V2 lessons are rebuilt as the matching V3 lessons. |
| D4 | Finance's size | Stays 1 phase in this plan. More phases are new content and outside this plan. |
| D5 | Question kinds | V3 has only `predict`, `fill` and `fix`. V1/V2 `build`, `choice`, `judge`, `match`, `order` and `debug` are rewritten as one of those three. |
| D6 | The general-lesson extras (Premium phase lock, robot evolution, mini-games) | **Decided (user, 2026-10-21):** **Premium/paywall is removed entirely** in step 1b, since no real paywall exists yet and the product stays within its current scope. **Robot evolution on tracks is a future feature**, logged in `docs/backlog.md`. It is not built and has no placeholder code; when the general path goes (3.1), the evolution trigger goes with it (see 3.1). **Mini-games:** delete them, since they can't be reached (2b.0 confirms this). |
| D9 | `ai_context` on V3 questions (for a future chat feature; nothing reads it) | **Decided (user, 2026-10-21): strip it and log the feature.** Removed from every V3 file in step 2a.0; the validator rejects it; new content must not include it. Logged in `docs/backlog.md`. |
| D10 | The Workshop tab after robot forms and locked parts are removed (3.1) | **Decided (user, 2026-10-21): keep the tab, as a page that only shows the robot** (Blob on the world backdrop, with its name). The Forms and Parts sections go, including the antennas card. |
| D8 | Features that are future work | Don't leave stubs, TODO hooks, empty fields or "coming soon" UI for them. Delete code that has no trigger. Record the feature in `docs/backlog.md` with what it needs and the commit to recover old code from (git history is the placeholder). |
| D7 | Checking code answers | Every predict/fill/fix answer is checked by **running its code** and comparing the real output with the marked answer, the `correct_state` and the wrong options. A lesson that claims R prints `66.66667` when R prints `[1] 66.66667` teaches the wrong thing. This matters most for content an agent writes. Python: `python3`. R: installed and checked (R 4.6.1, 2026-10-21) in the conda environment **`moat-r`** (created with `conda create -n moat-r -c conda-forge r-base`). Run R as `conda run -n moat-r Rscript -e '…'`, and check it first with `conda run -n moat-r Rscript --version`. If the environment is missing, ask the user; there's no Homebrew on this machine, and the alternative is the official macOS arm64 installer from CRAN. Without R, the agent reads R answers carefully and lists them as "not run". Put the runner in `scripts/run-answers.mjs` (step 2a.0): it extracts each question's code, runs it, and prints the output beside the marked answer. |

---

## 3. Step 1: delete files that are dead whatever the content (small, safe)

**Goal:** remove files and dependencies nothing uses, so `tsc` passes again. No behaviour changes.

### Tasks
1. `git switch -c v3-cleanup v3`. This plan file (`docs/v3-migration-plan.md`) is untracked on `v3`; it carries over and
   is committed in this step.
2. Delete the stray root copies: `LearnScreen.tsx`, `TrackPathScreen.tsx`, `ui.tsx`. Nothing imports them; the app uses
   `src/…`.
3. Delete `assets/content/track_health_py.json` and `track_health_r.json`, and remove their two entries from `CONTENT` in
   `src/utils/content_updated.ts` (`trackFileFor` never returns them).
4. Delete `assets/content/lessons.json`. It's byte-identical to `lessons_life_sciences.json`. In
   `contentLoader_updated.ts` `loadBundled`, change the final fallback `load('lessons')` to `load('lessons_general')`,
   and remove the `"lessons"` entry from `CONTENT`.
5. Delete `assets/content/lessons_computing.json` and its `CONTENT` entry. `canonicalArea('Computing')` returns `General`,
   so the file can't be reached.
6. `package.json`: remove `@react-native-community/slider` (no imports) and `@types/react-native` (React Native 0.86
   ships its own types). Run `npm install` so `package-lock.json` matches.
7. `git mv` the root docs into `docs/`: `HANDOFF_healthcare_v3.md`, `INTEGRATION_moat4new.md`,
   `TESTING_playwright-cli.md`. Fix any links to them, for example in `README.md`.
8. In `README.md`, delete the paragraph about "three files at the project root … older stray copies".

### Don't
- Rename `_updated` files, move code, or touch V2 content or images (that's step 3).

### Done when
- §0 checks pass. Smoke test Biology R, Healthcare Python and General + Python (the general path and its fallback).
- One commit: `Step 1: remove dead files and dependencies, move docs`. `docs/backlog.md` is committed here too.

---

## 3b. Step 1b: remove the paywall and RevenueCat (D6)

**Goal:** no Premium, paywall or purchase code is left. Nothing in the app checks `isPremium`, so no learner loses access
to anything.

### Tasks
1. Delete `src/components/PaywallOverlay.tsx` (Premium and Expert tiers, confetti, purchase buttons) and
   `src/services/purchases.ts` (the RevenueCat wrapper).
2. Remove `react-native-purchases` from `package.json`, and run `npm install`. Check that `app.json` has no RevenueCat
   plugin entry.
3. `src/hooks/useAppStore.tsx`: remove
   - the `PurchasesOffering`/`PurchasesPackage` import and `PurchasesService`
   - the `PaywallTier` type
   - `showPaywall`, `paywallTier`, `isPremium`, `currentOffering`
   - `openPaywall`, `closePaywall`, `loadOffering`, `purchase`, `restorePurchases`
   - the RevenueCat `useEffect`, and their entries in the context type and value
4. `src/navigation/RootNavigator.tsx`: remove the `PaywallOverlay` import and `{store.showPaywall && <PaywallOverlay />}`.
5. `src/screens/ProfileScreen.tsx`: remove the "Subscriptions" button.
6. `src/screens/LearnScreen.tsx` (the general path, still live until 2b.3):
   - Remove `openPremium` and the paywall taps on locked lessons and banners. A locked lesson or banner simply does
     nothing when tapped, like a locked track lesson.
   - Replace the banner's "Premium" label and lock with the same locked look the track path uses.
7. `src/utils/theme.ts`: rename `premiumBand`/`premiumText` to `lockedBand`/`lockedText`. `TrackPathScreen_updated.tsx`
   uses them for locked phase banners and the Cycle 2 card. Update every use.
8. `README.md`: remove the RevenueCat rows (Swift mapping table, feature checklist "Paywall"), the "Expo Go compatibility"
   section about Preview API Mode and development builds for purchases, and the `expo-blur` "Paywall blur" row if
   `expo-blur` is no longer used. If `expo-blur` has no other importer, remove the dependency too.
9. Check: `rg -i "paywall|premium|purchase|revenuecat|offering" src README.md package.json` finds nothing except
   `lockedBand`-style renames.

### Done when
- §0 checks pass. Smoke test Healthcare Python (locked phase banners look the same) and General + Python (a locked phase
  dims, and tapping it does nothing and shows no error). The Profile tab has no Subscriptions button.
- Commit `Step 1b: remove the paywall and RevenueCat`.

---

## 4. Step 2a: V3 content for the tracks

Run the sub-steps in this order, **one session each**. Each one ends with the user reviewing the content (D1).

### 2a.0 Prepare: one generic V3 hookup, and a content validator
Small code changes that every content sub-step relies on. No content changes.

1. **Make the V3 question fill generic.**
   - Replace `withHealthcareV3` and `withBiologyV3` in `contentLoader_updated.ts` with one `withV3(track, v3File, prefix,
     checkpointId)`.
   - It fills `lesson.questions` for every V3 lesson item that has no `status`, and fills `phase.checkpoint.questions`
     from the phase's `type: "checkpoint"` item. Use the same question ids the player records (`<appItemId>_q<n>`).
   - For Biology lessons that are still V2 (P3 L1–L4, until 2a.3), keep the V2 lesson's question ids so stars still
     count. This fixes the "L5 has `[]`" bug from §1.3.
   - Each track passes its checkpoint id explicitly (`bio_p{n}_cp`, `hx_py_cp{n}`, `fin_py_cp{n}`).
2. **Make `addV3` in `lessonKitV2_updated.tsx` take the checkpoint id the same way**, so the checkpoint keeps the id the
   track file already uses. Biology needs `bio_p{n}_cp`, not `bio_cp{n}`.
   - Register Biology with `addV3` too, instead of the special `fromV3` loop, keeping the `!it.status` skip.
3. **Add `scripts/validate-content.mjs`** (plain Node, no new dependencies), run with
   `node scripts/validate-content.mjs`. For every V3 file in `CONTENT`, it checks:
   - every phase has 5 lessons and exactly 1 checkpoint with `part: 5`, placed last
   - every lesson and checkpoint has 5 questions and `notebook.length === questions.length`
   - `kind` is `predict`, `fill` or `fix`
   - predict/fill questions have exactly one option with `correct: true`, and its id is `"a"`; fill code contains `___`
   - fix questions: `buggy_line` is one of `lines[].id`, that line is `given_correct: false`, and exactly one replacement
     in it is `correct: true`
   - every picture has `type`, `label` and `correct_state`, and `states.wrong_by_option` has a key for every wrong option
   - every image path the JSON names exists in `src/utils/imageMapV3.ts`
   - every lesson id in the matching `track_*.json` resolves to a V3 item, and the item ids are unique

   Print one line per problem, and exit 1 if there are any. Items with `status` are allowed but listed as warnings.
4. **Add `scripts/run-answers.mjs`** (D7):
   - Usage: `node scripts/run-answers.mjs <v3 file> [item id]`.
   - For each predict question, it runs `code` and prints the real output next to the marked answer and each option.
   - For each fill question, it runs `code` with the correct option put in place of `___`, and also with each wrong
     option, and prints each output.
   - For each fix question, it runs `lines` as given, then with the correct replacement, and prints both outputs (the
     fixed one should match `output_after_fix`).
   - Python goes through `python3`, R through `Rscript` (or `conda run -n moat-r Rscript` if that environment exists). If
     the runtime is missing, it says so instead of failing.
   - It's a review aid; the agent reads its output. It doesn't decide pass/fail.
5. **Strip `ai_context`** (D9) from every question in the V3 files. Do it with a small script, so nothing else in the
   files changes; check with `git diff --stat` that only those lines changed. Add a validator rule that rejects
   `ai_context`.

   Running the validator on today's files will show Finance's per-lesson checkpoints and Biology's missing checkpoints and
   legacy P3. Record that output in the commit message; those are what 2a.1–2a.3 fix.

**Done when:** §0 checks 1–3 pass. Healthcare and Biology play exactly as before, with stars the same and the checkpoint
still opening. Commit `Step 2a.0: one V3 track hookup and a content validator`.

### 2a.1 Finance: one checkpoint per phase
Smallest change; it proves the rule works on a second track.

1. In `finance_python_v3.json`:
   - Replace the 5 per-lesson checkpoints (`FpP1C1`…`FpP1C5`, 3 questions each) with **one** checkpoint item, `id:
     "FpP1C"`, `type: "checkpoint"`, `part: 5`, after `FpP1L5`, with 5 questions covering the whole phase.
   - Build it from the strongest existing checkpoint questions (across the 15), changed as needed so it has at least one
     of each kind (`predict`, `fill`, `fix`).
   - Keep their pictures, and their `FpP1C*` image paths. Delete any `.webp` under `assets/images/finance/devices/` that
     only the removed questions used, and remove those paths from `imageMapV3.ts`.
   - Update `track.item_order_rule` to the Healthcare wording.
2. Register Finance with the phase checkpoint id `fin_py_cp1`. In `track_fin_py.json`, give the checkpoint a real `name`
   (it says "Coming soon" today).
3. Remove the per-lesson checkpoint flow from `TrackFlowScreen_updated.tsx`: the `cpIntroV2`/`cpV2`/`cpRecapV2` steps and
   the `v2Checkpoint` check in `recapV2`. Delete `v2Checkpoint` from `lessonKitV2_updated.tsx`. Finance was its only user.
4. Validator: Finance has 0 errors.

**Done when:** Finance plays L1→L5 with no checkpoint between lessons; the checkpoint opens after L5; finishing it with
full stars completes the phase. Commit `Step 2a.1: Finance uses one checkpoint per phase`.

### 2a.2 Biology: V3 phase checkpoints
1. Write 5 checkpoint items in `biology_r_v3.json`, `id: "BioP{n}C"`, `type: "checkpoint"`, `part: 5`, one after each
   phase's L5.
   - Each has 5 questions mixing `predict`/`fill`/`fix`, using that phase's R ideas (`phases[].r_idea`).
   - Use the old V1 checkpoint in `track_bio_r_updated.json` (`phases[].checkpoint`: `name`, `filename`, `problem`,
     `unlock`) as the brief, so each checkpoint keeps its project (for example, phase 1 "Primer check", Wallace-rule
     melting temperature).
   - Use the Biology picture types (`tiles`, `ratebars`, `dots`, `steps`, `strands`, `thermo`).
   - Checkpoint page style matches Healthcare's checkpoint items.
2. Register them with checkpoint ids `bio_p{n}_cp`, so saved stars carry over. In `track_bio_r_updated.json`, keep
   `checkpoint.id`/`name`/`unlock` but remove the old V1 `checkpoint.questions`; the loader now fills them from V3.
3. In `TrackFlowScreen`, every track now has a V3 phase checkpoint, so the `TrackPlayer` checkpoint branch
   (`CheckpointIntro`/`TrackPlayer` with `lesson={null}`) is unused. **Leave the code in place**; step 3 deletes it. Add
   an entry to §8.
4. Validator: Biology checkpoints have 0 errors. Check R answers per D7.

**Done when:** each Biology phase ends on the V3 checkpoint (navy page, green confetti recap); full stars unlock the next
phase. Commit `Step 2a.2: Biology checkpoints in V3`.

### 2a.3 Biology: rebuild P3 lessons 1–4 in V3
1. In `biology_r_v3.json` phase 3 ("Lab bench decisions", R idea "Decisions"), replace the 4 `status: "legacy …"` stubs
   `BioP3L1`–`BioP3L4` with full lessons.
   - Keep the titles ("Too big for a well?", "Big or small sample", "Fix the else line", "Buffer to add") and the
     storylines of the V2 lessons in `track_bio_r_lessons_v2.json` (`bio_p3_l1`…`l4`).
   - Rewrite the V2 `build`/`bug` questions as `fill`/`fix` (D5).
   - Pictures: switch V2 types (`tubes`, `rows`, `ph`, `readout`, `msg`) to V3 types, or to `StateCardV3` with an
     existing icon. If a V3 renderer is genuinely needed (for example `tubes`), add it to `picturesV3.tsx` in this step.
   - Remove `status`. Make P3 L5's continuity line up with the new L4.
2. App ids stay `bio_p3_l1`…`l4`. Now that every Biology lesson is V3, remove the special case in `withV3` that kept V2
   question ids.
3. Validator: Biology has 0 errors and 0 warnings.
4. **Don't delete `track_bio_r_lessons_v2.json` yet.** It's now unused; add it to §8 for step 3.

**Done when:** Biology phase 3 plays all 5 lessons in V3. Commit `Step 2a.3: Biology phase 3 lessons 1–4 in V3`.

### 2a.4 Engineering: rebuild in V3 (confirm D3 with the user first; D2 is decided)
This is the biggest content job. **Split it into one session per phase** (2a.4.1 … 2a.4.5), each with its own commit and
review.

1. **First session only:**
   - Create `assets/content/engineering_python_v3.json` with a `track` block (`id: "engineering_python"`, name
     "Engineering Python", language Python, 5 phases, 5 lessons per phase, the Healthcare `item_order_rule`).
   - Register it in `CONTENT`.
   - Rewrite `track_eng_py.json` to the standard structure: phases 1–5; lesson ids `eng_py_p{n}_l{k}`; checkpoint
     `eng_py_cp{n}`; `parts`, `project`, `skill` and `code` per phase, the same shape as `track_hx_py.json`. Keep
     `cycle2`.
   - Register it in the loader (`withV3(..., 'eng_py', ...)`) and in `addV3` with `domain: 'eng'`. The `FIELD.eng` label
     already exists.
   - Phases that aren't written yet must not break the path. Add them to the track file only when their content lands.
2. **Each phase session:**
   - Write 5 lessons + 1 checkpoint.
   - Phase 1 "Circuit calculator" rebuilds V2 `EngP1L1`–`EngP1L4` (Label the circuit, Ohm's law, Battery life, Power
     budget) and adds an L5.
   - Phase 3 "Fruit sorting conveyor" (decisions) rebuilds `EngP3L1` "Sort the fruit" and adds L2–L5.
   - Phases 2, 4 and 5 are new, following D3's skill order.
3. **Pictures.**
   - The V2 Engineering pictures (`circuit`, `belt` with the fruit sprites, `battery`, `bpbars`, `gauge`) have no V3
     renderer. For each phase, either use a V3 type / `StateCardV3` with an icon (add icons under
     `assets/images/engineering/icons/` and register them in `imageMapV3.ts`), or port the V2 renderer into
     `picturesV3.tsx` as a V3 type that reads `correct_state`/`wrong_by_option`.
   - Porting `belt` keeps the fruit sprites alive. If it's not ported, `assets/images/fruits/` becomes dead in step 3.
4. Check every Python answer by running it (D7). Validator: 0 errors for Engineering.

**Done when (each phase):** that phase plays end to end including its checkpoint; the next phase unlocks at full stars.
Commit `Step 2a.4.<n>: Engineering phase <n> in V3`.

**After 2a.4.5:** no track uses V2 or `TrackPlayer` any more. Record in §8 the V2/V1-track files now unused.

### 2a.5 Healthcare picture fixes
Added 2026-10-21 (user decision) for the Healthcare errors the 2a.0 validator found. Healthcare Python and R both play
today; this step only fixes their pictures. Run it after 2a.0 at any point; it touches only the two Healthcare files,
`picturesV3.tsx` and image files, so it doesn't conflict with 2a.1–2a.4.

1. **72 pictures with `correct_state: null`** (39 in `healthcare_python_v3.json`, 33 in `healthcare_r_v3.json`; types
   `labelcard`, `trial`, `stays_pic`, `coverage`, `ldl`).
   - They carry the right answer in `go_text` / `go_after` instead. No renderer reads those, so they fall through to
     `StateCardV3` and show the icon with no caption on a right answer.
   - Two ways to fix it. Agree which one with the user before changing anything:
     - **Content:** set `correct_state` from `go_text` / `go_after`, in the same form as the `wrong_by_option` states,
       and remove the `go_*` fields.
     - **Code:** give these types a renderer in `picturesV3.tsx` that reads `correct_state` / `wrong_by_option`
       (pictures for `trial`, `coverage` and `ldl` hold number arrays, which a text caption may not show well). The
       content still moves to `correct_state`.
   - Re-save with the file's own JSON format (both files are one line; the 2a.0 strip script shows how) and check that
     nothing but the intended fields changed.
2. **7 fix-question pictures with no wrong state for a line that offers a wrong replacement** (2 Python, 5 R).
   - The player passes the **tapped line id** as the pick, and Check needs a replacement, so `wrong_by_option` needs a
     key for every line in `fixes_by_line` that has a wrong replacement, the buggy line included.
   - Write each missing state from what that line's code really does. Run it with `scripts/run-answers.mjs` (D7); R runs
     in the `moat-r` environment.
3. Validator: 0 errors for both Healthcare files.

**Done when:** §0 checks pass. Smoke test Healthcare Python and Healthcare R: open a lesson with a `labelcard` picture
(for example `XpP2L3`) and one with a fixed fix question, answer right and wrong, and check that each picture shows its
state. Commit `Step 2a.5: Healthcare picture fixes`.

---

## 5. Step 2b: general lessons

The general path (`LearnScreen` + `LessonScreen`, V1) serves every combination without a track (§0 table).

### What the code can and can't reach today
| File | Reachable? |
|---|---|
| `lessons_physics_and_maths`, `lessons_arts_and_humanities`, `lessons_general` | **yes**: those areas with Python |
| `lessons_r`, `lessons_sql`, `lessons_javascript`, `lessons_matlab`, `lessons_java` (1 phase × 4 lessons each) | **yes**: any area without a track in that language |
| `lessons_engineering`, `lessons_business`, `lessons_life_sciences` | **no**: those areas with Python all have tracks, and other languages load the language file first |
| mini-games (`addingGames` in `gameCatalog.ts`, `GameLessonScreen`, `games/LoopGame`, `games/StageGame`) | **no**: they're only added to the three unreachable area files above |

### 2b.0 Decide with the user (no code)
Ask the user these questions. Write the answers into this file under 2b, then commit
`Step 2b.0: decisions for general lessons`.

1. **Shape.** Should each reachable general file become a V3 **track**? That would mean 8 tracks: 3 areas × Python and
   5 languages, each 1+ phase × 5 lessons + checkpoint. Then `hasTrack` is true for everyone and `LearnScreen`/
   `LessonScreen` can go. The alternative is a smaller set of shared language tracks.
   - **Default:** one V3 track per reachable file, **keeping all of that file's existing phases** (3 for each area file,
     1 for each language file), rebuilt from its existing lessons (per D5 and 2b.2's convert-then-write approach).
2. **Language tracks for areas.** A language track (for example SQL) is used by every area without its own SQL track.
   Should its stories be area-neutral? **Default:** yes, keep the current general framing.
3. **Already decided (D6):** Premium is gone (step 1b), and evolution on tracks is backlog. Only confirm the
   **mini-games:** delete them, since they can't be reached? **Default:** yes. If the user wants them kept, add them to
   `docs/backlog.md` instead of building them now.
4. **Delete the unreachable `lessons_engineering/business/life_sciences.json`?** **Default:** yes, in 2b.3.

### 2b.1 (removed)
This step used to port the Premium lock and evolution to the track path. Both were dropped by D6: Premium was removed in
1b, and evolution is in `docs/backlog.md`. The number is kept so the other step numbers don't change.

### 2b.2 Write the general V3 tracks (one session per track)
For each track agreed in 2b.0:
1. Create `<name>_v3.json` (for example `general_python_v3.json`, `sql_v3.json`) and `track_<name>.json` in the
   standard shapes. **Convert first, then write what's missing.**
   - **Convert by script** (`scripts/convert-v1.mjs`, written in the first 2b.2 session). It maps what V1 already has,
     and leaves `"TODO"` markers that the validator reports:
     - lesson `id`/`title`
     - question `prompt` → `ask`, `hint` → `hint_before_check`, `explanation` → `explanation_after_check`, `code`
       (split into lines)
     - `options` + `answer` → V3 `options`, reordered so the correct one has id `a`
     - V1 `kind`: `choice` with `___` → `fill`; `choice` asking for output → `predict`; `bug` (options are lines,
       `fix` is the corrected line) → `fix` with `lines`/`buggy_line`
   - **Write by hand (the agent)**, because V1 has no equivalent:
     - per-option `feedback`, `takeaway`, `next_bridge`, `code_note`, `science_note`, `scene_label`, `worked`
     - a V3 `picture` with `correct_state` and `wrong_by_option`. V1 only has an emoji; use `tiles` for printed text,
       `ratebars` for numbers, or `StateCardV3`.
     - the item `person`/`intro`/`script_file`/`start_button`/`notebook`/`recap`
     - the replacement options for each line of a `fix`
     - rewrites of `build`/`judge`/`match` questions into `predict`/`fill`/`fix`
     - a **5th lesson and a 5-question checkpoint per phase** (V1 has 4 lessons per phase and no checkpoints)
2. Extend the TRACKS lookup:
   - Today: `trackFileFor` / `TRACK_LANGUAGES`.
   - Area + Python → area track; any area + other language without its own track → language track.
   - `TRACK_LANGUAGES` and the onboarding copy in `OnboardingScreen_updated.tsx` must match: the lines "uses general
     lessons in every language for now" and "starts with Phase 1. More phases are coming soon".
3. Ids: `gen_py_p{n}_l{k}`, `sql_p{n}_l{k}`, …; checkpoints `<prefix>_cp{n}`. V1 general progress (`completedLessons`)
   doesn't carry over (D2). Make sure it doesn't break anything, for example the Profile stats that read
   `completedLessons`.
4. Validator: 0 errors. Check answers per D7. SQL, JavaScript, MATLAB and Java can't be run here, so list them as "not
   run" unless the user provides runtimes.
5. **Done when (each track):** that combination opens the track path and plays end to end. Commit
   `Step 2b.2.<track>: <track> in V3`.

### 2b.3 Switch off the general path
1. Once every combination has a track, make `hasTrack` always true, or remove it. `MainTabs` always uses
   `TrackPathScreen`.
2. **Don't delete files yet** (that's step 3). Add to §8: `LearnScreen.tsx`, `LessonScreen.tsx`, `GameLessonScreen.tsx`,
   `games/*`, `gameCatalog.ts`, `loadBundled`, `languageFileName`, `fileName`, every `lessons_*.json`, the `Course`/
   `Lesson`/`Phase` V1 types, the `course`/`completedLessons` parts of `useAppStore` that only the general path used,
   `apiClient.fetchCourse` and `AppConfig.useBackendLessons`, and `LessonScreen`'s `useAIExplanations` "Explain more".
   Add the evolution trigger too (see 3.1, "Robot forms"), since it can only fire from the general path.
3. **Done when:** every row of the §0 table opens a track. Commit `Step 2b.3: every learner gets a track`.

---

## 6. Step 3: structural cleanup (V3 only, expo-web layout)

**Prerequisite:** the validator passes, and §8 lists every file that's now unused.

**Reference layout:** branch `expo-web` at commit `8c270fb` ("Code Cleanup and Fix Bolts…"). The local branch `cleanup`
has the same work as 9 smaller commits (`bc80060` … `67f014f`), which make a good recipe to follow in order. Read the
target files with `git show expo-web:<path>`.

**Don't** check out or merge `expo-web` wholesale: it predates V3, Healthcare, Finance, the web routing and the image
fallback. Port its *structure*. Keep v3's behaviour.

Do the sub-steps in order, one commit each, with §0 checks after each. Smoke test **every** track after 3.1 and 3.3.

**The principles to port** (what the expo-web cleanup applied; every sub-step follows them):
- **Separation of concerns.** Each layer does one job:
  - content (`src/content/`, `services/contentLoader.ts`): reads and converts JSON
  - rules (`utils/progressRules.ts`, `utils/rewards.ts`): pure functions, no React or storage
  - storage (`storage/`): AsyncStorage only
  - stores (`hooks/use*Store`): wire state, rules and saving together
  - UI (`components/`, `screens/`): renders and handles taps

  No UI file imports JSON or does AsyncStorage; no rule lives inside a component.
- **DRY.** Any logic, constant, style or component used in two places lives in one shared place (helper, hook, theme
  token or component).
- **One responsibility per file**, and small files (aim under ~300 lines).
- **Clear names.** Names say what a thing is (`AppStoreContext`, not `Ctx`). No version suffixes (`_updated`, `V2`,
  `V3`).
- **Minimal surface.** Export only what other files use, and delete dead code and unused exports (D8).
- **Self-describing code.** Every file starts with a one-line header comment, and every exported function and
  component has a one-line doc comment. Comments describe this app, not the Swift original.

### 3.1 Delete V1 and V2
- Delete everything §8 lists. Typically:
  - `src/screens/track/TrackPlayer.tsx`
  - the V1 parts of `TrackResults.tsx`: `CheckpointIntro`, the V1 checkpoint, and `TrackPlayer` question kinds. Keep what
    the V3 flow still uses (`TrackLessonComplete`, `ProjectBuilt`, `CheckpointResult`) if it still uses them; check
    `TrackFlowScreen`.
  - `src/components/picturesV2.tsx`, unless 2a.4 ported something that still imports it
  - `track_bio_r_lessons_v2.json`, `track_lessons_v2_more.json`
  - the V2 `RAW`/`MORE` imports and the V2-only `V2Pic` variants in the lesson kit
  - stale V1 `questions` left in track files
  - the 2b.3 list
  - `assets/images/fruits/`, if `belt` wasn't ported
  - `healthcare_design.json` → move to `docs/` (reference spec only)
- **Robot forms** (D6, D8; evolution is backlog). Once the general path is gone, nothing can unlock a form, so:
  - **Delete the trigger:**
    - `phase.unlocksForm` (content and the `Phase` type)
    - the form-unlock part of `useAppStore.completeLesson` (`completeLesson` itself goes with the general path)
    - `pendingEvolution` and `clearPendingEvolution`
    - `src/screens/EvolutionScreen.tsx` and its route and URL (`Evolution`, `evolution/:form` in `RootNavigator`)
    - the Profile "Hatched" badge, which can never be earned
  - **Decided (user, 2026-10-21): no unlock function, stub or comment is left for later.** With the trigger gone, every
    learner only ever owns Blob, so choosing a form is dead functionality too. Remove it all:
    - `unlockedForms`, `currentForm` and `equip` from `UserProgress`/`useAppStore`. Old saved progress may still contain
      these fields; ignore them on load (D2).
    - `ROBOT_FORMS`, `ROBOT_NAMES`, `isInVersionOne` and the `RobotForm` union in `types/models.ts`. The robot is always
      Blob; keep `RobotMood` and a `robotImage(mood)` helper (`blob_<mood>`).
    - Every screen that reads `currentForm` draws Blob: `TrackPathScreen`, `TrackResults`/`RobotFace`, the lesson player
      and `ProfileScreen`.
    - Delete the other forms' pictures: `builder_*`, `rover_*`, `gardener_*`, `orb_*`, `cat_*` (8 moods each). Regenerate
      `src/utils/images.ts`. `robot_logo_filled*` is the app logo/favicon, not a form, so keep it.
    - "Reset progress" in Profile: change its wording from "robot forms" to what it actually clears.
  - **Workshop (D10):** keep the tab. `WorkshopScreen` shows only the robot card: Blob on `world_backdrop.jpg`, with its
    name.
    - Remove the "Forms" and "Parts" sections and the `PARTS` list.
    - Delete the part pictures if nothing else uses them: `antennas`, `wheels`, `hands` (`*_updated.png`). Check
      `components/ui.tsx` and `rg` first.
  - In `docs/backlog.md`, add this sub-step's commit hash, so the deleted `EvolutionScreen`, form picker and pictures can
    be restored with `git show <hash>^:<path>`.
- Simplify `TrackFlowScreen`: one path `intro → player → recap → lessonDone → (projectBuilt) → checkpointIntro →
  checkpoint → checkpointDone`, all on the V3 player.
- Remove unused exports and dead branches (`v2Lesson` returning null, `lessonStep`, `cpV2` fallback).

### 3.2 Content layer: one TRACKS registry and typed V3
- **`src/content/types.ts`:** TypeScript types for the V3 JSON (§1.4), as discriminated unions on `kind` and `type`.
  This removes the `any` casts and the ~31 `eslint-disable` lines in `lessonKitV2_updated.tsx`, `picturesV3.tsx` and
  `contentLoader_updated.ts`.
- **`src/content/tracks.ts`:** the single registry, which replaces `trackFileFor`, `TRACK_LANGUAGES`, `hasTrack`, the
  `addV3(...)` calls, the `FIELD` map and the `loadTrack` name checks. One entry per track:
  ```ts
  { key: 'hx_py', area: 'Healthcare', language: 'Python', trackFile: 'track_hx_py', v3File: 'healthcare_python_v3',
    prefix: 'hx_py', domain: 'health', name: 'Healthcare Python', checkpointId: (n) => `hx_py_cp${n}` }
  ```
  plus the `FIELD` display info (chip, icon, tap text) per `domain`.
- **`src/services/contentLoader.ts`:** the only place JSON is read and converted.
  - `loadTrack(area, language)` returns the track structure with questions filled.
  - `lessonFor(id)` returns the player-ready lesson; the current `fromV3` and `LESSONS` map move here from the lesson kit.
  - UI components import no JSON.
- `src/utils/content.ts` (the renamed `content_updated.ts`) keeps the `CONTENT` require map.
- Make ids consistent: content item ids (`BioP1L1`) stay in the JSON. App ids come only from the registry prefix. Write
  the rule down in the README.

### 3.3 Split the large files the expo-web way
Target (names from expo-web; adjust to V3):
- `src/components/trackKit.tsx` (805 lines) →
  - `components/track/`: `BoltPill`, `FeedbackSheet`, `ProjectCard`, `PromptBubble`, `RCodeLine`, `RobotFace`,
    `WeekStrip`, `phasePictures`, `progressBars`, `stars`
  - `components/icons.tsx`, `components/QuitSheet.tsx`, `components/StatChipsRow.tsx`, `components/CloseButton.tsx`
  - hooks `useCountUp`, `useSlideUp`, `useScrollToCurrent`
- `src/components/lessonKitV2_updated.tsx` (1174 lines) →
  - `components/lesson/`: `Answers`, `CodeBox`, `FeedbackSheet`, `Notebook`, `QuestionBar`, `animations`, `notes`
  - `screens/track/lesson/`: `LessonIntro`, `LessonPlayer`, `LessonRecap`
  - `colorPy`/`colorR` → `utils/codeColor.ts`
- `src/components/picturesV3.tsx` → `components/lesson/pictures/`: one file per renderer family plus `index.tsx` with
  the dispatcher. `src/utils/imageMapV3.ts` → `src/utils/lessonImages.ts`.
- `TrackResults.tsx` → `screens/track/results/`: `TrackLessonComplete`, `ProjectBuilt`, `CheckpointResult`, `Hero` (only
  the ones still used).
- The two path screens share `components/path/`: `PathNode`, `PathScreenLayout`, `PhaseBanner` (as in expo-web). If 2b
  removed `LearnScreen`, there's only one path screen; still move its pieces into `path/` if it keeps the file under
  ~200 lines.
- Aim for no file over ~300 lines. Each file starts with a one-line header comment, as in expo-web.

### 3.4 Shared logic
- **`src/hooks/useFinishRun.ts`** (copy from expo-web): `track.record` + `app.creditTrack` + `track.addTime(rounded
  seconds)`. Replace the inline copy in the lesson player (currently `lessonKitV2_updated.tsx:881`). Today `TrackPlayer`
  doesn't round and the kit does; settle on rounding.
- `src/storage/jsonStorage.ts`: shared AsyncStorage JSON load/save, used by `progressStorage` and `trackStorage`.
- `src/utils/rewards.ts`: the reward and goal constants, including `DAILY_GOAL_MINUTES` (moved out of `useTrackStore`)
  and the bolt amounts (10 per first-try question, +30 for a perfect first attempt).
- `src/utils/progressRules.ts`: **pure functions** for how a finished run changes saved progress. Copy the pattern from
  `git show expo-web:src/utils/progressRules.ts`:
  - `bumpDay` (streak and today's count)
  - `withTrackBolts` (replaces the inline logic in `useAppStore.creditTrack`)
  - the star, bonus and unlock rules from `useTrackStore`: `record`'s star/bonus maths, `phaseComplete`,
    `lessonUnlocked`, `checkpointUnlocked`

  The stores then only wire state and saving to these functions. `withLessonCompleted` and the evolution part of
  expo-web's version are **not** ported (the general path and evolution are gone).
- `src/utils/motion.ts` for shared easing curves (the `EASE` constants that are repeated today).
- Theme tokens for repeated literals. For example `lockedOverlay: 'rgba(27,36,114,0.55)'` (used by locked path phases),
  as expo-web added. Search for other colour literals used in more than one file, and give each a `C.<name>` token.
- Shared small components expo-web extracted: `CloseButton` (the ✕ on every lesson and checkpoint screen),
  `QuitSheet`, `StatChipsRow`, `icons.tsx`. Each is defined once and imported everywhere it's used.

### 3.5 Names
- Drop every `_updated` suffix: files, imports and the content key.
  - `useTrackStore_updated` → `useTrackStore`
  - `MainTabs_updated` → `MainTabs`
  - `OnboardingScreen_updated` → `OnboardingScreen`
  - `TrackFlowScreen_updated` → `TrackFlowScreen`
  - `TrackHomeScreen_updated` → **`TrackPhaseScreen`**
  - `TrackPathScreen_updated` → `TrackPathScreen`
  - `contentLoader_updated` → `contentLoader`
  - `content_updated` → `content`
  - `track_bio_r_updated.json` → `track_bio_r.json`
- Images: `git mv` `assets/images/*_updated.png` to the plain names as in expo-web. Note that expo-web also swapped some
  pairs (for example `builder_neutral_updated` → `builder`, `builder_updated` → `builder_neutral`); copy expo-web's exact
  mapping from `git show --stat 8c270fb`.
  - Regenerate `src/utils/images.ts`.
  - Remove the `name + '_updated'` lookup in `components/ui.tsx` (`BundleImage`).
  - Fix `app.json` `web.favicon`.
- Drop version names from code: `PictureV3` → `Picture`, `LessonPlayerV2` → `LessonPlayer`, `V3_IMAGES` →
  `LESSON_IMAGES`, `v2Lesson` → `lessonFor`. Content file names (`*_v3.json`) may keep `v3`, or be renamed to
  `<track>.json` along with their `CONTENT` keys.
- Byte-identical `.webp` files (for example 14 copies of one Finance idle image): point duplicates at one file in the
  image map and delete the copies. Generate the map with a script, not by hand.
- **Vague identifiers.** Rename short or generic names to what they are, as expo-web did:
  - `Ctx` → `AppStoreContext` / `TrackStoreContext`
  - one-letter state and props in components (`p`, `u`, `a`, `s`) where they span more than a few lines
  - `RAW`/`MORE`-style constants

  Keep conventional short names (`i` in loops, `t` in tiny lambdas).

### 3.6 Config, docs, README
- `package.json`: restore `expo` to `~57.0.28`, as expo-web has it. Run `npx expo install --fix`.
- Bring back the header comments expo-web added (`App.tsx`, `index.ts`, every file), and give every export a one-line
  doc comment.
- **Remove Swift references from comments**, for example "(CardStyle in Theme.swift)", "LearnView", "TrackData_updated.swift",
  "like the Swift client". Describe what the code does in this app instead, as expo-web did. Check:
  `rg -n "Swift|\.swift|SwiftUI|UserDefaults" src` returns nothing.
- **Trim unused exports.** Run `npx --yes knip` once (no install; don't add it to `package.json`). Then:
  - remove each unused export and file it reports, or un-export it if it's used only inside its own file (as expo-web did
    with `imageSource`, `textStyles` and `lessonsToday`)
  - list anything you deliberately kept in the commit message
- Rewrite `README.md` along expo-web's README:
  - project structure table for the new folders
  - how a track is defined (the registry, the V3 file, the track file, the id rule, the validator)
  - how to add a track
  - web build and Vercel
  - Remove the October-2026 notes that are no longer true.
- `docs/`: keep the handover docs; mark this plan as done.

### 3.7 Parity review against expo-web (no code unless it finds gaps)
- List every file in `git ls-tree -r --name-only expo-web src`. For each, write one line in `docs/expo-web-parity.md`:
  - its v3 equivalent, or
  - why it's moot here, for example: `screens/lesson/*` went with the general path; `PaywallOverlay` was removed in 1b;
    `lessonV2/pictures/health.tsx` was replaced by V3 pictures
- Then check the principles above across `src/`:
  - no UI file imports `assets/content` or `AsyncStorage`
  - no logic is copied between files (search for repeated blocks of 5+ lines)
  - no file is over ~300 lines without a reason noted in the parity file
- Fix any gap in a final commit `Step 3.7: expo-web parity fixes`, or record that there were none.

**Done when:** all §0 checks pass; every track in the registry plays a lesson and its checkpoint in the web preview; `rg
"_updated|V2|picturesV2|TrackPlayer|lessonKit" src` finds nothing that isn't intended; `docs/expo-web-parity.md`
accounts for every expo-web file. One commit per sub-step.

---

## 7. Order at a glance
1. Step 1: dead files
   - 1b: remove the paywall and RevenueCat
2. 2a.0: generic V3 hookup + validator
3. 2a.1: Finance checkpoint
4. 2a.2: Biology checkpoints
5. 2a.3: Biology P3 L1–L4
6. 2a.4.1–5: Engineering, one phase per session
   - 2a.5: Healthcare picture fixes (independent of 2a.1–2a.4)
7. 2b.0: decisions with the user
9. 2b.2.*: one general track per session
10. 2b.3: switch off the general path
11. 3.1: delete V1/V2
12. 3.2: TRACKS registry + types
13. 3.3: split files
14. 3.4: shared logic
15. 3.5: names
16. 3.6: config/README
17. 3.7: parity review against expo-web

---

## 8. Notes for later steps
Each step adds here what it found or left for a later step (file, why, which step should handle it).

- (step 1 audit) `assets/images/finance/devices/` has many byte-identical `.webp` files; handle in 3.5.
- (step 1 audit) `withBiologyV3` leaves Biology L5 `questions: []`, so L5 counts as complete without being played; fixed
  in 2a.0.
- (step 1 audit) The mini-games can't be reached from any study area/language combination; decided in 2b.0.
- (step 1) `src/screens/LearnScreen.tsx:133` still tells users "Check that lessons.json is inside the app. See
  Troubleshooting in the README." `lessons.json` is gone (the fallback is now `lessons_general`) and the README has no
  Troubleshooting section. Left as is by the user's choice; it goes away with `LearnScreen` in 3.1.
- (step 1 smoke test) `src/screens/track/TrackResults.tsx:66` hard-codes "part {lesson.part} of 4", so the V3 lesson
  results screen shows "part 1 of 4" for 5-lesson phases. Fix with the generic V3 hookup in 2a.0 (or 3.3 at the latest).
- (step 2a.0) The validator reports 72 Healthcare pictures with `correct_state: null` (types `labelcard`, `trial`,
  `stays_pic`, `coverage`, `ldl` in `healthcare_python_v3.json` and `healthcare_r_v3.json`). They carry the answer in
  `go_text`/`go_after`, which no renderer reads, so the right-answer card shows no caption. The user decided this is an
  error to fix. Fixed in **2a.5 Healthcare picture fixes** (added to the plan 2026-10-21).
- (step 2a.0, rule corrected in 2a.1) The validator reports fix-question pictures with no `wrong_by_option` state for a
  line that offers a wrong replacement (the player passes the tapped line id, and Check needs a replacement picked, so
  the buggy line counts too). 2a.0's first version of the rule also demanded states for lines with no replacements,
  which learners can never check, and skipped the buggy line. Corrected counts: Biology 1 (`BioP4L4` q5, fix in 2a.2 or
  2a.3), Healthcare Python 2 and Healthcare R 5 (2a.5), Finance 0. The user decided these are errors.
- (step 2a.1) A fix-question line with no `fixes_by_line` entry can still be tapped: the other lines fold away and no
  replacements appear, so the learner has to tap it again to get back. Many questions have such lines (for example
  `FpP1L2` q5 line d). Decide in 3.3 or 3.4 whether those lines should be untappable.
- (step 2a.0) Finance's per-lesson checkpoints stay registered under `fin_py_p1_c{k}` (no `checkpointId` in `addV3`),
  and `fin_py_cp1` stays empty because the V3 phase has 5 checkpoint items, not 1. 2a.1 switches it to one phase
  checkpoint.
- (step 2a.1 smoke test) On a track's last phase (Finance has one), the checkpoint result still says "Phase 2 is still
  locked" below full stars and "Start phase 2" at full stars; the button just returns to the path. `CheckpointResult` in
  `src/screens/track/TrackResults.tsx` should word the last phase differently. Handle with the other TrackResults text
  fix (2a.0 note above), in 2a.2 or 3.3.
- (step 2a.1) `scripts/run-answers.mjs` can't answer `input()`, so questions that read input (Finance `FpP1C` q5,
  `FpP1L5` q2–q3) show `EOFError`. 2a.1 checked FpP1C q5 by hand with the quantity piped in. A later content step could
  let the runner take the typed value from the question.
- (step 2a.2) Every track now has a V3 phase checkpoint, so `TrackFlowScreen_updated.tsx`'s TrackPlayer checkpoint
  branch (`CheckpointIntro`, and `TrackPlayer` with `lesson={null}`) is unused. Left in place per 2a.2; delete it in 3.1
  with the rest of V1. `track_bio_r_updated.json` checkpoints keep `filename`/`problem` (only `CheckpointIntro` reads
  them) and its lessons keep their old V1 `questions` (the loader replaces them from V3); both go in 3.1/3.2.
- (step 2a.2 smoke test) On web, the `steps` picture (`Steps` in `src/components/picturesV3.tsx`) logs a React dev warning
  on Check: "Received `false` for a non-boolean attribute `collapsable`". It already happens in `BioP4L1` q1, so it's
  the renderer, not the content: its animated SVG path passes `collapsable` through to the DOM on react-native-web.
  Nothing breaks. Fix in 3.3 when `picturesV3.tsx` is split.
- (step 2a.3) `assets/content/track_bio_r_lessons_v2.json` is now unused: every Biology lesson is V3, so `addV3`
  overwrites each of its entries in `lessonKitV2_updated.tsx`'s `LESSONS` map. The file is still imported there (as
  `RAW`); delete the file and the import in 3.1. Its `CONTENT` entry (added in 2a.0 for the V2 question ids) is gone.
- (step 2a.4.1) Engineering phase 1 is V3 (`engineering_python_v3.json`, item ids `EpP{n}…`, not the V2 `EngP…`, so
  new question ids don't collide with V2 ones). Now unused: the V2 entries `EngP1L1`–`EngP1L4` in
  `track_lessons_v2_more.json`, and V2's `Circuit`, `Battery`, `Gauge` and `BpBars` in `picturesV2.tsx` (V3 has its own
  `circuit`, `battery` and `gauge`; power bars use `ratebars`). The V2 phase 3 (`EngP3L1`) was dropped from
  `track_eng_py.json` until 2a.4.3 (user decision). Delete the V2 pieces in 3.1.
- (step 2a.4.1) Checkpoint questions in every V3 file have `known_from_earlier: []`; a checkpoint shows no "Known from
  earlier" line. The validator doesn't check this yet; consider adding the rule in a later content step.
- (step 2a.4.3) Engineering phase 3 is V3, with the conveyor `belt` ported to `picturesV3.tsx` (user decision). The fruit
  sprites in `assets/images/fruits/` are now registered in `imageMapV3.ts` and stay in use, so step 3 must not delete
  them. Now unused: V2 `EngP3L1` in `track_lessons_v2_more.json`, and V2's `Belt` and its `SPRITES` map in
  `picturesV2.tsx`. Delete those in 3.1.
