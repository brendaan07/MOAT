// The learner's saved progress and run results. Content types live in
// content/types.ts.

/** Blob's expressions (one picture each). */
export type RobotMood = 'neutral' | 'excited' | 'surprised' | 'wink' | 'closed' | 'hearts' | 'confused';
/** The robot's picture with a given expression, for example "blob_excited". */
export const robotImage = (mood: RobotMood) => `blob_${mood}`;

// ---------- Progress (saved on the phone) ----------
export interface UserProgress {
  hasOnboarded: boolean;
  /** The learner's first name, shown on the profile. Empty until they add it. */
  name: string;
  age: number;
  education: string;
  studyArea: string;
  language: string;
  bolts: number;
  streak: number;
  lastActiveDay?: string | null;
  todayKey?: string | null;
  todayLessons: number;
  dailyGoalLessons: number;
}

/** A new learner's profile progress. */
export const defaultProgress = (): UserProgress => ({
  hasOnboarded: false,
  name: '',
  age: 18,
  education: 'Secondary school',
  studyArea: 'Health Sciences',
  language: 'Python',
  bolts: 0,
  streak: 0,
  lastActiveDay: null,
  todayKey: null,
  todayLessons: 0,
  dailyGoalLessons: 3,
});

// ---------- Track progress (saved on the phone) ----------
export interface TrackProgress {
  finished: string[];
  bestStars: Record<string, number>;
  paid: string[];
  secondsByDay: Record<string, number>;
}

/** A new learner's track progress. */
export const defaultTrackProgress = (): TrackProgress => ({ finished: [], bestStars: {}, paid: [], secondsByDay: {} });

/** What one lesson or checkpoint run earned. */
export interface RunResult {
  itemID: string;
  stars: number;
  total: number;
  earned: number;
  /** The perfect-first-attempt bonus. */
  bonus: number;
  /** The daily-goal bonus, when this run took today's minutes up to the goal. */
  goalBonus: number;
  firstAttempt: boolean;
  missedIndexes: number[];
}
/** Every bolt a run paid into the account. */
export const creditedBolts = (r: RunResult) => r.earned + r.bonus + r.goalBonus;
/** Whether every question was right first try. */
export const isPerfect = (r: RunResult) => r.stars === r.total;
