// The main store: saved progress, the course, the paywall and purchases. Every progress change is saved straight away.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { Course, Lesson, Phase, RobotForm, UserProgress, defaultProgress } from '../types/models';
import { ProgressStorage } from '../storage/progressStorage';
import { loadBundled } from '../services/contentLoader';
import { APIClient, AppConfig } from '../services/apiClient';
import { PurchasesService } from '../services/purchases';
import { DayKey } from '../utils/dayKey';
import { withLessonCompleted, withTrackBolts } from '../utils/progressRules';

export type PaywallTier = 'premium' | 'expert';

interface AppStoreValue {
  hydrated: boolean;
  progress: UserProgress;
  course: Course;
  showPaywall: boolean;
  paywallTier: PaywallTier;
  isPremium: boolean;
  currentOffering: PurchasesOffering | null;
  pendingEvolution: RobotForm | null;
  orderedLessons: Lesson[];
  currentLesson: Lesson | null;
  displayStreak: number;
  isCompleted: (lesson: Lesson) => boolean;
  isUnlocked: (lesson: Lesson) => boolean;
  isPhaseStarted: (phase: Phase) => boolean;
  completedCount: (phase: Phase) => number;
  finishOnboarding: (name: string, age: number, education: string, studyArea: string, language: string) => void;
  setName: (name: string) => void;
  finishLesson: (lesson: Lesson, boltsEarned: number) => void;
  creditTrack: (bolts: number) => void;
  equip: (form: RobotForm) => void;
  editAnswers: () => void;
  resetProgress: () => void;
  openPaywall: (tier?: PaywallTier) => void;
  closePaywall: () => void;
  loadOffering: () => Promise<void>;
  purchase: (pkg: PurchasesPackage) => Promise<boolean>;
  restorePurchases: () => Promise<boolean>;
  clearPendingEvolution: () => void;
}

const AppStoreContext = createContext<AppStoreValue | null>(null);

/** Wrap the app in this once; read it anywhere with useAppStore(). */
export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [progress, setProgressState] = useState<UserProgress>(defaultProgress());
  const progressRef = useRef(progress);
  const [course, setCourse] = useState<Course>({ phases: [] });
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallTier, setPaywallTier] = useState<PaywallTier>('premium');
  const [isPremium, setIsPremium] = useState(false);
  const [currentOffering, setOffering] = useState<PurchasesOffering | null>(null);
  const [pendingEvolution, setPendingEvolution] = useState<RobotForm | null>(null);

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
      setCourse(loadBundled(saved.studyArea, saved.language));
      setHydrated(true);
      // Check for new lessons in the background so the splash never waits on the network.
      if (AppConfig.useBackendLessons && saved.language === 'Python') {
        APIClient.fetchCourse(saved.studyArea).then((remote) => {
          if (alive && remote && remote.phases.length) setCourse(remote);
        });
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  // RevenueCat: configure, read entitlements, load the offering, then listen for updates.
  useEffect(() => {
    PurchasesService.configure();
    PurchasesService.customerInfo().then((info) => setIsPremium(PurchasesService.isPremium(info)));
    PurchasesService.currentOffering().then(setOffering);
    return PurchasesService.onUpdate((info) => setIsPremium(PurchasesService.isPremium(info)));
  }, []);

  const orderedLessons = useMemo(() => course.phases.flatMap((p) => p.lessons), [course]);
  const isCompleted = useCallback((l: Lesson) => progress.completedLessons.includes(l.id), [progress.completedLessons]);
  /** A lesson opens once every lesson before it is done. */
  const isUnlocked = useCallback(
    (l: Lesson) => {
      const i = orderedLessons.findIndex((x) => x.id === l.id);
      if (i < 0) return false;
      return orderedLessons.slice(0, i).every((x) => progress.completedLessons.includes(x.id));
    },
    [orderedLessons, progress.completedLessons],
  );
  const currentLesson = useMemo(
    () => orderedLessons.find((l) => !progress.completedLessons.includes(l.id)) ?? null,
    [orderedLessons, progress.completedLessons],
  );
  const isPhaseStarted = useCallback((phase: Phase) => (phase.lessons[0] ? isUnlocked(phase.lessons[0]) : false), [isUnlocked]);
  const completedCount = useCallback(
    (phase: Phase) => phase.lessons.filter((l) => progress.completedLessons.includes(l.id)).length,
    [progress.completedLessons],
  );
  /** The streak only counts if the learner practised today or yesterday. */
  const displayStreak =
    progress.lastActiveDay === DayKey.today() || progress.lastActiveDay === DayKey.yesterday() ? progress.streak : 0;

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
      setCourse(loadBundled(studyArea, language));
    },
    [setProgress],
  );

  /** Records a finished lesson. Returns a new robot form if the learner just evolved. */
  const completeLesson = useCallback(
    (lesson: Lesson, boltsEarned: number): RobotForm | null => {
      const { next, newForm } = withLessonCompleted(progressRef.current, lesson, boltsEarned, course.phases);
      setProgress(next);
      return newForm;
    },
    [course, setProgress],
  );

  /** Finishes a general-path lesson or game: saves it, and queues the evolution screen for the Learn tab if the robot just evolved. */
  const finishLesson = useCallback(
    (lesson: Lesson, boltsEarned: number) => {
      const form = completeLesson(lesson, boltsEarned);
      if (form) setPendingEvolution(form);
    },
    [completeLesson],
  );

  /** Bolts from a track lesson go to the account only when it is finished; streak and daily count update. */
  const creditTrack = useCallback((bolts: number) => setProgress(withTrackBolts(progressRef.current, bolts)), [setProgress]);

  const equip = useCallback(
    (form: RobotForm) => {
      if (!progressRef.current.unlockedForms.includes(form)) return;
      setProgress({ ...progressRef.current, currentForm: form });
    },
    [setProgress],
  );
  const setName = useCallback((name: string) => setProgress({ ...progressRef.current, name: name.trim() }), [setProgress]);
  const editAnswers = useCallback(() => setProgress({ ...progressRef.current, hasOnboarded: false }), [setProgress]);
  const resetProgress = useCallback(() => {
    const fresh = defaultProgress();
    setProgress(fresh);
    setCourse(loadBundled(fresh.studyArea, fresh.language));
  }, [setProgress]);

  const loadOffering = useCallback(async () => setOffering(await PurchasesService.currentOffering()), []);
  /** Stores the entitlement from a purchase or restore. A failed call (no info) leaves the current status alone. */
  const applyCustomerInfo = useCallback((info: CustomerInfo | null) => {
    const premium = PurchasesService.isPremium(info);
    if (info) setIsPremium(premium);
    return premium;
  }, []);
  const purchase = useCallback(async (pkg: PurchasesPackage) => applyCustomerInfo(await PurchasesService.purchase(pkg)), [applyCustomerInfo]);
  const restorePurchases = useCallback(async () => applyCustomerInfo(await PurchasesService.restore()), [applyCustomerInfo]);

  const value: AppStoreValue = {
    hydrated,
    progress,
    course,
    showPaywall,
    paywallTier,
    isPremium,
    currentOffering,
    pendingEvolution,
    orderedLessons,
    currentLesson,
    displayStreak,
    isCompleted,
    isUnlocked,
    isPhaseStarted,
    completedCount,
    finishOnboarding,
    setName,
    finishLesson,
    creditTrack,
    equip,
    editAnswers,
    resetProgress,
    openPaywall: (tier = 'premium') => {
      setPaywallTier(tier);
      setShowPaywall(true);
    },
    closePaywall: () => setShowPaywall(false),
    loadOffering,
    purchase,
    restorePurchases,
    clearPendingEvolution: () => setPendingEvolution(null),
  };
  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useAppStore() {
  const v = useContext(AppStoreContext);
  if (!v) throw new Error('useAppStore must be used inside AppStoreProvider');
  return v;
}
