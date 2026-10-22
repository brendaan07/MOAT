// Every track the app offers, in one place: which field and language it serves, which files hold it, and its app ids.
// Onboarding, the loader, the lesson player and scripts/validate-content.mjs all read this list.
import type { Ionicons } from '@expo/vector-icons';
import { canonicalArea } from '../utils/studyAreas';
import type { CodeLang, Domain } from './types';

export interface TrackEntry {
  /** The study area and language that open this track. */
  area: string;
  language: string;
  /** Content files, by CONTENT name: the path (track_*.json) and the lessons and checkpoints (<track>.json). */
  trackFile: string;
  lessonFile: string;
  /** App ids: lessons are <prefix>_p<phase>_l<part>; the phase checkpoint is checkpointId(phase). */
  prefix: string;
  domain: Domain;
  /** Shown above each lesson's title, for example "Healthcare Python, phase 1: …". */
  name: string;
  checkpointId: (phase: number) => string;
}

/** One entry per track. scripts/validate-content.mjs reads trackFile, lessonFile and prefix from these lines, so keep each
 *  entry on one line in this order. */
export const TRACKS: TrackEntry[] = [
  { area: 'Biology research', language: 'R', trackFile: 'track_bio_r', lessonFile: 'biology_r', prefix: 'bio', domain: 'bio', name: 'Biology research R', checkpointId: (n) => `bio_p${n}_cp` },
  { area: 'Healthcare', language: 'Python', trackFile: 'track_hx_py', lessonFile: 'healthcare_python', prefix: 'hx_py', domain: 'health', name: 'Healthcare Python', checkpointId: (n) => `hx_py_cp${n}` },
  { area: 'Healthcare', language: 'R', trackFile: 'track_hx_r', lessonFile: 'healthcare_r', prefix: 'hx_r', domain: 'health', name: 'Healthcare R', checkpointId: (n) => `hx_r_cp${n}` },
  { area: 'Engineering', language: 'Python', trackFile: 'track_eng_py', lessonFile: 'engineering_python', prefix: 'eng_py', domain: 'eng', name: 'Engineering Python', checkpointId: (n) => `eng_py_cp${n}` },
  { area: 'Business & finance', language: 'Python', trackFile: 'track_fin_py', lessonFile: 'finance_python', prefix: 'fin_py', domain: 'fin', name: 'Finance Python', checkpointId: (n) => `fin_py_cp${n}` },
  // The general tracks: the first general lessons, restructured (4 lessons per phase, no checkpoint yet; plan 2b.0)
  { area: 'Physics & maths', language: 'Python', trackFile: 'track_phys_py', lessonFile: 'physics_python', prefix: 'phys_py', domain: 'gen', name: 'Physics & maths Python', checkpointId: (n) => `phys_py_cp${n}` },
  { area: 'Arts & humanities', language: 'Python', trackFile: 'track_arts_py', lessonFile: 'arts_python', prefix: 'arts_py', domain: 'gen', name: 'Arts & humanities Python', checkpointId: (n) => `arts_py_cp${n}` },
  { area: 'General', language: 'Python', trackFile: 'track_gen_py', lessonFile: 'general_python', prefix: 'gen_py', domain: 'gen', name: 'General Python', checkpointId: (n) => `gen_py_cp${n}` },
  { area: 'General', language: 'R', trackFile: 'track_gen_r', lessonFile: 'general_r', prefix: 'gen_r', domain: 'gen', name: 'General R', checkpointId: (n) => `gen_r_cp${n}` },
  { area: 'General', language: 'SQL', trackFile: 'track_gen_sql', lessonFile: 'general_sql', prefix: 'gen_sql', domain: 'gen', name: 'General SQL', checkpointId: (n) => `gen_sql_cp${n}` },
  { area: 'General', language: 'JavaScript', trackFile: 'track_gen_js', lessonFile: 'general_javascript', prefix: 'gen_js', domain: 'gen', name: 'General JavaScript', checkpointId: (n) => `gen_js_cp${n}` },
  { area: 'General', language: 'MATLAB', trackFile: 'track_gen_matlab', lessonFile: 'general_matlab', prefix: 'gen_matlab', domain: 'gen', name: 'General MATLAB', checkpointId: (n) => `gen_matlab_cp${n}` },
  { area: 'General', language: 'Java', trackFile: 'track_gen_java', lessonFile: 'general_java', prefix: 'gen_java', domain: 'gen', name: 'General Java', checkpointId: (n) => `gen_java_cp${n}` },
];

/** The lesson chip, icon and tap text for each field. */
export const FIELDS: Record<Domain, { chip: string; icon: keyof typeof Ionicons.glyphMap; tap: string; track: keyof typeof Ionicons.glyphMap }> = {
  bio: { chip: 'Biology', icon: 'flask-outline', tap: 'Tap for the biology.', track: 'git-branch-outline' },
  eng: { chip: 'Engineering', icon: 'flash-outline', tap: 'Tap for the engineering.', track: 'flash' },
  health: { chip: 'Healthcare', icon: 'heart-outline', tap: 'Tap for the clinical context.', track: 'heart' },
  fin: { chip: 'Finance', icon: 'cash-outline', tap: 'Tap for the finance context.', track: 'cash' },
  gen: { chip: 'Coding', icon: 'code-slash-outline', tap: 'Tap for the context.', track: 'code-slash' },
};

const CODE_LANG: Record<string, CodeLang> = { Python: 'py', R: 'r', SQL: 'sql', JavaScript: 'js', MATLAB: 'matlab', Java: 'java' };
/** How a track's code is coloured. */
export const codeLangOf = (t: TrackEntry): CodeLang => CODE_LANG[t.language] ?? 'r';

/** The track for a study area (any saved name) and language, or null when that pair has none. */
export function trackFor(studyArea: string, language: string): TrackEntry | null {
  const area = canonicalArea(studyArea);
  return TRACKS.find((t) => t.area === area && t.language === language) ?? null;
}
/** Whether a study area and language have a track (the root sends learners without one back to onboarding). */
export const hasTrack = (studyArea: string, language: string) => trackFor(studyArea, language) !== null;

/** The languages a study area has a track in. Onboarding offers only these, so every learner has a track. */
export const languagesFor = (studyArea: string) => TRACKS.filter((t) => t.area === canonicalArea(studyArea)).map((t) => t.language);
