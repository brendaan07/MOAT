// The learner's track and its progress (stars, paid questions, minutes) as React context; the rules are in utils/progressRules.ts.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { RunResult, TrackProgress, defaultTrackProgress } from '../types/models';
import type { Track, TrackLesson, TrackPhase, TrackQuestion } from '../content/types';
import { TrackStorage } from '../storage/trackStorage';
import { loadTrack } from '../services/contentLoader';
import { useAppStore } from './useAppStore';
import * as rules from '../utils/progressRules';

interface TrackStoreValue {
  track: Track | null;
  progress: TrackProgress;
  /** True once saved progress has loaded, so lock checks never run against empty progress. */
  hydrated: boolean;
  isFinished: (id: string) => boolean;
  stars: (id: string) => number;
  phaseComplete: (phase: TrackPhase) => boolean;
  phaseUnlocked: (phase: TrackPhase) => boolean;
  lessonUnlocked: (lesson: TrackLesson, phase: TrackPhase) => boolean;
  checkpointUnlocked: (phase: TrackPhase) => boolean;
  currentPhase: TrackPhase | null;
  cycleOneComplete: boolean;
  nextLesson: (phase: TrackPhase) => TrackLesson | null;
  pays: (q: TrackQuestion) => boolean;
  record: (itemID: string, questions: TrackQuestion[], firstTry: Set<string>) => RunResult;
  /** Adds learning time to today; returns today's seconds before and after. */
  addTime: (seconds: number) => { before: number; after: number };
  minutesToday: number;
  reset: () => void;
}

const Ctx = createContext<TrackStoreValue | null>(null);

/** Loads the learner's track and its saved progress and provides them to the app. */
export function TrackStoreProvider({ children }: { children: React.ReactNode }) {
  const app = useAppStore();
  const { studyArea, language } = app.progress;
  const track = useMemo(() => loadTrack(studyArea, language), [studyArea, language]);
  const [progress, setState] = useState<TrackProgress>(defaultTrackProgress());
  const [hydrated, setHydrated] = useState(false);
  const ref = useRef(progress);
  const set = useCallback((p: TrackProgress) => {
    ref.current = p;
    setState(p);
    TrackStorage.save(p);
  }, []);
  useEffect(() => {
    TrackStorage.load().then((p) => {
      ref.current = p;
      setState(p);
      setHydrated(true);
    });
  }, []);

  const phases = useMemo(() => track?.phases ?? [], [track]);
  const isFinished = useCallback((id: string) => rules.isFinished(progress, id), [progress]);
  const stars = useCallback((id: string) => rules.starsFor(progress, id), [progress]);
  const phaseComplete = useCallback((phase: TrackPhase) => rules.phaseComplete(progress, phase), [progress]);
  const phaseUnlocked = useCallback((phase: TrackPhase) => rules.phaseUnlocked(progress, phases, phase), [progress, phases]);
  const lessonUnlocked = useCallback((lesson: TrackLesson, phase: TrackPhase) => rules.lessonUnlocked(progress, phases, lesson, phase), [progress, phases]);
  const checkpointUnlocked = useCallback((phase: TrackPhase) => rules.checkpointUnlocked(progress, phases, phase), [progress, phases]);
  /** The last open phase, where the learner is now. */
  const currentPhase = useMemo(() => [...phases].reverse().find((p) => rules.phaseUnlocked(progress, phases, p)) ?? null, [progress, phases]);
  const cycleOneComplete = useMemo(() => phases.length > 0 && phases.every((p) => rules.phaseComplete(progress, p)), [progress, phases]);
  const nextLesson = useCallback((phase: TrackPhase) => phase.lessons.find((l) => !rules.isFinished(progress, l.id)) ?? null, [progress]);
  const pays = useCallback((q: TrackQuestion) => rules.pays(ref.current, q), []);
  const record = useCallback(
    (itemID: string, questions: TrackQuestion[], firstTry: Set<string>): RunResult => {
      const { next, result } = rules.withRun(ref.current, itemID, questions, firstTry);
      set(next);
      return result;
    },
    [set],
  );
  const addTime = useCallback(
    (seconds: number) => {
      const before = rules.secondsToday(ref.current);
      const next = rules.withTime(ref.current, seconds);
      set(next);
      return { before, after: rules.secondsToday(next) };
    },
    [set],
  );

  const value: TrackStoreValue = {
    track,
    progress,
    hydrated,
    isFinished,
    stars,
    phaseComplete,
    phaseUnlocked,
    lessonUnlocked,
    checkpointUnlocked,
    currentPhase,
    cycleOneComplete,
    nextLesson,
    pays,
    record,
    addTime,
    minutesToday: rules.minutesToday(progress),
    reset: () => set(defaultTrackProgress()),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** The learner's track, its progress and the unlock rules. */
export function useTrackStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTrackStore must be used inside TrackStoreProvider');
  return v;
}
