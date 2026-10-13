// The Learn home for the general path: lessons climb upward in phases, with the current lesson kept in view.
import React, { useCallback, useMemo } from 'react';
import { Text, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppStore } from '../hooks/useAppStore';
import { useScrollToCurrent } from '../hooks/useScrollToCurrent';
import { useTrackStore } from '../hooks/useTrackStore';
import { Card } from '../components/ui';
import { PathNode } from '../components/path/PathNode';
import { PathScreenLayout } from '../components/path/PathScreenLayout';
import { PhaseBanner } from '../components/path/PhaseBanner';
import { C, body, heading } from '../utils/theme';
import { Lesson, Phase, moodImage } from '../types/models';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Row = { id: string; kind: 'banner'; phase: Phase } | { id: string; kind: 'lesson'; lesson: Lesson; phase: Phase; step: number };

export default function LearnScreen() {
  const store = useAppStore();
  const track = useTrackStore();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { scrollRef, scrollToCurrent, onCurrentLayout } = useScrollToCurrent(store.progress.completedLessons.length);

  // The path is drawn bottom-up, so the rows are built in order and then reversed.
  const rows = useMemo(() => {
    const out: Row[] = [];
    let step = 0;
    for (const phase of store.course.phases) {
      out.push({ id: `banner-${phase.id}`, kind: 'banner', phase });
      for (const lesson of phase.lessons) out.push({ id: lesson.id, kind: 'lesson', lesson, phase, step: step++ });
    }
    return out.reverse();
  }, [store.course]);

  // Celebrate an evolution only once the lesson screen has fully closed.
  useFocusEffect(
    useCallback(() => {
      if (store.pendingEvolution) {
        const form = store.pendingEvolution;
        store.clearPendingEvolution();
        navigation.navigate('Evolution', { form });
      }
    }, [store.pendingEvolution]), // eslint-disable-line react-hooks/exhaustive-deps
  );

  const openLesson = (lesson: Lesson) => (lesson.game ? navigation.navigate('GameLesson', { lessonId: lesson.id }) : navigation.navigate('Lesson', { lessonId: lesson.id }));
  const openPremium = () => store.openPaywall('premium');

  const lessonRow = (lesson: Lesson, phase: Phase, step: number) => {
    const done = store.isCompleted(lesson);
    const unlocked = store.isUnlocked(lesson);
    const isCurrent = store.currentLesson?.id === lesson.id;
    const phaseLocked = !store.isPhaseStarted(phase);
    const isLast = phase.lessons[phase.lessons.length - 1]?.id === lesson.id;
    const state = done ? 'complete' : unlocked ? 'start' : 'locked';
    const form = store.progress.currentForm;
    return (
      <PathNode
        key={lesson.id}
        step={step}
        isCurrent={isCurrent}
        fill={done ? C.lime : isCurrent ? C.sky : C.locked}
        icon={done ? 'checkmark' : isCurrent ? 'play' : isLast ? 'star' : 'lock-closed'}
        iconColor={unlocked ? C.navy : C.lockedText}
        phaseLocked={phaseLocked}
        title={lesson.title}
        accessibilityLabel={`${lesson.title}, ${state}`}
        onPress={() => (unlocked ? openLesson(lesson) : phaseLocked ? openPremium() : undefined)}
        robotName={moodImage(form, form === 'blob' ? 'excited' : 'closed')}
        onCurrentLayout={onCurrentLayout}
      />
    );
  };

  const banner = (phase: Phase) => {
    const started = store.isPhaseStarted(phase);
    return (
      <PhaseBanner
        key={`banner-${phase.id}`}
        unlocked={started}
        eyebrow={started ? `Phase ${phase.number}` : `Phase ${phase.number} · skip with Premium`}
        title={phase.title}
        progressLabel={`${store.completedCount(phase)} of ${phase.lessons.length}`}
        lockedLabel="Premium"
        lockedIcon="ribbon"
        onPress={() => (!started ? openPremium() : undefined)}
      />
    );
  };

  const didNotLoad = store.course.phases.length === 0 && (
    <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
      <Card radius={20} contentStyle={{ padding: 20, gap: 10, alignItems: 'center' }}>
        <Text style={heading(22)}>Lessons didn't load</Text>
        <Text style={[body(15), { textAlign: 'center' }]}>Check that the lesson files are inside the app. See Troubleshooting in the README.</Text>
      </Card>
    </View>
  );

  return (
    <PathScreenLayout scrollRef={scrollRef} onContentSizeChange={() => scrollToCurrent(false)} streak={store.displayStreak} bolts={store.progress.bolts} minutes={track.minutesToday} emptyState={didNotLoad || undefined}>
      {rows.map((r) => (r.kind === 'banner' ? banner(r.phase) : lessonRow(r.lesson, r.phase, r.step)))}
    </PathScreenLayout>
  );
}
