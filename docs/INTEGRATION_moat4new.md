# moat4new: what changed

The whole app, with every Healthcare and Finance lesson built so far added to the tracks. TypeScript: 0 errors in `src/`. `npx expo export --platform android` bundles cleanly (239 assets).

## New files

| Path | What it is |
|---|---|
| `assets/content/healthcare_python_v3.json`, `healthcare_r_v3.json` | Healthcare phases 1 to 5: 50 items, 200 questions each |
| `assets/content/finance_python_v3.json` | Finance Python phase 1: 10 items, 40 questions |
| `docs/healthcare_design.json` | Measured layout, type and animation timings, bolts, confetti, keyframes |
| `assets/content/track_hx_py.json`, `track_hx_r.json`, `track_fin_py.json` | The path screen's tracks for these lessons |
| `assets/images/healthcare/`, `assets/images/finance/` | Icons, liquid layers and device count-up strips (173 images) |
| `src/utils/imageMapV3.ts` | Generated: a static `require` for every image the content names |

## Changed files

**`src/utils/content_updated.ts`**: registers `track_hx_py`, `track_hx_r` and `track_fin_py`.

**`src/services/contentLoader_updated.ts`**
- `TRACK_LANGUAGES` adds `'Business & finance': ['Python']`.
- `trackFileFor`: Healthcare Python → `track_hx_py`, Healthcare R → `track_hx_r`, Business & finance Python → `track_fin_py`. The older `track_health_py.json` and `track_health_r.json` stay in the project but are no longer used.

**`src/components/lessonKitV2_updated.tsx`**
- Imports the three new content files.
- `fromV3()` takes the track's id prefix, language, field and name (Biology stays the default, so its ids are unchanged).
- Registers every Healthcare and Finance lesson and checkpoint. App ids: `hx_py_p{phase}_l{part}`, `hx_r_…`, `fin_py_…`; checkpoints use `_c{part}`.
- New field `fin`: chip "Finance", cash icon, "Tap for the finance context."

**`src/components/picturesV3.tsx`**
- Tiles, ratebars, dots and steps from Healthcare use the existing renderers (their settings are converted to Biology's `args`/`options` layout in the content files).
- `DeviceV3`: thermometer, glucose meter, scale, card terminal and calculator. The device image stays still and its screen strip steps from the start value to the reading over 0.95 s, the warning backlight lighting on the last frame, as on the canvases. Reduce Motion shows the final frame.
- `StateCardV3`: every other Healthcare and Finance picture shows its icon, which pops on Check, and the result for the answer given (orange for a wrong answer, with the existing shake).

## Still to port for full fidelity

These pictures use `StateCardV3` in the app; the canvas pages hold their full scene animation, and each picture's JSON (`assets`, `description`, `correct_state`, `states.wrong_by_option`) has what a native version needs:

`labelcard`, `dftable`, `lamps`, `drain`, `gcs_chart`, `wards`, `balance`, `flowmeter`, `transfusion`, `ward`, `trial`, `stays_pic`, `coverage`, `grid2`, `ldl`, and Finance's `till` card tap and receipt, `piggy` coins into the slot and `change` notes and coins (the till and calculator screens already count up through `DeviceV3`).

## Not used yet

Each question has `ai_context` for a later chat feature; nothing reads it.
