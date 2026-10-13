# MOAT: React Native (Expo + TypeScript)

This is a migration of the MOAT SwiftUI app to React Native with Expo and TypeScript. It reproduces the Swift app's screens, navigation, state, storage, networking and interactions as closely as practical.

## Run it

```bash
npm install
npx expo install --fix   # pins every package to the Expo SDK your Expo Go supports
npx expo start           # scan the QR code with Expo Go
npm run typecheck        # must report 0 errors
```

The project targets Expo SDK 57. If your Expo Go app supports a different SDK, run `npx expo install expo@<sdk> --fix` first. If the phone cannot reach your computer over Wi-Fi or a hotspot, `npx expo start --tunnel` works through `@expo/ngrok`.

More notes are in `docs/`: the codebase handover PDF and the Playwright testing notes.

## Project structure

| Folder | What it holds |
|---|---|
| `src/screens` | Every screen. `lesson/` is the general-path lesson player (one component per question kind), `games/` the loop and stage mini-games, `track/` the project tracks (path, phase page, players, results; `track/v2/` is the new-style lesson player, `track/questions/` and `track/results/` hold the per-kind pieces). |
| `src/components` | Shared UI. `ui.tsx` (cards, buttons, images), `icons.tsx`, `CloseButton.tsx`, `QuitSheet.tsx`, `StatChipsRow.tsx`, `gameKit.tsx` (code playback), `PaywallOverlay.tsx`. Folders: `path/` (the climbing path), `lesson/` (top bar and finish screen), `track/` (bolt counter, project card, robot, feedback sheet, stars), `lessonV2/` (new-style lesson pieces and `pictures/`). |
| `src/navigation` | The root stack (modals for lessons, games, the track flow and evolution) and the bottom tabs. |
| `src/hooks` | App state as React context (`useAppStore`, `useTrackStore`), `useFinishRun` (what finishing a track lesson does), plus small animation hooks. |
| `src/services` | The API client, the lesson loader, the game catalog and RevenueCat. |
| `src/storage` | AsyncStorage persistence (`jsonStorage.ts` is the shared load/save helper). |
| `src/types` | The data models. |
| `src/utils` | Theme, `rewards.ts` (every bolt number), `progressRules.ts` (how finishing a lesson changes progress), day keys, code joining and colouring, study areas, and the generated image and content registries. |
| `assets` | Robot pictures, backgrounds, the Horizon font and every lesson file. |

`src/utils/images.ts` and `src/utils/content.ts` are generated lists of `require()` calls, because React Native needs a static `require` for every bundled file. When you add a picture to `assets/images` or a lesson file to `assets/content`, add its line there too.

## Lesson content

| File | Used for |
|---|---|
| `lessons_<field>.json` | General-path lessons for a field (Healthcare, Biology research and Health sciences share `lessons_life_sciences.json`). |
| `lessons_r`, `_sql`, `_javascript`, `_matlab`, `_java` | General-path lessons for a language other than Python. |
| `track_*.json` | Project tracks (Biology research in R, Engineering in Python, Healthcare in Python and R). |
| `track_bio_r_lessons_v2.json`, `track_lessons_v2_more.json` | New-style lessons that replace a track lesson with the same id. |

## Swift to React Native mapping

| Swift | React Native / Expo | Works in Expo Go |
|---|---|---|
| SwiftUI tab view | `@react-navigation/bottom-tabs` | Yes |
| `fullScreenCover` (lessons, games, track flow) | Native stack, `presentation: 'fullScreenModal'` | Yes |
| `sheet` (evolution) | Native stack, `presentation: 'modal'` | Yes |
| `UserDefaults` (`moat.progress.v1`, `moat.track.v1`) | AsyncStorage, same keys and same JSON shape | Yes |
| `URLSession` (`/lessons`, `/explain`) | `fetch` with the same timeouts (8s, 15s) | Yes |
| Shapes, `Canvas`, `Path` | `react-native-svg` | Yes |
| SwiftUI animations, `phaseAnimator`, `keyframeAnimator` | React Native `Animated`, same timings | Yes |
| `UINotificationFeedbackGenerator`, `sensoryFeedback` | `expo-haptics` | Yes |
| Horizon, Baloo 2 and Atkinson Hyperlegible fonts | `expo-font` (Baloo 2 and Atkinson are under the SIL Open Font License, included in `assets/fonts`) | Yes |
| Paywall blur | `expo-blur` | Yes |
| SF Symbols | `@expo/vector-icons` (Ionicons) | Yes |
| RevenueCat iOS SDK | `react-native-purchases` | Partly, see below |

## Expo Go compatibility

Everything runs in Expo Go except real in-app purchases.

`react-native-purchases` detects Expo Go and switches to its **Preview API Mode**: the paywall, offerings and entitlement checks all run, but purchases are mocked. Nothing was removed.

To test real purchases, move to a **development build**:

```bash
npx expo install expo-dev-client
eas build --profile development
```

Stay on Expo Go for day-to-day work, and make a development build before testing payments or releasing.

## Where each feature lives

| Feature | Where |
|---|---|
| Splash: 1.5s, then onboarding or tabs | `navigation/RootNavigator.tsx` |
| Onboarding: age slider and under-13 note, education menu, 7 areas, language step | `screens/OnboardingScreen.tsx` |
| Learn path: zig-zag, phase banners, Premium lock, scroll to current, robot by current lesson | `screens/LearnScreen.tsx`, `components/path/` |
| Tappable streak, bolts and minutes bubbles | `components/StatChipsRow.tsx` |
| Lessons: choice, build, judge, bug, match | `screens/lesson/LessonScreen.tsx`, `screens/lesson/questions/` |
| One retry per wrong question; 5 bolts per correct answer, +10 for finishing | `screens/lesson/LessonScreen.tsx`, numbers in `utils/rewards.ts` |
| Hints always shown under 13; haptics on check | `screens/lesson/LessonScreen.tsx` |
| Explain more (hidden by `useAIExplanations = false`) | `screens/lesson/LessonFeedback.tsx`, `services/apiClient.ts` |
| Custom quit warning instead of the system pop-up | `components/QuitSheet.tsx` |
| Loop games (plant, wheel, fund) with step-by-step code playback | `screens/games/LoopGame.tsx` |
| Stage labs (GC content, duty cycle, conversion), 5 parts each | `screens/games/StageGame.tsx` |
| Robot evolution when a phase unlocks a form | `screens/EvolutionScreen.tsx`, `utils/progressRules.ts` |
| Workshop: forms, parts, rotated antennas | `screens/WorkshopScreen.tsx` |
| Profile: streak, stats, 9 badges, settings, reset, subscriptions | `screens/ProfileScreen.tsx` |
| Paywall: Premium and Expert, confetti, purchase | `components/PaywallOverlay.tsx` |
| Project tracks: path, phase page, stars, replay | `screens/track/TrackPathScreen.tsx`, `TrackPhaseScreen.tsx` |
| Track lessons and checkpoints (plan, code, predict, debug, build) | `screens/track/TrackPlayer.tsx`, `screens/track/questions/` |
| New-style lessons: goal screen, five questions with pictures, recap | `screens/track/v2/`, `components/lessonV2/` |
| Bolt counter: count-up, glow, sparks, bounce | `components/track/BoltPill.tsx` |
| Lesson complete, project built, checkpoint results | `screens/track/results/` |
| Star rules, +30 perfect bonus, replay payouts, minutes per day | `hooks/useTrackStore.tsx`, `utils/rewards.ts` |

## Fixed during migration

- **Mini-games for Healthcare and Business learners.** The Swift game catalog still checked the old area names ("Health sciences", "Business") after they were renamed, so these learners got no mini-games. `services/gameCatalog.ts` uses the current names.
- **Bolts from new-style lessons.** The new-style player recorded stars but never paid the bolts into the account or updated the streak. Both track players now finish through `hooks/useFinishRun.ts`.

## Known differences from the iOS app

- **Icons.** Ionicons replaces SF Symbols.
- **Education menu.** A modal list replaces the iOS pop-up `Menu`.
- **Reset confirmation.** A native `Alert` replaces the `confirmationDialog`.
- **Mini-game art.** The plant, wheel and fund drawings were rebuilt from the Swift drawing code. Some sizes in the Swift version came from layout modifiers, so they may differ by a few points.

## Troubleshooting

- **"Lessons didn't load".** The learner's lesson file is empty or has no `phases` list. Check the file in `assets/content` and its line in `src/utils/content.ts`.
- **A picture is blank.** Its line is missing from `src/utils/images.ts`, or the name passed to `BundleImage` does not match the file name without `.png`.
- **Type errors.** Run `npm run typecheck`. It should report 0 errors.
