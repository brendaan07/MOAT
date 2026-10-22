// The bolt counter at the top right of every question.
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { BoltIcon, ZapIcon } from '../icons';
import { BORDER, C, heading } from '../../utils/theme';
import { useCountUp } from '../../hooks/useCountUp';
import { useReduceMotion } from '../../hooks/useReduceMotion';

const SPARKS = [
  { x: -34, y: -22, r: -25, c: C.sun, d: 150 },
  { x: 34, y: -23, r: 25, c: C.sky, d: 300 },
  { x: -35, y: 20, r: 200, c: C.sky, d: 450 },
  { x: 33, y: 21, r: 160, c: C.sun, d: 600 },
];
const FLICKER = [1, 0.15, 1, 0.3, 1, 0];

/** White "+N" while answering; after a right answer it turns lime, counts up by 10, glows, bounces and flickers four sparks twice. */
export function BoltPill({ base, earned }: { base: number; earned: boolean }) {
  const reduce = useReduceMotion();
  const shown = useCountUp(earned ? base + 10 : base, { from: base, duration: 900, delay: 150, run: earned && !reduce });
  const glow = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const sparks = useRef(SPARKS.map(() => new Animated.Value(0))).current;
  useEffect(() => {
    if (!earned || reduce) return;
    Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 420, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(glow, { toValue: 0, duration: 780, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
    Animated.sequence([
      Animated.delay(950),
      Animated.timing(scale, { toValue: 1.14, duration: 180, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 270, useNativeDriver: true }),
    ]).start();
    sparks.forEach((s, i) => {
      const flick = FLICKER.map((o) => Animated.timing(s, { toValue: o, duration: 80, useNativeDriver: true }));
      Animated.sequence([Animated.delay(SPARKS[i].d / 6), ...flick, ...flick]).start();
    });
  }, [earned, reduce]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Animated.View
      accessible
      accessibilityLabel={earned ? `10 bolts earned. ${base + 10} this lesson.` : `${base} bolts earned this lesson`}
      style={{ transform: [{ scale }] }}
    >
      <Animated.View
        pointerEvents="none"
        style={{ position: 'absolute', left: -3, right: -3, top: -3, bottom: -3, borderRadius: 24, borderWidth: 6, borderColor: 'rgba(89,180,255,0.6)', opacity: glow, transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) }] }}
      />
      <View style={{ position: 'absolute', left: 0, right: 0, top: 3, height: 36, borderRadius: 18, backgroundColor: C.navy }} />
      <View style={{ height: 36, flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: 8, paddingRight: 10, borderRadius: 18, borderWidth: BORDER, borderColor: C.navy, backgroundColor: earned ? C.lime : C.card }}>
        <BoltIcon />
        <Text style={heading(18)}>+{shown}</Text>
      </View>
      {earned && !reduce &&
        SPARKS.map((s, i) => (
          <Animated.View
            key={i}
            pointerEvents="none"
            style={{ position: 'absolute', left: '50%', top: '50%', marginLeft: s.x - 8, marginTop: s.y - 9, opacity: sparks[i], transform: [{ scale: sparks[i].interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.1] }) }] }}
          >
            <ZapIcon fill={s.c} rotate={s.r} />
          </Animated.View>
        ))}
    </Animated.View>
  );
}
