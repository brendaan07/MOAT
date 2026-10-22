// The screen after a lesson: bolts counting up, stars, the streak and Continue.
import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from '../../../components/SafeAreaView';
import { Card, ChunkyButton, DottedBackground } from '../../../components/ui';
import { BoltIcon, FlameIcon } from '../../../components/icons';
import { SegmentBar } from '../../../components/track/progressBars';
import { StarsRow } from '../../../components/track/stars';
import { WeekStrip } from '../../../components/track/WeekStrip';
import { useAppStore } from '../../../hooks/useAppStore';
import { useCountUp } from '../../../hooks/useCountUp';
import { useReduceMotion } from '../../../hooks/useReduceMotion';
import { BORDER, C, body, heading } from '../../../utils/theme';
import { EASE_OUT } from '../../../utils/motion';
import { DayKey } from '../../../utils/dayKey';
import type { RunResult } from '../../../types/models';
import type { TrackLesson, TrackPhase } from '../../../content/types';
import { Hero } from './Hero';

/** Lesson complete: the total counts up, "+N added" slides in, stars pop and shimmer, and a perfect first try shows the +30 tag. */
export function TrackLessonComplete({ phase, lesson, result, onContinue, onReplay }: { phase: TrackPhase; lesson: TrackLesson; result: RunResult; onContinue: () => void; onReplay: () => void }) {
  const app = useAppStore();
  const reduce = useReduceMotion();
  const credited = result.earned + result.bonus;
  const total = useCountUp(app.progress.bolts, { from: app.progress.bolts - credited, duration: 1100, delay: 550, run: !reduce });
  const chip = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  const bounce = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (reduce) return;
    Animated.timing(chip, { toValue: 1, duration: 400, delay: 250, easing: EASE_OUT, useNativeDriver: true }).start();
    Animated.sequence([Animated.delay(1600), Animated.timing(bounce, { toValue: 1.1, duration: 180, useNativeDriver: true }), Animated.timing(bounce, { toValue: 1, duration: 270, useNativeDriver: true })]).start();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
      <DottedBackground />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 8, paddingRight: 16, marginTop: 8 }}>
        <Pressable onPress={onContinue} accessibilityRole="button" accessibilityLabel="Back to Learn" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="close" size={24} color={C.navy} />
        </Pressable>
        <SegmentBar total={result.total} index={result.total} currentCorrect />
        <Animated.View style={{ transform: [{ scale: bounce }] }} accessible accessibilityLabel={`Total bolts ${app.progress.bolts}. ${credited} added from this lesson.`}>
          <View style={{ position: 'absolute', left: 0, right: 0, top: 3, height: 40, borderRadius: 20, backgroundColor: C.navy }} />
          <View style={{ height: 40, flexDirection: 'row', alignItems: 'center', gap: 6, paddingLeft: 10, paddingRight: 14, borderRadius: 20, borderWidth: BORDER, borderColor: C.navy, backgroundColor: C.lime }}>
            <BoltIcon size={22} />
            <Text style={heading(24)}>{total}</Text>
          </View>
        </Animated.View>
      </View>
      <Animated.View style={{ alignSelf: 'flex-end', marginRight: 16, marginTop: 6, opacity: chip, transform: [{ translateY: chip.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingLeft: 8, paddingRight: 12, height: 30, borderRadius: 15, backgroundColor: C.navy }}>
          <BoltIcon size={16} stroke={C.sky} />
          <Text style={[body(15, true), { color: C.cream }]}>+{credited} added</Text>
        </View>
      </Animated.View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, gap: 14 }} showsVerticalScrollIndicator={false}>
        <Hero mood="hearts" size={208} />
        <View style={{ alignItems: 'center', gap: 6 }}>
          <Text style={heading(38)} accessibilityRole="header">Lesson done</Text>
          <Text style={[body(17), { color: C.muted }]}>Phase {phase.number} · part {lesson.part} of {phase.lessons.length}</Text>
        </View>
        <View>
          <Card radius={20} shadow contentStyle={{ paddingHorizontal: 16, paddingVertical: 14, gap: 10 }}>
            <Text style={body(17, true)}>{result.stars} of {result.total} right first try</Text>
            <StarsRow filled={result.stars} total={result.total} />
          </Card>
          {result.bonus > 0 && (
            <View style={{ position: 'absolute', right: 14, top: -16, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, backgroundColor: C.sun, borderWidth: BORDER, borderColor: C.navy }}>
              <Text style={body(13, true)}>+30 perfect first try</Text>
            </View>
          )}
        </View>
        <Card fill={C.screen} radius={20} shadow contentStyle={{ paddingHorizontal: 16, paddingVertical: 14, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <FlameIcon size={24} />
            <Text style={[heading(22), { color: C.cream }]}>{app.displayStreak} day streak</Text>
          </View>
          <WeekStrip streak={app.displayStreak} activeToday={app.progress.lastActiveDay === DayKey.today()} />
        </Card>
      </ScrollView>
      <View style={{ paddingHorizontal: 16 }}>
        <ChunkyButton title="Continue" onPress={onContinue} />
      </View>
      {result.missedIndexes.length > 0 ? (
        <Pressable onPress={onReplay} accessibilityRole="button" style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={[body(17, true), { textDecorationLine: 'underline' }]}>{result.missedIndexes.length === 1 ? 'Review the one I missed' : 'Review the ones I missed'}</Text>
        </Pressable>
      ) : (
        <View style={{ height: 12 }} />
      )}
    </SafeAreaView>
  );
}
