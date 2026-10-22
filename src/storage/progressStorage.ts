// Saves and loads the learner's profile progress (moat.progress.v1).
import { defaultProgress, UserProgress } from '../types/models';
import { canonicalArea } from '../utils/studyAreas';
import { jsonStorage } from './jsonStorage';

// Same key and the same JSON shape as UserDefaults in the Swift app.
const KEY = 'moat.progress.v1';

/** Reads saved data field by field, so a new field in a later version never wipes progress. Fields older versions
 *  saved and this one no longer uses (completedLessons, unlockedForms, currentForm) are ignored. */
function decode(raw: unknown): UserProgress {
  const base = defaultProgress();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Record<string, unknown>;
  const str = (k: string, d: string) => (typeof r[k] === 'string' ? (r[k] as string) : d);
  const num = (k: string, d: number) => (typeof r[k] === 'number' ? (r[k] as number) : d);
  return {
    hasOnboarded: typeof r.hasOnboarded === 'boolean' ? r.hasOnboarded : base.hasOnboarded,
    name: str('name', ''),
    age: num('age', base.age),
    education: str('education', base.education),
    studyArea: canonicalArea(str('studyArea', base.studyArea)),
    language: str('language', base.language),
    bolts: num('bolts', 0),
    streak: num('streak', 0),
    lastActiveDay: typeof r.lastActiveDay === 'string' ? r.lastActiveDay : null,
    todayKey: typeof r.todayKey === 'string' ? r.todayKey : null,
    todayLessons: num('todayLessons', 0),
    dailyGoalLessons: num('dailyGoalLessons', base.dailyGoalLessons),
  };
}

/** Reads and writes the profile progress in AsyncStorage. */
export const ProgressStorage = jsonStorage(KEY, decode, defaultProgress);
