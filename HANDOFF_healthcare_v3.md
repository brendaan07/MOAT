# Handoff: Healthcare V3 import + content architecture

Summary of an investigation session (no code was changed). Repo: `/Users/brendanchong/Desktop/MOAT`, branch `expo-web`.

## 1. The task that started this

The user received a content pack to integrate: `/Users/brendanchong/Downloads/moat_healthcare_import/` (guide: `INTEGRATION.md` in that folder).

**What the pack contains**
- `assets/content/healthcare_python_v3.json`: Healthcare Python, 4 phases, 40 items, 160 questions
- `assets/content/healthcare_r_v3.json`: Healthcare R, 4 phases, 40 items, 160 questions
- `assets/content/healthcare_core_python_v3.json` / `healthcare_core_r_v3.json`: 1 phase each, 10 items, 40 questions. These replace the current `track_health_py.json` / `track_health_r.json`.
- `assets/content/healthcare_design.json`: measured layout, animation timings, bolts, confetti, 23 keyframes (reference spec, not code)
- `assets/images/healthcare/{icons,layers,devices}/`: 17 icons, catheter bag and jug layers, device count-up strips (`.webp`)

Totals: 100 items (50 lessons + 50 checkpoints), 400 questions (200 predict, 150 fix, 50 fill). There are no new subjects: it is new and expanded Healthcare learning paths, plus new picture types.

**Flow change:** each lesson is followed by its own checkpoint, and the next lesson unlocks after the checkpoint. The current app has one checkpoint per phase.

## 2. Compatibility findings (important)

The guide names files that do not match this repo:

| Guide says | Reality |
|---|---|
| `src/services/contentLoader_updated.ts` | Existed before cleanup commit `8c270fb`; now `src/services/contentLoader.ts` |
| `src/components/lessonKitV2_updated.tsx` | Existed before cleanup; split into `src/components/lessonV2/*` |
| `src/components/picturesV3.tsx` | Never existed on any branch. The old file was `picturesV2.tsx` |
| `assets/content/biology_r_v3.json` | Never existed on any branch |

- The guide says the picture types `tiles`, `ratebars`, `dots` and `steps` "already exist from Biology". They don't, neither now nor before cleanup.
- Conclusion: the guide was written against a newer, uncommitted "V3" version of the app. It's worth asking the content author for their `picturesV3.tsx` and V3 lesson kit.
- **The V3 JSON is not readable by the current app.** It uses different field names and a different nesting.
- **20 picture types are missing** from `src/components/lessonV2/pictures/index.tsx`: labelcard, dftable, lamps, device, drain, gcs_chart, wards, balance, flowmeter, transfusion, ward, trial, stays_pic, coverage, grid2, ldl, plus tiles, ratebars, dots, steps.
- Existing picture types: strip, readout, rows, bars, tubes, ph, machine, msg, belt, circuit, battery, drip, gauge, clock24, wristband, syringe, monitor, bpbars, curve.

## 3. How the current app works (V2)

**Choosing a track**
1. Onboarding saves `studyArea` and `language`.
2. `MainTabs.tsx` calls `hasTrack()`. If it's true, the Learn tab is `TrackPathScreen`; if not, it's `LearnScreen` (general lessons).
3. `useTrackStore` calls `loadTrack()`, which uses `trackFileFor()` in `contentLoader.ts` (a plain if/else):
   - `track_bio_r` for Biology research
   - `track_eng_py` for Engineering with Python
   - `track_health_py` / `track_health_r` for Healthcare with Python or R
4. JSON is bundled with `require()` in `src/utils/content.ts` (`CONTENT` map). It is cast with `as Track`, with no runtime validation.

**The two-layer content model**
- **Track files** (`track_*.json`) hold the structure: `phases[]` → `lessons[]` (ID + old-style questions) + one `checkpoint` per phase.
- **V2 lesson files** (`track_bio_r_lessons_v2.json` with 12 Biology lessons; `track_lessons_v2_more.json` with 5 Engineering Py, 5 Healthcare Py, 5 Healthcare R) are a flat `lessons[]` list, matched to the track **by lesson ID only**.
- `TrackFlowScreen` checks `v2Lesson(id)`. If a match exists, the lesson runs in `LessonPlayerV2`; otherwise it falls back to the old `TrackPlayer`.
- **Checkpoints always use the old `TrackPlayer`.**

**Screens.** There is one path screen and one player for all tracks; only the data differs.
- `TrackFlowScreen` is a state machine: `introV2 → lessonV2 → recapV2 → lessonDone → (projectBuilt → checkpointIntro → checkpoint → checkpointDone)`.
- `LessonIntroV2` shows `project`, `part`, `title`, `person`, `intro`, `file`, `script.length` and `start`.
- `LessonPlayerV2` keeps state (`idx`, `pick`, `checked`, `open`, `firstTry`, `missed`) and draws `q = lesson.questions[idx]`:
  - header: `q.word`, `q.ask`, hint bulb (`q.hint`)
  - picture card: `q.pics.map(p => <Picture p state=idle|go|nope/>)`, plus the science note (`q.science`)
  - code card: `q.code.map(<CodeLine/>)` numbered from `q.start`; `___` marks a fill blank; plus `q.earlier` and `q.codeNote`
  - answers: `<Answers>` for predict and fill, `<Paper>` for bug/fix, chips for build. Colours come from a `looks` table computed in the player.
  - Check compares `pick === q.correct`. `FeedbackSheet` shows `okTitle` / "Not quite", `q.eq`, `q.ok` or `q.fb[pick]`, `q.entry` and `q.bridge`.
- `<Picture>` is a `switch(p.type)`. An unknown type renders nothing.
- When the lesson ends, `finishRun()` calls `track.record()` (stars = first-try count), `app.creditTrack()` (bolts) and `track.addTime()`, and the store saves to AsyncStorage.
- Unlock rules (`useTrackStore`):
  - a lesson opens when the previous lesson is finished
  - the checkpoint opens when all lessons in the phase are finished
  - the next phase opens when all lessons and the checkpoint have full stars

## 4. V3 format (incoming)

One file per track: `{ track, design, phases[] }`. Each phase is `{ phase, title, coding_idea, order[], items[] }`.

- Items alternate lesson and checkpoint (`type: "lesson" | "checkpoint"`), 10 per phase.
- A lesson has 5 questions; a checkpoint has 3. IDs follow the pattern `XpP1L1` (lesson) / `XpP1C1` (checkpoint).
- Nesting is **track → phases[] → items[] → questions[]**. Items are contained in the phase, not referenced.

Field mapping, V3 → V2 (main ones):

| V3 | V2 |
|---|---|
| `script_file` | `file` |
| `start_button` | `start` |
| `recap.title` / `recap.subtitle` | `doneTitle` / `doneSub` |
| `notebook [{label, value}]` | `[[label, value]]` |
| `label` | `word` |
| `hint_before_check` | `hint` |
| `explanation_after_check` + `takeaway` | `ok` |
| `options[].feedback` | `fb{}` |
| `options[].correct` | `correct` |
| `next_bridge` | `bridge` |
| `science_note` / `code_note` | `science` / `codeNote` |
| `scene_label` | `label` |
| `picture` | `pics` |
| `worked` | `eq` |
| `display.first_line_number` | `start` |
| `known_from_earlier` / `display.earlier_note` | `earlier` |

- V3-only fields: `option_layout`, `display.code_font_px` / `code_row_pad_px` / `paper_font_px` / `row_height_px`, `hints_and_notes`, `xp`, `page_style`, `title_size_px`, `ai_context` (ignore; for a future chat feature).
- **V3 pictures** carry `correct_state` and `states.wrong_by_option.<id>`, so the picture shows the consequence of the specific wrong answer. V2 pictures only get `idle`, `go` or `nope`.

**Recommendation given:** adopt V3 as the single format; don't squash it into V2, which would lose per-option pictures and checkpoints. Treat pixel and layout fields as optional overrides with defaults in the components, and later convert Biology and Engineering to V3 and retire V2 and `TrackPlayer`.

**Integration work if done:**
1. Copy the assets in and register them in `CONTENT`.
2. Write V3 types.
3. Point `trackFileFor` at the V3 files for Healthcare.
4. Change the path, unlock logic and `TrackFlowScreen` to handle per-lesson checkpoint items.
5. Make the player read V3 fields, including option layout and no hints on checkpoints.
6. Build the 20 picture components (device strip and drain animation specs are in `INTEGRATION.md` §5).

## 5. Big-picture architecture brainstorm (user's future direction)

The user asked how to build a scalable POC, ignoring the current code. Advice given:

- **Hierarchy:** Track → Phase → Part (lesson | checkpoint) → Question is a simple tree.
- **Storage: Supabase (Postgres + Auth + Storage).** The main reason is updating content without app releases, not size.
  ```
  tracks(id, name, subject, language)
  phases(id, track_id, order, title)
  parts(id, phase_id, order, type, title, intro)
  questions(id, part_id, order, kind, content jsonb)
  profiles(user_id, name, track, language, is_premium)
  progress(user_id, part_id, stars, finished_at)
  ```
  - Structure goes in columns; question content goes in a `jsonb` column. These are rows, not files.
  - The app fetches the track outline first, then a part's questions on open, and caches them offline.
  - Images go in Storage or a CDN, with URLs stored in the database.
- **Auth** in the same Supabase project. **RLS is mandatory**: content is read-only for logged-in users, and users can access only their own `profiles` / `progress`. A server-side paywall can be done through RLS on premium content.
- **Supabase in production** is common for startups. It's plain Postgres, so there's no lock-in on data; auth is the stickiest part to migrate.
- **JSON is fine** as the data format. The real problem is having no schema. Use **Zod** as the single schema shared by the app and the content pipeline, and keep styling out of the content.
- **Content generation:**
  1. Generate one part at a time with the Claude API and structured outputs.
  2. Validate against the schema.
  3. **Run the code (Python/R) to verify the marked answer.**
  4. Human review.
  5. Publish to the database.
  - Hand-written source files (Markdown/YAML in git) are optional, with a script that uploads them.
- **Java:** not useful. The hierarchy is data, not behaviour. Use TypeScript everywhere, with discriminated unions (`kind`), so types are shared between the app and the backend.

## 6. Tech stack

**Current** (from `package.json` / `vercel.json`):
- TypeScript ~6.0; React Native 0.86; **Expo SDK 57**; React 19
- iOS, Android and web (`react-native-web`)
- React Navigation 7 (bottom tabs + native stack)
- `react-native-svg`, `@expo/vector-icons`, expo-blur, expo-font, expo-haptics
- React Context stores (`useAppStore`, `useTrackStore`); AsyncStorage
- RevenueCat (`react-native-purchases`; mocked in Expo Go, needs a dev build)
- Vercel for web (`expo export -p web` → `dist/`)
- No backend yet: `src/services/apiClient.ts` points at `localhost:8000` and is switched off.

**Proposed additions:**
- Supabase (Postgres, Auth, Storage, RLS, Edge Functions later), `@supabase/supabase-js`
- Zod
- Optional TanStack Query for caching
- A TypeScript content pipeline with the Claude API and a code runner

**iOS shipping:**
- **EAS Build** compiles on cloud Macs, so no local Xcode is needed, and manages signing.
- **EAS Submit** uploads to TestFlight and the App Store.
- **EAS Update** pushes JS-only fixes over the air.
- Needs an Apple Developer account ($99/yr). New native libraries still need a full build and App Store review.

## 7. Open decisions / next steps

- Integrate Healthcare V3 into the current app, or go straight to the Supabase architecture?
- Ask the content author for their `picturesV3.tsx` and V3 lesson kit, which would save building the 20 pictures from scratch.
- Decide how "Healthcare core" and the 4-phase Healthcare track relate on the path: run in sequence, or as two separate paths.
