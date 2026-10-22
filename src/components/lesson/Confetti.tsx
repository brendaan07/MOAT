// Confetti over a finished checkpoint's recap.
import React, { useEffect, useMemo } from 'react';
import { AccessibilityInfo, Animated, Easing, View } from 'react-native';
import { useReduceMotion } from '../../hooks/useReduceMotion';

/* ------------------------------------------------------------------ checkpoint confetti */
const CONFETTI_COLOURS = ['#B5E04A', '#59B4FF', '#FFC93C', '#FF8A3D', '#FFD6E0', '#1B2472'];
/** 30 pieces fall once over the green checkpoint recap (2.0 to 2.6 s, staggered); Reduce Motion shows none. */
export function Confetti() {
  const reduce = useReduceMotion();
  const pieces = useMemo(() => Array.from({ length: 30 }, (_, i) => ({
    left: (i * 37) % 380, w: 7 + (i % 3) * 3, colour: CONFETTI_COLOURS[i % 6], delay: (i % 10) * 80, duration: 2000 + (i % 5) * 150, rot: (i * 47) % 360, v: new Animated.Value(0),
  })), []);
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility('Checkpoint complete');
    if (reduce) return;
    Animated.parallel(pieces.map((p) => Animated.timing(p.v, { toValue: 1, duration: p.duration, delay: p.delay, easing: Easing.bezier(0.2, 0.6, 0.4, 1), useNativeDriver: true }))).start();
  }, [reduce]); // eslint-disable-line react-hooks/exhaustive-deps
  if (reduce) return null;
  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', zIndex: 20 }}>
      {pieces.map((p, i) => (
        <Animated.View key={i} style={{ position: 'absolute', top: -24, left: p.left, width: p.w, height: p.w + 6, borderRadius: 2, backgroundColor: p.colour,
          opacity: p.v.interpolate({ inputRange: [0, 0.85, 1], outputRange: [1, 1, 0] }),
          transform: [{ translateY: p.v.interpolate({ inputRange: [0, 1], outputRange: [0, 900] }) }, { rotate: p.v.interpolate({ inputRange: [0, 1], outputRange: [`${p.rot}deg`, `${p.rot + 540}deg`] }) }] }} />
      ))}
    </View>
  );
}
