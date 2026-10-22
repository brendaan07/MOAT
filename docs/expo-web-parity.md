# expo-web parity

Every file in branch `expo-web`'s `src/` (106 files), and where it lives on `v3-cleanup` after the migration plan
(`docs/v3-migration-plan.md`, step 3.7). "=" names the equivalent file; "moot" says why there is none. D-numbers are the
plan's decisions.

Summary: 63 files have a direct equivalent; 6 were folded, merged or replaced (path pieces into the one path
screen, the progress bar into `Segments`, V2 pictures by V3 pictures); 37 are moot, because the general path,
mini-games, paywall, robot evolution and the V1/V2 players are gone and every learner plays V3 tracks.

| expo-web file | On `v3-cleanup` |
|---|---|
| `components/CloseButton.tsx` | = `components/CloseButton.tsx` |
| `components/PaywallOverlay.tsx` | moot: the paywall and RevenueCat were removed in step 1b (D6; `docs/backlog.md`) |
| `components/QuitSheet.tsx` | = `components/QuitSheet.tsx` |
| `components/SafeAreaView.tsx` | = `components/SafeAreaView.tsx` |
| `components/StatChipsRow.tsx` | = `components/StatChipsRow.tsx` |
| `components/gameKit.tsx` | moot: only the mini-games used it; they were deleted in 2b.3 (`docs/backlog.md`) |
| `components/icons.tsx` | = `components/icons.tsx` |
| `components/lesson/LessonTopBar.tsx` | moot: the top bar of the general-path lesson and game screens, went with the general path (step 2b.3/3.1): every learner has a track |
| `components/lesson/SimpleLessonComplete.tsx` | moot: the general-path finish screen, went with the general path (step 2b.3/3.1): every learner has a track; tracks finish on `screens/track/results/TrackLessonComplete.tsx` |
| `components/lessonV2/Answers.tsx` | = `components/lesson/Answers.tsx` (predict and fill); fix questions are `components/lesson/FixPaper.tsx` |
| `components/lessonV2/CodeBox.tsx` | = `components/lesson/CodeBox.tsx` (`CodeLine`); its colouring is in `utils/codeColor.ts` |
| `components/lessonV2/FeedbackSheet.tsx` | = `components/lesson/FeedbackSheet.tsx` |
| `components/lessonV2/Notebook.tsx` | = `components/lesson/Notebook.tsx` |
| `components/lessonV2/QuestionBar.tsx` | = `components/lesson/QuestionBar.tsx` (`QuestionBar`, `Segments`) |
| `components/lessonV2/animations.tsx` | = `components/lesson/animations.tsx` (`Enter`, `pressDown`) |
| `components/lessonV2/content.ts` | = `content/tracks.ts` (registry and per-field wording) + `services/contentLoader.ts` (`lessonFor`); the V2 lesson JSON it imported was deleted in 3.1 |
| `components/lessonV2/notes.tsx` | = `components/lesson/notes.tsx` |
| `components/lessonV2/pictures/Belt.tsx` | = `components/lesson/pictures/Belt.tsx` (ported to the V3 picture contract in 2a.4.3) |
| `components/lessonV2/pictures/Circuit.tsx` | = `components/lesson/pictures/engineering.tsx` (`Circuit`, with `Battery` and `Gauge`) |
| `components/lessonV2/pictures/charts.tsx` | replaced by V3 pictures: `components/lesson/pictures/charts.tsx` (tiles, rate bars, dots, steps) and `biology.tsx` |
| `components/lessonV2/pictures/health.tsx` | replaced by V3 pictures: Healthcare content uses `components/lesson/pictures/cards.tsx` (devices and icon cards) and the shared types; battery and gauge are in `engineering.tsx` |
| `components/lessonV2/pictures/index.tsx` | = `components/lesson/pictures/index.tsx` (`RENDERERS`, `LessonPicture`) |
| `components/lessonV2/pictures/motion.tsx` | = `components/lesson/pictures/motion.tsx` (play state, `resolve`, `usePlay`, `useIdle`, `Shake`, `Result`) |
| `components/lessonV2/pictures/static.tsx` | moot: the V2 still pictures (strip, readout, rows, bars, tubes, pH, machine, message); no V3 content uses them. `Message` survives in `components/lesson/notes.tsx` |
| `components/lessonV2/types.ts` | = `content/types.ts` (typed V3 content and `PlayerLesson`/`PlayerQuestion`) |
| `components/path/PathNode.tsx` | folded into `screens/track/TrackPathScreen.tsx` (`nodeRow`): expo-web shared it between two path screens; only one is left (152 lines) |
| `components/path/PathScreenLayout.tsx` | folded into `screens/track/TrackPathScreen.tsx`, as above; scroll logic is `hooks/useScrollToCurrent.ts` |
| `components/path/PhaseBanner.tsx` | folded into `screens/track/TrackPathScreen.tsx` (`banner`), as above |
| `components/track/BoltPill.tsx` | = `components/track/BoltPill.tsx` |
| `components/track/FeedbackSheet.tsx` | moot: the old TrackPlayer's sheet (TrackPlayer deleted in 3.1); the lesson player uses `components/lesson/FeedbackSheet.tsx` |
| `components/track/ProjectCard.tsx` | = `components/track/ProjectCard.tsx` |
| `components/track/PromptBubble.tsx` | moot: only the old TrackPlayer used it (deleted in 3.1) |
| `components/track/RCodeLine.tsx` | = `components/track/RCodeLine.tsx` |
| `components/track/RobotFace.tsx` | = `components/track/RobotFace.tsx` (always Blob since 3.1) |
| `components/track/WeekStrip.tsx` | = `components/track/WeekStrip.tsx` |
| `components/track/phasePictures.tsx` | = `components/track/phasePictures.tsx` |
| `components/track/progressBars.tsx` | merged into `components/lesson/QuestionBar.tsx` (`Segments`) in 3.4; its only use drew a full bar |
| `components/track/stars.tsx` | = `components/track/stars.tsx` |
| `components/ui.tsx` | = `components/ui.tsx` |
| `hooks/useAppStore.tsx` | = `hooks/useAppStore.tsx` (without the general course and robot forms) |
| `hooks/useCountUp.ts` | = `hooks/useCountUp.ts` |
| `hooks/useFinishRun.ts` | = `hooks/useFinishRun.ts` (also pays the daily-goal bonus) |
| `hooks/useReduceMotion.ts` | = `hooks/useReduceMotion.ts` |
| `hooks/useScrollToCurrent.ts` | = `hooks/useScrollToCurrent.ts` |
| `hooks/useSlideUp.ts` | = `hooks/useSlideUp.ts` (also respects Reduce Motion, per the 3.4 decision) |
| `hooks/useTrackStore.tsx` | = `hooks/useTrackStore.tsx` (rules in `utils/progressRules.ts`) |
| `navigation/MainTabs.tsx` | = `navigation/MainTabs.tsx` (Learn is always the track path) |
| `navigation/RootNavigator.tsx` | = `navigation/RootNavigator.tsx` (no Lesson, GameLesson or Evolution routes) |
| `screens/EvolutionScreen.tsx` | moot: robot evolution removed in 3.1 (D6; `docs/backlog.md`) |
| `screens/GameLessonScreen.tsx` | moot: mini-games deleted in 2b.3 (`docs/backlog.md`) |
| `screens/LearnScreen.tsx` | moot: the general path, went with the general path (step 2b.3/3.1): every learner has a track |
| `screens/OnboardingScreen.tsx` | = `screens/OnboardingScreen.tsx` (offers only languages with a track) |
| `screens/ProfileScreen.tsx` | = `screens/ProfileScreen.tsx` (no Subscriptions, no Hatched badge) |
| `screens/SplashScreen.tsx` | = `screens/SplashScreen.tsx` |
| `screens/WorkshopScreen.tsx` | = `screens/WorkshopScreen.tsx` (Blob only, D10) |
| `screens/games/LoopGame.tsx` | moot: mini-games deleted in 2b.3 |
| `screens/games/StageGame.tsx` | moot: mini-games deleted in 2b.3 |
| `screens/lesson/LessonFeedback.tsx` | moot: general-path lesson feedback, went with the general path (step 2b.3/3.1): every learner has a track |
| `screens/lesson/LessonScreen.tsx` | moot: the general-path lesson player, went with the general path (step 2b.3/3.1): every learner has a track |
| `screens/lesson/questions/BugQuestion.tsx` | moot: a V1 question kind; V3 has predict, fill and fix (D5) |
| `screens/lesson/questions/BuildQuestion.tsx` | moot: a V1 question kind (D5); converted to fill in 2b.2 |
| `screens/lesson/questions/ChoiceQuestion.tsx` | moot: a V1 question kind (D5); converted to predict or fill in 2b.2 |
| `screens/lesson/questions/JudgeQuestion.tsx` | moot: a V1 question kind (D5); converted to predict in 2b.2 |
| `screens/lesson/questions/MatchQuestion.tsx` | moot: a V1 question kind (D5); converted to predict in 2b.2 |
| `screens/lesson/questions/QuestionHeader.tsx` | moot: part of the general-path lesson player |
| `screens/lesson/questions/looks.ts` | moot: part of the general-path lesson player; the V3 player's `Look` is in `components/lesson/Answers.tsx` |
| `screens/track/TrackFlowScreen.tsx` | = `screens/track/TrackFlowScreen.tsx` (one V3 path, with the checkpoint recap) |
| `screens/track/TrackPathScreen.tsx` | = `screens/track/TrackPathScreen.tsx` |
| `screens/track/TrackPhaseScreen.tsx` | = `screens/track/TrackPhaseScreen.tsx` |
| `screens/track/TrackPlayer.tsx` | moot: the V1 track player, deleted in 3.1 (every track runs on the V3 player) |
| `screens/track/questions/BuildQuestion.tsx` | moot: TrackPlayer question kind, deleted with it in 3.1 |
| `screens/track/questions/CheckpointQuestionBody.tsx` | moot: TrackPlayer checkpoint body, deleted with it in 3.1 |
| `screens/track/questions/CodeOrderQuestion.tsx` | moot: TrackPlayer question kind, deleted with it in 3.1 |
| `screens/track/questions/DebugQuestion.tsx` | moot: TrackPlayer question kind, deleted with it in 3.1 |
| `screens/track/questions/LessonQuestionBody.tsx` | moot: TrackPlayer lesson body, deleted with it in 3.1 |
| `screens/track/questions/PlanQuestion.tsx` | moot: TrackPlayer question kind, deleted with it in 3.1 |
| `screens/track/questions/PredictQuestion.tsx` | moot: TrackPlayer question kind; V3 predict is in `components/lesson/Answers.tsx` |
| `screens/track/questions/parts.tsx` | moot: TrackPlayer pieces, deleted with it in 3.1 |
| `screens/track/results/CheckpointIntro.tsx` | moot: the V1 checkpoint intro, deleted in 3.1; checkpoints open on `screens/track/lesson/LessonIntro.tsx` |
| `screens/track/results/CheckpointResult.tsx` | = `screens/track/results/CheckpointResult.tsx` |
| `screens/track/results/Hero.tsx` | = `screens/track/results/Hero.tsx` |
| `screens/track/results/ProjectBuilt.tsx` | = `screens/track/results/ProjectBuilt.tsx` |
| `screens/track/results/TrackLessonComplete.tsx` | = `screens/track/results/TrackLessonComplete.tsx` |
| `screens/track/trackQuestionLogic.ts` | moot: answer rules for TrackPlayer's question kinds; the V3 player checks answers itself (`LessonPlayer`) |
| `screens/track/v2/LessonIntroV2.tsx` | = `screens/track/lesson/LessonIntro.tsx` |
| `screens/track/v2/LessonPlayerV2.tsx` | = `screens/track/lesson/LessonPlayer.tsx` |
| `screens/track/v2/LessonRecapV2.tsx` | = `screens/track/lesson/LessonRecap.tsx` |
| `services/apiClient.ts` | moot: backend lessons and "Explain more" only served the general path; removed in 3.1 (D8) |
| `services/contentLoader.ts` | = `services/contentLoader.ts` (driven by `content/tracks.ts`) |
| `services/gameCatalog.ts` | moot: mini-games deleted in 2b.3 |
| `services/purchases.ts` | moot: RevenueCat removed in step 1b |
| `storage/jsonStorage.ts` | = `storage/jsonStorage.ts` |
| `storage/progressStorage.ts` | = `storage/progressStorage.ts` |
| `storage/trackStorage.ts` | = `storage/trackStorage.ts` |
| `types/models.ts` | = `types/models.ts` (progress and run results) + `content/types.ts` (content) |
| `utils/buildAnswer.ts` | moot: checked "build" answers; build questions became fill in 2b.2 (D5) |
| `utils/codeColor.ts` | = `utils/codeColor.ts` |
| `utils/codeJoin.ts` | moot: joined build-question pieces for the general path; deleted in 3.1 |
| `utils/content.ts` | = `utils/content.ts` |
| `utils/dayKey.ts` | = `utils/dayKey.ts` |
| `utils/images.ts` | = `utils/images.ts` (generated by `scripts/generate-image-maps.mjs`, with `utils/lessonImages.ts`) |
| `utils/motion.ts` | = `utils/motion.ts` |
| `utils/progressRules.ts` | = `utils/progressRules.ts` (track rules added; `withLessonCompleted` and evolution not ported, per 3.4) |
| `utils/rewards.ts` | = `utils/rewards.ts` (track numbers only; the general-path ones went with it) |
| `utils/studyAreas.ts` | = `utils/studyAreas.ts` |
| `utils/theme.ts` | = `utils/theme.ts` (plus the 3.4 tokens) |

## Principle checks (step 3.7)

- **No UI file reads content or storage directly.** Only `services/contentLoader.ts` reads `CONTENT`
  (`utils/content.ts`), and only `storage/jsonStorage.ts` imports AsyncStorage. Their "lessons didn't
  load" fallback is `components/track/LessonsUnavailable.tsx`, in learner wording.)
- **No copied logic.** No block of 5 or more non-trivial lines appears in two places in `src/` (generated maps excluded).
- **Small files.** The largest file is `screens/OnboardingScreen.tsx` at 255 lines; nothing is over ~300.
- **No leftovers.** `rg "_updated|V2|picturesV2|TrackPlayer|lessonKit" src` finds nothing.

## What v3-cleanup adds over expo-web

- One `TRACKS` registry (`content/tracks.ts`) and typed content (`content/types.ts`); 13 tracks, including the 8 general
  tracks converted from the V1 lessons (step 2b.2).
- V3 pictures for every track (`components/lesson/pictures/`), checked by `scripts/validate-content.mjs`.
- The checkpoint recap, the unlock card built from the next phase, Reduce Motion for sheets, fix lines that stay
  visible, and the paid daily-goal bonus (step 3.4 decisions).
- `scripts/run-answers.mjs` and `scripts/generate-image-maps.mjs`.
