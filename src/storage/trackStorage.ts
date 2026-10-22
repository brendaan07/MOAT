// Saves and loads the learner's track progress (moat.track.v1).
import { defaultTrackProgress, TrackProgress } from '../types/models';
import { jsonStorage } from './jsonStorage';

const KEY = 'moat.track.v1';

/** Reads saved track progress field by field; anything missing or malformed starts empty. */
function decode(raw: unknown): TrackProgress {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const obj = <T,>(v: unknown, d: T): T => (v && typeof v === 'object' && !Array.isArray(v) ? (v as T) : d);
  return {
    finished: Array.isArray(r.finished) ? (r.finished as string[]) : [],
    bestStars: obj(r.bestStars, {}),
    paid: Array.isArray(r.paid) ? (r.paid as string[]) : [],
    secondsByDay: obj(r.secondsByDay, {}),
  };
}

/** Reads and writes the track progress in AsyncStorage. */
export const TrackStorage = jsonStorage(KEY, decode, defaultTrackProgress);
