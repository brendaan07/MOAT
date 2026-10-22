// What finishing a lesson or checkpoint does, in one place: record stars, pay the bolts into the account (which also
// updates the streak) and log the time spent, in whole seconds.
import type { RunResult } from '../types/models';
import type { TrackQuestion } from '../content/types';
import { useAppStore } from './useAppStore';
import { useTrackStore } from './useTrackStore_updated';

/** Returns a function that finishes a run started at `startedAt` (Date.now()) and gives its result. */
export function useFinishRun() {
  const app = useAppStore();
  const track = useTrackStore();
  return (itemID: string, questions: TrackQuestion[], firstTry: Set<string>, startedAt: number): RunResult => {
    const result = track.record(itemID, questions, firstTry);
    app.creditTrack(result.earned + result.bonus);
    track.addTime(Math.round((Date.now() - startedAt) / 1000));
    return result;
  };
}
