// The pure rules behind a track question: is the answer right, what the live screen shows, and the titles and messages around it.
import { C } from '../../utils/theme';
import { TrackQuestion, correctMany, correctOne, labelOf } from '../../types/models';
import { buildMatches } from '../../utils/buildAnswer';
import { LiveOutput } from '../../components/track/ProjectCard';

/** What the learner has done on the current question. `order` is the arrangement of an "order" question. */
export interface QState {
  pick: string | null;
  seq: string[];
  order: string[];
  checked: boolean;
}
/** A question nobody has touched yet; "order" questions start in their given arrangement. */
export const freshQState = (q: TrackQuestion): QState => ({ pick: null, seq: [], order: q.start ?? [], checked: false });

/** The coloured tag shown on each style of checkpoint question. */
export const STYLE_TAG: Record<string, [string, string]> = {
  plan: ['Plan it', C.sun],
  code: ['Order the code', C.sky],
  predict: ['Predict', C.lime],
  debug: ['Debug', C.orange],
  build: ['Build it', C.hintBlue],
};

const KIND_LABEL = { fill: 'Fill the blank', predict: 'Predict the output', bug: 'Find the bug', build: 'Build the line', order: 'Order' };
/** The words shown above a lesson question, e.g. "Fill the blank". */
export const kindLabel = (q: TrackQuestion) => KIND_LABEL[q.kind];

/** Whether the current answer is right, whatever the kind of question. */
export function isAnswerRight(q: TrackQuestion, answer: QState): boolean {
  switch (q.kind) {
    case 'fill':
    case 'predict':
    case 'bug':
      return answer.pick !== null && answer.pick === correctOne(q);
    case 'build':
      return buildMatches(answer.seq, correctMany(q), (id) => labelOf(q, id));
    case 'order':
      return (q.accept ?? []).some((a) => a.join('|') === answer.order.join('|'));
  }
}

/** Is this item in the right place in an "order" answer? Several arrangements can be accepted. */
export const positionOK = (q: TrackQuestion, i: number, id: string) => (q.accept ?? []).some((a) => a[i] === id);

/** The look of one option button: green when right, flagged when picked wrong, faded otherwise once checked. */
export function optionState(q: TrackQuestion, answer: QState, id: string): { fill: string; op: number; ok: boolean; x: boolean } {
  if (answer.checked) {
    if (id === correctOne(q)) return { fill: C.lime, op: 1, ok: true, x: false };
    if (answer.pick === id) return { fill: C.peach, op: 1, ok: false, x: true };
    return { fill: C.card, op: 0.5, ok: false, x: false };
  }
  return { fill: answer.pick === id ? C.lime : C.card, op: 1, ok: false, x: false };
}

/** The line shown in the project card's live output slot (or the debug error box) for this question. */
export function liveOutput(q: TrackQuestion, answer: QState, correct: boolean): LiveOutput {
  const screen = q.screen ?? {};
  if (q.kind === 'predict') {
    return answer.checked
      ? { label: 'Output', text: screen.done ?? '', color: C.lime }
      : { label: screen.idleLabel ?? 'Output', text: screen.idle ?? '?', color: screen.idle ? C.cream : C.number };
  }
  if (q.kind === 'bug') {
    return correct ? { label: 'Output after the fix', text: screen.done ?? '', color: C.lime } : { label: 'Error', text: screen.err ?? '', color: C.errText };
  }
  return { label: 'Goal', text: screen.goal ?? '', color: C.cream };
}

/** The headline on the feedback sheet for a right answer. */
export function okTitle(q: TrackQuestion): string {
  if (q.kind === 'bug') return 'Found it';
  if (q.kind === 'build') return 'Built';
  if (q.kind === 'order') return q.style === 'code' ? 'It runs' : 'Planned';
  return 'Correct';
}

/** The sentence on the feedback sheet: the lesson's own line when right, a hint for the particular mistake when not. */
export function sheetMessage(q: TrackQuestion, answer: QState, correct: boolean): string {
  if (correct) return q.ok;
  if (q.kind === 'build') return q.wrongBuild ?? 'Check the order of the pieces.';
  if (q.kind === 'order') return q.wrong ?? 'Check which steps depend on earlier ones.';
  return q.fb?.[answer.pick ?? ''] ?? 'Have another look.';
}

/** "first try" for one, "3 in a row" for a streak of first-try answers ending at question `index`. */
export function comboText(questions: TrackQuestion[], firstTry: Set<string>, index: number): string {
  let combo = 0;
  for (let i = index; i >= 0; i--) {
    if (firstTry.has(questions[i].id)) combo++;
    else break;
  }
  return combo <= 1 ? 'first try' : `${combo} in a row`;
}
