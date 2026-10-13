// How an answer chip or card is coloured, shared by the choice, judge and bug questions.
import { Question } from '../../../types/models';
import { ChipLook } from '../../../components/ui';
import { C } from '../../../utils/theme';

export type Outcome = null | 'correct' | 'wrong';

/** Before checking, the picked option is "selected"; after, the right answer is green and a wrong pick is flagged. */
export function chipLook(q: Question, option: string, choice: string | null, outcome: Outcome): ChipLook {
  if (outcome) return option === q.answer[0] ? 'correct' : option === choice ? 'wrong' : 'normal';
  return option === choice ? 'selected' : 'normal';
}

/** The card colour for each chip look. */
export const lookFill = (l: ChipLook) => ({ correct: C.lime, wrong: C.wrongChip, selected: C.hintBlue, normal: C.card, used: C.card }[l]);
