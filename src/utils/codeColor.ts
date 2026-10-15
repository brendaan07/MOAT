// Syntax colours for the code shown on dark editor panels, split into runs of text with a colour each.
import { C } from './theme';

export type ColoredRun = { t: string; c: string };

const KEYWORDS = new Set(['if', 'else', 'for', 'in', 'while', 'function', 'return', 'TRUE', 'FALSE', 'NULL', 'NA', 'repeat', 'break', 'next']);
/** R colouring: comments lilac, strings lime, numbers orange, function calls blue, keywords orange. */
export function colorR(line: string, base: string = C.cream): ColoredRun[] {
  if (line.trim().startsWith('#')) return [{ t: line, c: C.lilac }];
  const out: ColoredRun[] = [];
  let i = 0;
  const isLetter = (ch: string) => /[A-Za-z_.]/.test(ch);
  while (i < line.length) {
    const ch = line[i];
    if (ch === '"' || ch === "'") {
      let j = i + 1;
      while (j < line.length && line[j] !== ch) j++;
      const end = Math.min(j + 1, line.length);
      out.push({ t: line.slice(i, end), c: C.lime });
      i = end;
    } else if (/[0-9]/.test(ch)) {
      let j = i;
      while (j < line.length && /[0-9.]/.test(line[j])) j++;
      out.push({ t: line.slice(i, j), c: C.number });
      i = j;
    } else if (isLetter(ch)) {
      let j = i;
      while (j < line.length && /[A-Za-z0-9_.]/.test(line[j])) j++;
      const word = line.slice(i, j);
      out.push({ t: word, c: line[j] === '(' ? C.fn : KEYWORDS.has(word) ? C.keyword : base });
      i = j;
    } else if (ch === ' ') {
      out.push({ t: ' ', c: base });
      i++;
    } else {
      out.push({ t: ch, c: C.lavender });
      i++;
    }
  }
  return out;
}

const PY_KEYWORDS = new Set(['def', 'return', 'if', 'elif', 'else', 'for', 'in', 'while', 'and', 'or', 'not', 'True', 'False', 'None', 'import', 'from']);

/** Python colouring, in the same colours the app uses for R. */
export function colorPy(line: string): ColoredRun[] {
  const toks = line.match(/[frb]?"[^"]*"|[frb]?'[^']*'|\d[\d.]*|[A-Za-z_][A-Za-z0-9_]*|\s+|./g) ?? [];
  return toks.map((t, k) => {
    const next = toks[k + 1] ?? '';
    let c: string = C.cream;
    if (/^[frb]?["']/.test(t)) c = C.lime;
    else if (/^\d/.test(t)) c = C.number;
    else if (PY_KEYWORDS.has(t)) c = C.keyword;
    else if (/^[A-Za-z_]/.test(t)) c = next === '(' ? C.fn : C.cream;
    else if (!/^\s+$/.test(t)) c = C.lavender;
    return { t, c };
  });
}
