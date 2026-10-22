# MOAT: React Native (Expo + TypeScript)

MOAT teaches coding through project tracks: each study area and language has a track of phases, each phase a few short
lessons and a checkpoint, and every lesson builds part of a small real-world project. The app started as a migration
of the MOAT SwiftUI app and runs on iOS, Android and the web from one Expo codebase.

## Run it

```bash
npm install
npx expo install --fix   # pins every package to the Expo SDK your Expo Go supports
npx expo start           # scan the QR code with Expo Go
npm run typecheck        # must report 0 errors
```

The project targets Expo SDK 57. If your Expo Go app supports a different SDK, run `npx expo install expo@<sdk> --fix`
first. If the phone can't reach your computer over Wi-Fi or a hotspot, `npx expo start --tunnel` works through
`@expo/ngrok`.

More notes are in `docs/`: the backlog of features decided but not built, the Playwright testing notes, the handover
notes for the Healthcare and Finance content, the migration plan that produced this layout (`v3-migration-plan.md`)
and its final review against the `expo-web` branch (`expo-web-parity.md`).

## Web version and Vercel

The same app runs in the browser through `react-native-web`, and is deployed to Vercel as a static site.

**While coding**, use the dev server. It builds in memory in development mode (readable code, `__DEV__` true, React
warnings) and reloads on every save:

```bash
npm run web              # same as npx expo start --web
```

**Before pushing anything that Vercel will deploy**, build and serve the production version. This is what Vercel
hosts, so it catches problems the dev server hides:

```bash
npm run build:web        # expo export -p web: writes the minified app to dist/
npx serve dist --single  # serves dist/ like Vercel does; --single sends every URL to index.html
```

Open `http://localhost:3000` and check:

- The app gets past the splash screen and the browser console has no red errors.
- Opening a lesson changes the URL (`/phase/<n>/play/<lesson id>`), refreshing keeps you on it, and the browser back
  button goes back a screen.
- Images and fonts load.

`vercel.json` runs the same build (`npx expo export -p web`), serves `dist/`, and rewrites every URL to `/` so deep
links and refreshes work. `dist/` is in `.gitignore`; Vercel builds it itself on every push to the branch it deploys.

## Project structure

| Folder | What it holds |
|---|---|
| `src/screens` | Every screen: onboarding, splash, Workshop and Profile, and `track/` for the Learn tab: the path (`TrackPathScreen`), a phase's page (`TrackPhaseScreen`) and one run of a lesson or checkpoint (`TrackFlowScreen`). `track/lesson/` holds the goal screen, the lesson player and the recap; `track/results/` the screens after a lesson or checkpoint. |
| `src/components` | Shared UI. `ui.tsx` (cards, the chunky button, bundled images), `icons.tsx`, `CloseButton.tsx`, `QuitSheet.tsx`, `StatChipsRow.tsx`. Folders: `lesson/` (answers, code lines, fix questions, notebook, feedback sheet, notes, animations, confetti) with `lesson/pictures/` (every picture a question can show, and the `RENDERERS` list), and `track/` (bolt counter, robot, project card, phase pictures, stars, week strip). |
| `src/content` | `tracks.ts`, the `TRACKS` registry (which area and language open which track, its files and app ids, plus each field's chip and icon), and `types.ts`, the types for the lesson and track JSON. |
| `src/services` | `contentLoader.ts`, the only code that reads the JSON: the learner's track (`loadTrack`) and the player-ready lessons (`lessonFor`). |
| `src/hooks` | App state as React context (`useAppStore` for the profile, bolts and streak; `useTrackStore` for the track and its progress), `useFinishRun` (what finishing a run does), and small animation hooks. |
| `src/storage` | AsyncStorage persistence (`jsonStorage.ts` is the shared load and save). |
| `src/types` | The saved progress models and a run's result. |
| `src/utils` | Theme, `rewards.ts` (every bolt and goal number), `progressRules.ts` (stars, bolts, the streak and what unlocks what, as pure functions), `motion.ts` (easing curves), code colouring, day keys, study areas, and the content and image registries. |
| `scripts` | Content tools: the validator, the answer runner and the image map generator (see below). |
| `assets` | Content (`assets/content`), the robot, logo and background pictures, lesson pictures in `assets/images/<folder>/`, and fonts. |

## Tracks and content

A track is one `TRACKS` entry in `src/content/tracks.ts`, and two files in `assets/content`:

- the **track file** (`track_*.json`): the path's phases, each with its project, picture, skill and project code, and
  what the checkpoint unlocks;
- the **lesson file** (`<track>.json`, for example `healthcare_python.json`): each phase's lessons and checkpoint, with
  their questions (predict, fill or fix), pictures, notes and notebook. `src/content/types.ts` describes the format.

Onboarding offers a language for a study area only when a track exists for that pair, and a saved pair without one
goes back to the language step.

**Ids.**

- Content ids stay in the JSON as written: items are `BioP1L1`, `XpP2C`, `GenPyP1L3`, … and questions are
  `<itemId>_q<n>`. Stars and bolts are saved under the question ids.
- App ids come only from the registry `prefix`: lesson `k` of phase `n` is `<prefix>_p<n>_l<k>` (`hx_py_p2_l3`), and a
  phase checkpoint is the entry's `checkpointId(n)` (`hx_py_cp2`; Biology research uses `bio_p2_cp`). Lesson progress
  and URLs (`/phase/<n>/play/<app id>`) use these.

**Adding a track.**

1. Write the lesson file and the track file. Every lesson has 5 questions, and the right option of a predict or fill
   question has id `a`. A phase has 5 lessons and one checkpoint (`part: 5`, after the lessons); a track can declare a
   smaller shape in its lesson file's `track` block (`lessons_per_phase`, `checkpoints: false`), as the general tracks do.
2. Add both files to `src/utils/content.ts`, and one line to `TRACKS` with the area, language, files, a new `prefix`,
   the field (`domain`), the display name and `checkpointId`. A new study area also goes in `STUDY_AREAS`
   (`src/utils/studyAreas.ts`).
3. Put any new pictures under `assets/images/<folder>/` and run `node scripts/generate-image-maps.mjs`. A new picture
   type needs a renderer in `RENDERERS` (`src/components/lesson/pictures/index.tsx`).
4. Check the content (below), then open the track in the app: pick the area and language in onboarding and play its
   first lesson.

**Checking content.**

- `node scripts/validate-content.mjs` checks every lesson file: the shape, one right option with id `a`, fix questions,
  a renderer and a wrong-answer state for every picture, every image registered, and every track-file lesson present.
  It must report 0 errors.
- `node scripts/run-answers.mjs assets/content/<track>.json [item id]` runs each question's code and prints the real
  output beside the marked answer, to compare by eye. Python runs with `python3`; R with `Rscript`, or
  `conda run -n moat-r Rscript`; JavaScript with `node`; SQL with `sqlite3` against `scripts/fixtures/sql_menu.sql`;
  Java with `java` (11 or later). MATLAB isn't run.
- `node scripts/generate-image-maps.mjs` writes `src/utils/images.ts` (the app's own pictures in `assets/images`) and
  `src/utils/lessonImages.ts` (every lesson picture, keyed by the path the content names). React Native needs a static
  `require` for every bundled picture, so run it after adding or removing one; it also lists byte-identical files,
  which should be one file the content points at instead.

## Swift to React Native mapping

| Swift | React Native / Expo | Works in Expo Go |
|---|---|---|
| SwiftUI tab view | `@react-navigation/bottom-tabs` | Yes |
| `fullScreenCover` (a lesson or checkpoint run) | Native stack, `presentation: 'fullScreenModal'` | Yes |
| `UserDefaults` (`moat.progress.v1`, `moat.track.v1`) | AsyncStorage, same keys | Yes |
| Shapes, `Canvas`, `Path` | `react-native-svg` | Yes |
| SwiftUI animations, `phaseAnimator`, `keyframeAnimator` | React Native `Animated` | Yes |
| Horizon, Baloo 2 and Atkinson Hyperlegible fonts | `expo-font` (Baloo 2 and Atkinson are under the SIL Open Font License, included in `assets/fonts`) | Yes |
| SF Symbols | `@expo/vector-icons` (Ionicons) | Yes |

## Where each feature lives

| Feature | Where |
|---|---|
| Splash, then onboarding (or the language step for a saved pair with no track) or the tabs | `navigation/RootNavigator.tsx` |
| Onboarding: age slider, education menu, 7 study areas, languages that have a track | `screens/OnboardingScreen.tsx` |
| Learn path: zig-zag of lessons and checkpoints, phase banners, locked phases, scroll to current | `screens/track/TrackPathScreen.tsx`, `hooks/useScrollToCurrent.ts` |
| Tappable streak, bolts and minutes bubbles | `components/StatChipsRow.tsx` |
| A phase's page: picture, parts, checkpoint, what comes later | `screens/track/TrackPhaseScreen.tsx` |
| Goal screen, five questions with pictures, recap; checkpoints on a navy page with a green confetti recap | `screens/track/lesson/`, `components/lesson/` |
| Lesson pictures that act out the answer picked, and stay still with Reduce Motion | `components/lesson/pictures/` |
| Custom quit warning instead of the system pop-up | `components/QuitSheet.tsx` |
| Bolt counter: count-up, glow, sparks, bounce | `components/track/BoltPill.tsx` |
| Lesson complete, project built, checkpoint results and what they unlock | `screens/track/results/` |
| Stars, 10 bolts per first-try question, +30 perfect bonus, +20 for the daily goal, replay payouts, minutes per day | `utils/progressRules.ts`, `utils/rewards.ts`, `hooks/useFinishRun.ts` |
| Workshop: Blob on the world backdrop | `screens/WorkshopScreen.tsx` |
| Profile: streak, stats, 8 badges, settings, reset | `screens/ProfileScreen.tsx` |

## Known differences from the iOS app

- **Icons.** Ionicons replaces SF Symbols.
- **Education menu.** A modal list replaces the iOS pop-up `Menu`.
- **Reset confirmation.** A native `Alert` replaces the `confirmationDialog`.

## Troubleshooting

- **A track doesn't open, or onboarding keeps asking for a language.** The area and language have no `TRACKS` entry,
  or one of its files is missing from `src/utils/content.ts`. `node scripts/validate-content.mjs` reports the second.
- **A picture is blank.** Its image isn't registered: run `node scripts/generate-image-maps.mjs`. For an app picture,
  the name passed to `BundleImage` must match the file name without `.png`.
- **Type errors.** Run `npm run typecheck`. It should report 0 errors.
