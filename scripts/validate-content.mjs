#!/usr/bin/env node
// Checks every V3 lesson file against the rules in docs/v3-migration-plan.md (§1.4 and step 2a.0).
// Usage: node scripts/validate-content.mjs
// Prints one line per problem and exits 1 if there are any errors. Items marked `status` (not rebuilt yet) are warnings.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

// V3 files: every CONTENT entry whose name ends in _v3.
const content = read('src/utils/content_updated.ts');
const files = Object.fromEntries([...content.matchAll(/"([^"]+)":\s*require\('\.\.\/\.\.\/(assets\/content\/[^']+)'\)/g)].map((m) => [m[1], m[2]]));
const v3Files = Object.keys(files).filter((n) => n.endsWith('_v3'));

// Which track file goes with which V3 file, as loadTrack wires them: if (name === 'track_x') return withV3(t, 'file', 'prefix', ...)
const loader = read('src/services/contentLoader_updated.ts');
const tracks = [...loader.matchAll(/name === '([^']+)'\) return withV3\(t, '([^']+)', '([^']+)'/g)].map((m) => ({ track: m[1], file: m[2], prefix: m[3] }));

// Every image the app can show: the keys of V3_IMAGES.
const images = new Set([...read('src/utils/imageMapV3.ts').matchAll(/^\s*'([^']+)':\s*require\(/gm)].map((m) => m[1]));
const IMAGE = /\.(png|webp|jpe?g|gif)$/i;

let errors = 0;
let warnings = 0;
const error = (where, msg) => { errors++; console.log(`ERROR ${where}: ${msg}`); };
const warn = (where, msg) => { warnings++; console.log(`WARN  ${where}: ${msg}`); };
const missing = (v) => v === undefined || v === null || v === '';

function imagePaths(o, out = []) {
  if (typeof o === 'string') { if (IMAGE.test(o)) out.push(o); }
  else if (Array.isArray(o)) o.forEach((v) => imagePaths(v, out));
  else if (o && typeof o === 'object') Object.values(o).forEach((v) => imagePaths(v, out));
  return out;
}

function checkPicture(where, q, pic) {
  for (const k of ['type', 'label', 'correct_state']) if (missing(pic[k])) error(where, `picture has no ${k}`);
  const keys = new Set(Object.keys(pic.states?.wrong_by_option ?? {}));
  // Predict/fill: the player passes the picked option id. Fix: it passes the tapped line id, and Check needs a
  // replacement picked, so a wrong state shows for every line that offers a wrong replacement (the buggy line included).
  const wrong = q.kind === 'fix'
    ? Object.entries(q.fixes_by_line ?? {}).filter(([, fixes]) => fixes.some((f) => !f.correct)).map(([id]) => id)
    : (q.options ?? []).filter((o) => !o.correct).map((o) => o.id);
  const gaps = wrong.filter((id) => !keys.has(id));
  if (gaps.length) error(where, `picture "${pic.label ?? pic.type}" has no wrong state for ${q.kind === 'fix' ? 'line' : 'option'} ${gaps.join(', ')}`);
}

function checkQuestion(where, q) {
  if ('ai_context' in q) error(where, 'has ai_context (removed by D9)');
  if (!['predict', 'fill', 'fix'].includes(q.kind)) return error(where, `kind "${q.kind}" is not predict, fill or fix`);
  if (q.kind === 'fix') {
    const lines = q.lines ?? [];
    const bug = lines.find((l) => l.id === q.buggy_line);
    if (!bug) error(where, `buggy_line "${q.buggy_line}" is not one of the line ids`);
    else if (bug.given_correct) error(where, `buggy_line "${q.buggy_line}" is marked given_correct`);
    const right = (q.fixes_by_line?.[q.buggy_line] ?? []).filter((f) => f.correct);
    if (right.length !== 1) error(where, `the buggy line has ${right.length} correct replacements, needs exactly 1`);
  } else {
    const right = (q.options ?? []).filter((o) => o.correct);
    if (right.length !== 1) error(where, `${right.length} options marked correct, needs exactly 1`);
    else if (right[0].id !== 'a') error(where, `the correct option is "${right[0].id}", must be "a"`);
    if (q.kind === 'fill' && !(q.code ?? []).join('\n').includes('___')) error(where, 'fill code has no ___ blank');
  }
  for (const pic of q.picture ?? []) checkPicture(where, q, pic);
}

for (const name of v3Files) {
  const data = JSON.parse(read(files[name]));
  const ids = new Set();
  for (const ph of data.phases ?? []) {
    const at = `${name} P${ph.phase}`;
    const items = ph.items ?? [];
    const lessons = items.filter((i) => i.type === 'lesson');
    const cps = items.filter((i) => i.type === 'checkpoint');
    if (lessons.length !== 5) error(at, `${lessons.length} lessons, needs 5`);
    if (cps.length !== 1) error(at, `${cps.length} checkpoints, needs exactly 1`);
    else {
      if (cps[0].part !== 5) error(at, `checkpoint ${cps[0].id} has part ${cps[0].part}, needs 5`);
      if (items[items.length - 1] !== cps[0]) error(at, `checkpoint ${cps[0].id} is not the last item`);
    }
    for (const it of items) {
      const where = `${name} ${it.id}`;
      if (ids.has(it.id)) error(where, 'item id is used twice');
      ids.add(it.id);
      if (it.status) { warn(where, `not rebuilt yet (status: ${it.status})`); continue; }
      const qs = it.questions ?? [];
      if (qs.length !== 5) error(where, `${qs.length} questions, needs 5`);
      if ((it.notebook ?? []).length !== qs.length) error(where, `notebook has ${(it.notebook ?? []).length} entries for ${qs.length} questions`);
      qs.forEach((q, i) => checkQuestion(`${where} q${i + 1}`, q));
      for (const p of new Set(imagePaths(it))) if (!images.has(p)) error(where, `image ${p} is not in src/utils/imageMapV3.ts`);
    }
  }
  // Every lesson the track file lists must be a V3 lesson item.
  for (const tr of tracks.filter((t) => t.file === name)) {
    const track = JSON.parse(read(files[tr.track]));
    for (const p of track.phases ?? []) for (const l of p.lessons ?? []) {
      const m = l.id.match(new RegExp(`^${tr.prefix}_p(\\d+)_l(\\d+)$`));
      const item = m && data.phases?.find((x) => x.phase === +m[1])?.items?.find((i) => i.type === 'lesson' && i.part === +m[2]);
      if (!item) error(`${tr.track} ${l.id}`, `no V3 lesson item in ${name}`);
    }
  }
}

console.log(`\n${v3Files.length} V3 files, ${errors} errors, ${warnings} warnings.`);
process.exit(errors ? 1 : 0);
