// Saved progress (name, age, field, bolts, streak, unlocked robots). The key and JSON shape never change, so existing installs keep their data.
import { defaultProgress, ROBOT_FORMS, RobotForm, UserProgress } from '../types/models';
import { canonicalArea } from '../utils/studyAreas';
import { jsonStorage } from './jsonStorage';

const KEY = 'moat.progress.v1';

/** Reads saved data field by field, so a new field in a later version never wipes progress. */
function decode(raw: unknown): UserProgress {
  const base = defaultProgress();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Record<string, unknown>;
  const str = (k: string, d: string) => (typeof r[k] === 'string' ? (r[k] as string) : d);
  const num = (k: string, d: number) => (typeof r[k] === 'number' ? (r[k] as number) : d);
  const forms = (Array.isArray(r.unlockedForms) ? r.unlockedForms : base.unlockedForms).filter((f): f is RobotForm =>
    ROBOT_FORMS.includes(f as RobotForm),
  );
  return {
    hasOnboarded: typeof r.hasOnboarded === 'boolean' ? r.hasOnboarded : base.hasOnboarded,
    name: str('name', ''),
    age: num('age', base.age),
    education: str('education', base.education),
    studyArea: canonicalArea(str('studyArea', base.studyArea)),
    language: str('language', base.language),
    completedLessons: Array.isArray(r.completedLessons) ? (r.completedLessons as string[]) : [],
    bolts: num('bolts', 0),
    streak: num('streak', 0),
    lastActiveDay: typeof r.lastActiveDay === 'string' ? r.lastActiveDay : null,
    todayKey: typeof r.todayKey === 'string' ? r.todayKey : null,
    todayLessons: num('todayLessons', 0),
    dailyGoalLessons: num('dailyGoalLessons', base.dailyGoalLessons),
    unlockedForms: forms.length ? forms : ['blob'],
    currentForm: ROBOT_FORMS.includes(r.currentForm as RobotForm) ? (r.currentForm as RobotForm) : 'blob',
  };
}

/** Loads and saves the learner's progress. */
export const ProgressStorage = jsonStorage(KEY, decode, defaultProgress);
