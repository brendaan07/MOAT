// The rules for how finishing a lesson changes saved progress: streak, daily count, bolts and robot evolution.
// Pure functions, so the store only has to wire state and saving.
import { Lesson, Phase, RobotForm, UserProgress } from '../types/models';
import { DayKey } from './dayKey';

/** Updates the streak and today's lesson count for a lesson finished now. Changes `u` in place. */
function bumpDay(u: UserProgress) {
  const today = DayKey.today();
  if (u.lastActiveDay !== today) {
    u.streak = u.lastActiveDay === DayKey.yesterday() ? u.streak + 1 : 1;
    u.lastActiveDay = today;
  }
  if (u.todayKey !== today) {
    u.todayKey = today;
    u.todayLessons = 0;
  }
  u.todayLessons += 1;
}

/**
 * Progress after finishing a general-path lesson. A phase whose lessons are all done unlocks and equips
 * its robot form; `newForm` is set only on the finish that causes that, never on a replay.
 */
export function withLessonCompleted(current: UserProgress, lesson: Lesson, boltsEarned: number, phases: Phase[]): { next: UserProgress; newForm: RobotForm | null } {
  const next: UserProgress = { ...current, completedLessons: [...current.completedLessons], unlockedForms: [...current.unlockedForms] };
  bumpDay(next);
  next.bolts += boltsEarned;
  let newForm: RobotForm | null = null;
  if (!next.completedLessons.includes(lesson.id)) {
    next.completedLessons.push(lesson.id);
    for (const phase of phases) {
      if (!phase.lessons.some((l) => l.id === lesson.id)) continue;
      const phaseDone = phase.lessons.every((l) => next.completedLessons.includes(l.id));
      const form = phase.unlocksForm;
      if (phaseDone && form && !next.unlockedForms.includes(form)) {
        next.unlockedForms.push(form);
        next.currentForm = form;
        newForm = form;
      }
    }
  }
  return { next, newForm };
}

/** Progress after a project-track lesson pays out: bolts go to the account and the streak and daily count update. */
export function withTrackBolts(current: UserProgress, bolts: number): UserProgress {
  const next = { ...current };
  bumpDay(next);
  next.bolts += bolts;
  return next;
}
