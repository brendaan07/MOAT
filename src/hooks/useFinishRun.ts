// What finishing a project-track lesson or checkpoint does, in one place for both players:
// record stars, pay the bolts into the account (which also updates the streak) and log the time spent.
import { RunResult, TrackQuestion } from '../types/models';
import { useAppStore } from './useAppStore';
import { useTrackStore } from './useTrackStore';

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
