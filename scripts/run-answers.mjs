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
const isR = /^r$/i.test(data.track?.language ?? '');

const has = (cmd, args) => spawnSync(cmd, args, { stdio: 'ignore' }).status === 0;
function runner() {
  if (!isR) return has('python3', ['--version']) ? ['python3', [], '.py'] : null;
  if (has('Rscript', ['--version'])) return ['Rscript', [], '.R'];
  if (has('conda', ['run', '-n', 'moat-r', 'Rscript', '--version'])) return ['conda', ['run', '-n', 'moat-r', 'Rscript'], '.R'];
  return null;
}
const rt = runner();
if (!rt) console.log(`No ${isR ? 'R (Rscript or the moat-r conda environment)' : 'python3'} found: printing the code and marked answers only.\n`);

const dir = mkdtempSync(join(tmpdir(), 'moat-answers-'));
function run(lines) {
  if (!rt) return '(not run)';
  const path = join(dir, `q${rt[2]}`);
  writeFileSync(path, lines.join('\n') + '\n');
  try {
    return execFileSync(rt[0], [...rt[1], path], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 30000 }).trimEnd();
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
