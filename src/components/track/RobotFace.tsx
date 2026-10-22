// Blob with a mood, and the moods each question uses.
import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { BundleImage } from '../ui';
import { RobotMood, robotImage } from '../../types/models';
import { useReduceMotion } from '../../hooks/useReduceMotion';

/** The robot with a mood. Every new mood pops in, as on the canvas. */
export function RobotFace({ mood, width, height }: { mood: RobotMood; width: number; height: number }) {
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
      <BundleImage name={robotImage(mood)} style={{ width, height }} />
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
