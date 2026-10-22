// What finishing a lesson or checkpoint does, in one place: record stars, log the time spent (in whole seconds), and pay
// the bolts, plus the daily-goal bonus if this run reached the goal, into the account (which also updates the streak).
import { RunResult, creditedBolts } from '../types/models';
import type { TrackQuestion } from '../content/types';
import { useAppStore } from './useAppStore';
import { useTrackStore } from './useTrackStore_updated';
import { goalBonus } from '../utils/progressRules';

/** Returns a function that finishes a run started at `startedAt` (Date.now()) and gives its result. */
export function useFinishRun() {
  const app = useAppStore();
  const track = useTrackStore();
  return (itemID: string, questions: TrackQuestion[], firstTry: Set<string>, startedAt: number): RunResult => {
    const run = track.record(itemID, questions, firstTry);
    const time = track.addTime(Math.round((Date.now() - startedAt) / 1000));
    const result = { ...run, goalBonus: goalBonus(time.before, time.after) };
    app.creditTrack(creditedBolts(result));
    return result;
  };
}
