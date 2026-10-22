// Mirrors the Swift models (UserProgress.swift, TrackData_updated.swift).

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

// ---------- Biology research track (track_bio_r_updated.json) ----------
type TrackKind = 'fill' | 'predict' | 'bug' | 'build' | 'order';
type CheckpointStyle = 'plan' | 'code' | 'predict' | 'debug' | 'build';

interface TrackOption {
  id: string;
  label: string;
}

interface TrackScreen {
  goal?: string;
  done?: string;
  err?: string;
  idle?: string;
  idleLabel?: string;
}

export interface TrackQuestion {
  id: string;
  kind: TrackKind;
  prompt: string;
  hint: string;
  ok: string;
  code?: string[];
  opts?: TrackOption[];
  lines?: TrackOption[];
  correct?: string | string[];
  screen?: TrackScreen;
  fb?: Record<string, string>;
  wrongBuild?: string;
  answerLine?: string;
  note?: string;
  style?: CheckpointStyle;
  task?: string;
  steps?: Record<string, string>;
  accept?: string[][];
  start?: string[];
  goal?: string;
  wrong?: string;
  report?: string[][];
  reportTitle?: string;
  slot?: string;
}

export interface TrackLesson {
  id: string;
  part: number;
  title: string;
  questions: TrackQuestion[];
}

interface TrackCheckpoint {
  id: string;
  name: string;
  filename: string;
  problem: string;
  unlock: string[];
  questions: TrackQuestion[];
}

export interface TrackPhase {
  number: number;
  area: string;
  project: string;
  picture: string;
  skill: string;
  parts: string[][];
  code: string[];
  lessons: TrackLesson[];
  checkpoint: TrackCheckpoint;
}

export interface TrackCycle2 {
  area: string;
  project: string;
  picture: string;
  titles: string[];
  later: string[][];
}

export interface Track {
  id: string;
  title: string;
  language: string;
  phases: TrackPhase[];
  cycle2: TrackCycle2;
}

export interface TrackProgress {
  finished: string[];
  bestStars: Record<string, number>;
  paid: string[];
  secondsByDay: Record<string, number>;
}

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
export const isPerfect = (r: RunResult) => r.stars === r.total;
