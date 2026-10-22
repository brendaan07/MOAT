// The rules for progress: how a finished run changes it, and which phases, lessons and checkpoints it opens.
// Pure functions, so the stores only wire state and saving to them.
import { RunResult, TrackProgress, UserProgress } from '../types/models';
import type { TrackLesson, TrackPhase, TrackQuestion } from '../content/types';
import { BOLTS_PER_QUESTION, DAILY_GOAL_BONUS_BOLTS, DAILY_GOAL_MINUTES, PERFECT_BONUS } from './rewards';
import { DayKey } from './dayKey';

// ---------- the learner's profile ----------

/** Progress after a lesson or checkpoint pays out: the bolts go to the account, and the streak and today's count update. */
export function withTrackBolts(current: UserProgress, bolts: number): UserProgress {
  const next = { ...current, bolts: current.bolts + bolts };
  const today = DayKey.today();
  if (next.lastActiveDay !== today) {
    next.streak = next.lastActiveDay === DayKey.yesterday() ? next.streak + 1 : 1;
    next.lastActiveDay = today;
  }
  if (next.todayKey !== today) {
    next.todayKey = today;
    next.todayLessons = 0;
  }
  next.todayLessons += 1;
  return next;
}

/** The streak as shown: it only counts if the learner practised today or yesterday. */
export const displayStreak = (p: UserProgress) =>
  p.lastActiveDay === DayKey.today() || p.lastActiveDay === DayKey.yesterday() ? p.streak : 0;

// ---------- track progress ----------

/** Whether a lesson or checkpoint has been finished at least once. */
export const isFinished = (p: TrackProgress, id: string) => p.finished.includes(id);
/** The best stars ever earned on a lesson or checkpoint. */
export const starsFor = (p: TrackProgress, id: string) => p.bestStars[id] ?? 0;

/** A phase is complete when every lesson and its checkpoint have full stars (a phase without a checkpoint needs only
 *  its lessons, since its checkpoint has no questions). */
export const phaseComplete = (p: TrackProgress, phase: TrackPhase) =>
  phase.lessons.every((l) => starsFor(p, l.id) >= l.questions.length) && starsFor(p, phase.checkpoint.id) >= phase.checkpoint.questions.length;

/** The first phase is open; each later one opens when the phase before it is complete. */
export function phaseUnlocked(p: TrackProgress, phases: TrackPhase[], phase: TrackPhase) {
  const i = phases.findIndex((x) => x.number === phase.number);
  return i === 0 || (i > 0 && phaseComplete(p, phases[i - 1]));
}

/** In an open phase, a lesson opens once the one before it is finished, with any number of stars. */
export function lessonUnlocked(p: TrackProgress, phases: TrackPhase[], lesson: TrackLesson, phase: TrackPhase) {
  if (!phaseUnlocked(p, phases, phase)) return false;
  const i = phase.lessons.findIndex((l) => l.id === lesson.id);
  return i === 0 || (i > 0 && isFinished(p, phase.lessons[i - 1].id));
}

/** A phase's checkpoint opens once every lesson in it is finished. */
export const checkpointUnlocked = (p: TrackProgress, phases: TrackPhase[], phase: TrackPhase) =>
  phaseUnlocked(p, phases, phase) && phase.lessons.every((l) => isFinished(p, l.id));

/** Whether a question still pays bolts (it never paid before). */
export const pays = (p: TrackProgress, q: TrackQuestion) => !p.paid.includes(q.id);

/** Progress after a run, and its result: stars are the questions right first try, each newly right one pays, and a
 *  perfect first attempt adds the bonus. */
export function withRun(p: TrackProgress, itemID: string, questions: TrackQuestion[], firstTry: Set<string>): { next: TrackProgress; result: RunResult } {
  const firstAttempt = !isFinished(p, itemID);
  const newPaid = [...firstTry].filter((id) => !p.paid.includes(id));
  const stars = firstTry.size;
  const next: TrackProgress = {
    ...p,
    finished: firstAttempt ? [...p.finished, itemID] : p.finished,
    bestStars: { ...p.bestStars, [itemID]: Math.max(starsFor(p, itemID), stars) },
    paid: Array.from(new Set([...p.paid, ...firstTry])),
  };
  const missedIndexes = questions.map((q, i) => (firstTry.has(q.id) ? -1 : i)).filter((i) => i >= 0);
  const bonus = firstAttempt && stars === questions.length ? PERFECT_BONUS : 0;
  return { next, result: { itemID, stars, total: questions.length, earned: newPaid.length * BOLTS_PER_QUESTION, bonus, goalBonus: 0, firstAttempt, missedIndexes } };
}

/** Progress with `seconds` of learning added to today. */
export function withTime(p: TrackProgress, seconds: number): TrackProgress {
  if (seconds <= 0) return p;
  const key = DayKey.today();
  return { ...p, secondsByDay: { ...p.secondsByDay, [key]: (p.secondsByDay[key] ?? 0) + seconds } };
}

/** Today's learning in seconds. */
export const secondsToday = (p: TrackProgress) => p.secondsByDay[DayKey.today()] ?? 0;

/** The daily-goal bonus earned by going from `before` to `after` seconds today: paid when today's minutes first reach
 *  the goal. Minutes only grow within a day, so this pays at most once a day. */
export const goalBonus = (before: number, after: number) =>
  Math.floor(before / 60) < DAILY_GOAL_MINUTES && Math.floor(after / 60) >= DAILY_GOAL_MINUTES ? DAILY_GOAL_BONUS_BOLTS : 0;

/** Whole minutes learned today. */
export const minutesToday = (p: TrackProgress) => Math.floor(secondsToday(p) / 60);
