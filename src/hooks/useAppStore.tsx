// The learner's profile, bolts and streak as React context, saved on every change.
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { UserProgress, defaultProgress } from '../types/models';
import { ProgressStorage } from '../storage/progressStorage';
import { DayKey } from '../utils/dayKey';
import { displayStreak as streakShown, withTrackBolts } from '../utils/progressRules';

interface AppStoreValue {
  hydrated: boolean;
  progress: UserProgress;
  displayStreak: number;
  lessonsToday: number;
  finishOnboarding: (name: string, age: number, education: string, studyArea: string, language: string) => void;
  setName: (name: string) => void;
  creditTrack: (bolts: number) => void;
  editAnswers: () => void;
  resetProgress: () => void;
}

const Ctx = createContext<AppStoreValue | null>(null);

/** Loads saved progress and provides it, with its actions, to the app. */
export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [progress, setProgressState] = useState<UserProgress>(defaultProgress());
  const progressRef = useRef(progress);

  /** Every change is saved, like the didSet on AppStore.progress. */
  const setProgress = useCallback((next: UserProgress) => {
    progressRef.current = next;
    setProgressState(next);
    ProgressStorage.save(next);
  }, []);

  // Load saved answers first, so the lessons match the learner's study area every launch.
  useEffect(() => {
    let alive = true;
    ProgressStorage.load().then((saved) => {
      if (!alive) return;
      progressRef.current = saved;
      setProgressState(saved);
      setHydrated(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const displayStreak = streakShown(progress);
  const lessonsToday = progress.todayKey === DayKey.today() ? progress.todayLessons : 0;

  const finishOnboarding = useCallback(
    (name: string, age: number, education: string, studyArea: string, language: string) => {
      setProgress({
        ...progressRef.current,
        name: name.trim(),
        age,
        education,
        studyArea,
        language,
        hasOnboarded: true,
        // Younger learners start with a lighter daily goal.
        dailyGoalLessons: age < 13 ? 2 : 3,
      });
    },
    [setProgress],
  );

  /** Bolts from a track lesson go to the account only when it is finished; streak and daily count update. */
  const creditTrack = useCallback((bolts: number) => setProgress(withTrackBolts(progressRef.current, bolts)), [setProgress]);

  const setName = useCallback((name: string) => setProgress({ ...progressRef.current, name: name.trim() }), [setProgress]);
  const editAnswers = useCallback(() => setProgress({ ...progressRef.current, hasOnboarded: false }), [setProgress]);
  const resetProgress = useCallback(() => {
    const fresh = defaultProgress();
    setProgress(fresh);
  }, [setProgress]);

  const value: AppStoreValue = {
    hydrated,
    progress,
    displayStreak,
    lessonsToday,
    finishOnboarding,
    setName,
    creditTrack,
    editAnswers,
    resetProgress,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

/** The learner's profile progress and its actions. */
export function useAppStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useAppStore must be used inside AppStoreProvider');
  return v;
}
