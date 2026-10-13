// Saved project-track progress (finished items, best stars, paid questions, time per day), kept apart from the main progress.
import { defaultTrackProgress, TrackProgress } from '../types/models';
import { jsonStorage } from './jsonStorage';

const KEY = 'moat.track.v1';

/** Reads each field on its own so a missing one falls back to empty instead of dropping the rest. */
function decode(raw: unknown): TrackProgress {
  if (!raw || typeof raw !== 'object') return defaultTrackProgress();
  const r = raw as Record<string, any>;
  return {
    finished: Array.isArray(r.finished) ? r.finished : [],
    bestStars: r.bestStars && typeof r.bestStars === 'object' ? r.bestStars : {},
    paid: Array.isArray(r.paid) ? r.paid : [],
    secondsByDay: r.secondsByDay && typeof r.secondsByDay === 'object' ? r.secondsByDay : {},
  };
}

/** Loads and saves the project-track progress. */
export const TrackStorage = jsonStorage(KEY, decode, defaultTrackProgress);
