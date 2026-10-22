// The learner's saved progress and run results (UserProgress.swift, TrackData_updated.swift). Content types live in
// content/types.ts.

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

export interface RunResult {
  itemID: string;
  stars: number;
  total: number;
  earned: number;
  bonus: number;
  firstAttempt: boolean;
  missedIndexes: number[];
}
/** Whether every question was right first try. */
export const isPerfect = (r: RunResult) => r.stars === r.total;
