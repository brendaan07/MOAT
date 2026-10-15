// The learner's robot with a mood, the mood rotation across questions, and the row that seats it beside a bubble.
import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { RobotForm, RobotMood, moodImage } from '../../types/models';
import { useReduceMotion } from '../../hooks/useReduceMotion';
import { BundleImage } from '../ui';

/** The learner's robot with a mood. Every new mood pops in, as on the canvas. */
export function RobotFace({ form, mood, width, height }: { form: RobotForm; mood: RobotMood; width: number; height: number }) {
  const reduce = useReduceMotion();
  const scale = useRef(new Animated.Value(1)).current;
  const y = useRef(new Animated.Value(0)).current;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (reduce) return;
    scale.setValue(0.9);
    y.setValue(10);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }),
      Animated.spring(y, { toValue: 0, friction: 4, tension: 120, useNativeDriver: true }),
    ]).start();
  }, [mood]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Animated.View style={{ width, height, transform: [{ scale }, { translateY: y }] }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <BundleImage name={moodImage(form, mood)} style={{ width, height }} />
    </Animated.View>
  );
}

/** Moods rotate across questions, and a wrong answer never winks. */
export function moodPlan(index: number): { ask: RobotMood; ok: RobotMood; bad: RobotMood } {
  const asks: RobotMood[] = ['neutral', 'confused', 'surprised'];
  const oks: RobotMood[] = ['excited', 'hearts', 'wink'];
  const ask = asks[index % 3];
  return { ask, ok: oks[(index + 1) % 3], bad: ask === 'surprised' ? 'confused' : 'surprised' };
}

/** The robot standing beside a speech bubble. */
export function CoachRow({ form, mood, children }: { form: RobotForm; mood: RobotMood; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, zIndex: 3 }}>
      <RobotFace form={form} mood={mood} width={86} height={90} />
      {children}
    </View>
  );
}
