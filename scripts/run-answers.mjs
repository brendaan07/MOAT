#!/usr/bin/env node
// Runs each V3 question's code and prints the real output beside the marked answer (plan D7). A review aid: it doesn't
// decide pass/fail. Usage: node scripts/run-answers.mjs <v3 file> [item id]
// Python runs with python3; R with Rscript, or `conda run -n moat-r Rscript` when that environment exists.
// Every question's code runs after its known_from_earlier lines, as the learner reads it.
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const [file, only] = process.argv.slice(2);
if (!file) {
  console.log('Usage: node scripts/run-answers.mjs <v3 file> [item id]');
  process.exit(1);
}
const data = JSON.parse(readFileSync(file, 'utf8'));
const language = (data.track?.language ?? 'Python').toLowerCase();

const has = (cmd, args) => spawnSync(cmd, args, { stdio: 'ignore' }).status === 0;
// [command, args before the file, file name, wrap(lines) -> file text]
const plain = (lines) => lines.join('\n') + '\n';
function runner() {
  if (language === 'python') return has('python3', ['--version']) ? ['python3', [], 'q.py', plain] : null;
  if (language === 'r') {
    if (has('Rscript', ['--version'])) return ['Rscript', [], 'q.R', plain];
    if (has('conda', ['run', '-n', 'moat-r', 'Rscript', '--version'])) return ['conda', ['run', '-n', 'moat-r', 'Rscript'], 'q.R', plain];
    return null;
  }
  if (language === 'javascript') return has('node', ['--version']) ? ['node', [], 'q.js', plain] : null;
  // SQL questions read the café menu table, loaded first from scripts/fixtures/sql_menu.sql.
  if (language === 'sql') {
    const fixture = readFileSync(new URL('./fixtures/sql_menu.sql', import.meta.url), 'utf8');
    return has('sqlite3', ['-version']) ? ['sqlite3', ['-batch', ':memory:'], 'q.sql', (lines) => fixture + plain(lines), true] : null;
  }
  // Java snippets are statements: wrap them in a main method and run the file directly (Java 11+).
  if (language === 'java') {
    return has('java', ['-version']) ? ['java', [], 'Main.java', (lines) => `public class Main {\n  public static void main(String[] args) {\n${lines.map((l) => `    ${l}`).join('\n')}\n  }\n}\n`] : null;
  }
  return null; // MATLAB: no runtime here; answers are checked by reading.
}
const rt = runner();
if (!rt) console.log(`No runtime for ${data.track?.language ?? 'Python'} found: printing the code and marked answers only.\n`);

const dir = mkdtempSync(join(tmpdir(), 'moat-answers-'));
function run(lines) {
  if (!rt) return '(not run)';
  const path = join(dir, rt[2]);
  writeFileSync(path, rt[3](lines));
  try {
    // sqlite3 takes ".read <file>" as its SQL argument; the others take the file itself.
    const args = rt[4] ? [...rt[1], `.read ${path}`] : [...rt[1], path];
    return execFileSync(rt[0], args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 30000 }).trimEnd();
  } catch (e) {
    // conda run adds its own lines after R's message; keep R's.
    const lines = (e.stderr || e.stdout || e.message).toString().trim().split('\n').filter((l) => !/^ERROR conda|Execution halted/.test(l));
    return `ERROR: ${lines.slice(-2).join(' | ')}`;
  }
}
const indent = (s) => s.split('\n').map((l) => `      ${l}`).join('\n');

for (const ph of data.phases ?? []) for (const it of ph.items ?? []) {
  if (only && it.id !== only) continue;
  if (it.status) { console.log(`== ${it.id}: skipped (${it.status})\n`); continue; }
  console.log(`== ${it.id} ${it.title}`);
  (it.questions ?? []).forEach((q, i) => {
    const earlier = q.known_from_earlier ?? [];
    console.log(`  q${i + 1} ${q.kind}: ${q.ask}`);
    if (q.kind === 'predict') {
      console.log(`    real output:\n${indent(run([...earlier, ...q.code]))}`);
      for (const o of q.options) console.log(`    ${o.correct ? '*' : ' '} ${o.id}: ${o.label}`);
    } else if (q.kind === 'fill') {
      for (const o of q.options) {
        const code = q.code.map((l) => l.replaceAll('___', o.label));
        console.log(`    ${o.correct ? '*' : ' '} ${o.id} (${o.label}):\n${indent(run([...earlier, ...code]))}`);
      }
    } else if (q.kind === 'fix') {
      const lines = q.lines ?? [];
      const fix = (q.fixes_by_line?.[q.buggy_line] ?? []).find((f) => f.correct);
      console.log(`    as given:\n${indent(run([...earlier, ...lines.map((l) => l.code)]))}`);
      if (fix) console.log(`    fixed (line ${q.buggy_line} -> ${fix.replacement}):\n${indent(run([...earlier, ...lines.map((l) => (l.id === q.buggy_line ? fix.replacement : l.code))]))}`);
      console.log(`    output_after_fix: ${q.output_after_fix ?? '(none)'}`);
    }
    if (q.picture?.some((p) => p.correct_state != null)) console.log(`    correct_state: ${JSON.stringify(q.picture.map((p) => p.correct_state))}`);
  });
  console.log('');
}
rmSync(dir, { recursive: true, force: true });
