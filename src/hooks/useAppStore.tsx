// The learner's profile, bolts and streak as React context, saved on every change.
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { UserProgress, defaultProgress } from '../types/models';
import { ProgressStorage } from '../storage/progressStorage';
import { DayKey } from '../utils/dayKey';

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

  /** The streak only counts if the learner practised today or yesterday. */
  const displayStreak =
    progress.lastActiveDay === DayKey.today() || progress.lastActiveDay === DayKey.yesterday() ? progress.streak : 0;
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

  const bumpDay = (u: UserProgress) => {
    const today = DayKey.today();
    if (u.lastActiveDay !== today) {
      u.streak = u.lastActiveDay === DayKey.yesterday() ? u.streak + 1 : 1;
      u.lastActiveDay = today;
    }
    if (u.todayKey !== today) {
      u.todayKey = today;
      u.todayLessons = 0;
    }
    u.todayLessons += 1;
  };

  /** Bolts from a track lesson go to the account only when it is finished; streak and daily count update. */
  const creditTrack = useCallback(
    (bolts: number) => {
      const u = { ...progressRef.current };
      bumpDay(u);
      u.bolts += bolts;
      setProgress(u);
    },
    [setProgress],
  );

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
