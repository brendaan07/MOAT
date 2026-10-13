// The registry of new-style lessons (by app lesson id) and the per-field wording: chip label, icons and science-note prompt.
import RAW from '../../../assets/content/track_bio_r_lessons_v2.json';
import MORE from '../../../assets/content/track_lessons_v2_more.json';
import type { V2Lesson } from './types';

const LESSONS: Record<string, V2Lesson> = {};
for (const l of (RAW as unknown as { lessons: V2Lesson[] }).lessons) LESSONS[l.id] = l;
for (const l of (MORE as unknown as { lessons: V2Lesson[] }).lessons) LESSONS[l.id] = l;

/** The label, icon and science-note wording for each field. */
const FIELD = {
  bio: { chip: 'Biology', icon: 'flask-outline' as const, tap: 'Tap for the biology.', track: 'git-branch-outline' as const },
  eng: { chip: 'Engineering', icon: 'flash-outline' as const, tap: 'Tap for the engineering.', track: 'flash' as const },
  health: { chip: 'Healthcare', icon: 'heart-outline' as const, tap: 'Tap for the clinical context.', track: 'heart' as const },
};
/** The wording for a lesson's field (Biology when the lesson does not say). */
export const field = (l: V2Lesson) => FIELD[l.domain ?? 'bio'];

/** The new-style lesson for an app lesson id, or null when that lesson still uses the older player. */
export function v2Lesson(id: string): V2Lesson | null {
  return LESSONS[id] ?? null;
}
