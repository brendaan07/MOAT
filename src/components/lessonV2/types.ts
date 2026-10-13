// The shape of a new-style lesson as written in the bundled lesson JSON: questions, pictures and notebook entries.


export type V2Pic =
  | { type: 'strip'; text: string; hi: number[] | null; size: number }
  | { type: 'readout'; label: string; value: string; known: boolean }
  | { type: 'rows'; items: [string, string, boolean][] }
  | { type: 'bars'; vals: (number | null)[]; cutoff: number | null; hide: number[]; labels: string[] | null; cmax: number | null }
  | { type: 'tubes'; vols: number[]; cap: number }
  | { type: 'ph'; marks: number[] }
  | { type: 'machine'; input: string; name: string }
  | { type: 'msg'; who: string; text: string }
  | { type: 'belt' | 'circuit' | 'battery' | 'drip' | 'gauge' | 'clock24' | 'wristband' | 'syringe' | 'monitor' | 'bpbars' | 'curve'; args: unknown[]; kw: Record<string, unknown> };
export interface V2Option { id: string; label: string }
export interface V2Question {
  id: string;
  kind: 'predict' | 'fill' | 'bug' | 'build';
  word: string;
  color: string;
  okTitle: string;
  ask: string;
  hint: string;
  ok: string;
  fb: Record<string, string>;
  bridge: string;
  entry: string;
  label: string;
  science: { title: string; text: string };
  codeNote: { title: string; text: string };
  carry: [string, number] | null;
  pics: V2Pic[];
  eq: (string | { t: string; c: string })[];
  goal: string[];
  earlier: string | null;
  start: number;
  code: string[];
  opts?: V2Option[];
  lines?: V2Option[];
  correct: string | string[];
  file?: string;
  after?: string;
  wrongBuild?: string;
}
export interface V2Lesson {
  id: string;
  /** 'eng' and 'health' lessons use their own labels; Biology lessons leave it out. */
  domain?: 'eng' | 'health';
  lang?: 'py' | 'r';
  phase: number;
  part: number;
  title: string;
  project: string;
  person: string;
  intro: string;
  start: string;
  doneTitle: string;
  doneSub: string;
  file: string;
  notebook: [string, string][];
  script: string[];
  questions: V2Question[];
}
