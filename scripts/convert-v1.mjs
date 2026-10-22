#!/usr/bin/env node
// Converts a V1 general lesson file (assets/content/lessons_*.json, deleted in step 3.1; recover with git show 14e1e03:<path>)
// into a lesson file and its track file (plan step 2b.2).
// Usage: node scripts/convert-v1.mjs <v1 name> <lesson name> <track name> <app prefix> <item prefix> <track title> <language> <area>
//   e.g. node scripts/convert-v1.mjs lessons_general general_python track_gen_py gen_py GenPy "General Python" Python General
// Restructure only (2b.0): keeps the V1 lessons as they are (4 per phase, no checkpoint), maps what V1 has, and rewrites
// the V1-only kinds to the closest V3 kind:
//   choice with ___ -> fill; other choice -> predict; judge -> predict (True/False); bug -> fix;
//   build -> fill (the token that pairs with a distractor is blanked); match -> predict (which line does one job).
// Pictures, per-option feedback and notes are left out; the player falls back without them.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const [v1Name, v3Name, trackName, appPrefix, itemPrefix, title, language, area] = process.argv.slice(2);
if (!area) {
  console.log('Usage: node scripts/convert-v1.mjs <v1> <v3> <track> <app prefix> <item prefix> <title> <language> <area>');
  process.exit(1);
}
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const content = (n) => join(root, 'assets/content', `${n}.json`);
const v1 = JSON.parse(readFileSync(content(v1Name), 'utf8'));
const EXT = { Python: 'py', R: 'R', SQL: 'sql', JavaScript: 'js', MATLAB: 'm', Java: 'java' }[language];

const lines = (code) => (code ? code.split('\n') : []);
const short = (s, n) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);
const ordered = (options, right) => [right, ...options.filter((o) => o !== right)].map((label, i) => ({
  id: 'abcdefgh'[i], label, correct: i === 0, feedback: null,
}));

/** Joins build tokens into one line of code: no space inside brackets or before , ; : and calls. */
function join1(tokens) {
  let out = '';
  for (const t of tokens) {
    const prev = out.slice(-1);
    const tight = /^[)\],;:.]/.test(t) || (t === '(' && /[\w.]$/.test(out)) || prev === '(' || prev === '[' || out === '';
    out += (tight ? '' : ' ') + t;
  }
  return out;
}

/** How alike a distractor is to an answer token, to pick which token a build question blanks. */
const OPS = new Set(['+', '-', '*', 'x', '/', '<', '>', '=', '==', '<=', '>=']);
function likeness(t, d) {
  const bare = (s) => s.replace(/^["']|["']$/g, '');
  if (bare(t) === bare(d)) return 3;
  if (/^\w+\(/.test(t) && /^\w+\(/.test(d)) return 2;
  if (OPS.has(t) && OPS.has(d)) return 2;
  if (/^\w+$/.test(t) && /^\w+$/.test(d)) return 1;
  return 0;
}

function convertQuestion(q) {
  const base = {
    number: 0, kind: null, label: null, ask: q.prompt, xp: 10, known_from_earlier: [],
    explanation_after_check: q.explanation ?? '', takeaway: null, next_bridge: null, hint_before_check: q.hint ?? null,
    code_note: null, science_note: null, scene_label: null, worked: [],
  };
  const right = q.answer?.[0];
  if (q.kind === 'choice' || q.kind === 'judge') {
    const fill = q.kind === 'choice' && (q.code ?? '').includes('___');
    return { ...base, kind: fill ? 'fill' : 'predict', label: fill ? 'Fill' : 'Predict', code: lines(q.code), options: ordered(q.options, right) };
  }
  if (q.kind === 'bug') {
    const ids = q.options.map((_, i) => 'abcdefgh'[i]);
    const bug = ids[q.options.indexOf(right)];
    const fixes = {};
    q.options.forEach((line, i) => {
      fixes[ids[i]] = ids[i] === bug
        ? [{ id: 'f0', replacement: q.fix, correct: true, feedback: null }, { id: 'f1', replacement: line, correct: false, feedback: 'That leaves the mistake in place.' }]
        : [{ id: `${ids[i]}0`, replacement: line, correct: false, feedback: 'This line was already right.' }];
    });
    return {
      ...base, kind: 'fix', label: 'Fix', script_file: `lesson.${EXT}`,
      lines: q.options.map((code, i) => ({ id: ids[i], code, given_correct: false })),
      buggy_line: bug, fixes_by_line: fixes, wrong_line_feedback: {}, output_after_fix: null,
    };
  }
  if (q.kind === 'build') {
    const answer = q.answer;
    const decoys = q.options.filter((o) => !answer.includes(o));
    let best = { score: -1, i: answer.length - 1 };
    answer.forEach((t, i) => decoys.forEach((d) => {
      const s = likeness(t, d);
      if (s > best.score) best = { score: s, i };
    }));
    const blanked = answer.map((t, i) => (i === best.i ? '___' : t));
    return { ...base, kind: 'fill', label: 'Fill', code: [...lines(q.code), join1(blanked)], options: ordered([answer[best.i], ...decoys], answer[best.i]) };
  }
  if (q.kind === 'match') {
    const k = Math.min(1, q.options.length - 1); // the second pair
    return {
      ...base, kind: 'predict', label: 'Predict', ask: `Which line does this: ${q.answer[k].replace(/^./, (c) => c.toLowerCase())}?`,
      code: lines(q.code), options: ordered(q.options, q.options[k]),
    };
  }
  throw new Error(`unknown kind ${q.kind} in ${q.id}`);
}

const items = [];
const trackPhases = [];
for (const ph of v1.phases) {
  const n = ph.number;
  const lessons = ph.lessons.filter((l) => !l.game).map((l, li) => {
    const qs = l.questions.map(convertQuestion);
    qs.forEach((q, i) => { q.number = i + 1; });
    return {
      id: `${itemPrefix}P${n}L${li + 1}`, type: 'lesson', part: li + 1, title: l.title, person: 'Your coding coach',
      intro: `${ph.title}: ${ph.subtitle ?? l.title}.`, script_file: `lesson.${EXT}`, start_button: 'Start',
      notebook: qs.map((q) => ({
        label: short(q.ask, 32),
        value: q.kind === 'fix' ? 'fixed' : short(q.options[0].label.split('\n').join(', '), 28),
      })),
      recap: { title: 'Lesson done', subtitle: l.title, celebration: 'standard recap' }, page_style: 'lesson_cream', questions: qs,
    };
  });
  items.push({ phase: n, title: ph.title, coding_idea: ph.subtitle ?? ph.title, items: lessons });
  trackPhases.push({
    number: n, area, project: ph.title, picture: '', skill: ph.subtitle ?? ph.title,
    parts: lessons.map((l) => [l.title, ph.title]), code: [],
    lessons: lessons.map((l) => ({ id: `${appPrefix}_p${n}_l${l.part}`, part: l.part, title: l.title })),
    checkpoint: { id: `${appPrefix}_cp${n}`, name: ph.title, unlock: [] },
  });
}

const v3 = {
  track: {
    id: appPrefix, name: title, language, phases: trackPhases.length, lessons_per_phase: 4, checkpoints: false,
    item_order_rule: 'Each phase has four lessons in order and no checkpoint yet (restructured from the V1 general lessons).',
  },
  phases: items,
};
writeFileSync(content(v3Name), JSON.stringify(v3, null, 1));
writeFileSync(content(trackName), JSON.stringify({
  id: appPrefix, title: area, language, phases: trackPhases,
  cycle2: { area, project: 'More phases on the way', picture: '', titles: [], later: [] },
}, null, 1));
console.log(`${v1Name} -> ${v3Name} + ${trackName}: ${items.reduce((n, p) => n + p.items.length, 0)} lessons`);
