// Entrance and attention animations shared by every part of a new-style lesson. Each one is switched off by Reduce Motion.
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, Text, View, ViewStyle } from 'react-native';
import { C, body, monoBold } from '../../utils/theme';
import { EASE } from '../../utils/motion';
import { useReduceMotion } from '../../hooks/useReduceMotion';

type Kind = 'stage' | 'head' | 'pop' | 'snap' | 'drop' | 'rowIn';

/** One-shot entrance animations (stage slide-in, heading pop, value pop, snap-in, drop-down, row rise). */
export function Enter({ kind, delay = 0, style, children }: { kind: Kind; delay?: number; style?: StyleProp<ViewStyle>; children: React.ReactNode }) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) {
      v.setValue(1);
      return;
    }
    v.setValue(0);
    const dur = { stage: 340, head: 400, pop: 420, snap: 200, drop: 260, rowIn: 320 }[kind];
    const a = Animated.timing(v, { toValue: 1, duration: dur, delay, easing: kind === 'head' || kind === 'pop' ? Easing.linear : EASE, useNativeDriver: true });
    a.start();
    return () => a.stop();
  }, [reduce]); // eslint-disable-line react-hooks/exhaustive-deps
  let anim: StyleProp<ViewStyle>;
  if (kind === 'stage') anim = { opacity: v, transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) }] };
  else if (kind === 'head')
    anim = { opacity: v.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1, 1] }), transform: [{ scale: v.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.86, 1.05, 1] }) }] };
  else if (kind === 'pop')
    anim = { transform: [{ translateY: v.interpolate({ inputRange: [0, 0.6, 1], outputRange: [10, -6, 0] }) }, { scale: v.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.9, 1.04, 1] }) }] };
  else if (kind === 'snap') anim = { opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] };
  else if (kind === 'drop') anim = { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }] };
  else anim = { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] };
  return <Animated.View style={[style, anim]}>{children}</Animated.View>;
}

/** The pulsing orange ring around an unanswered ?, which fades and grows away (0.45s) once solved. */
function Ring({ solved, radius = 10 }: { solved: boolean; radius?: number }) {
  const reduce = useReduceMotion();
  const pulse = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (solved) {
      pulse.stopAnimation();
      if (reduce) fade.setValue(0);
      else Animated.timing(fade, { toValue: 0, duration: 450, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
      return;
    }
    fade.setValue(1);
    if (reduce) {
      pulse.setValue(0.5);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [solved, reduce]); // eslint-disable-line react-hooks/exhaustive-deps
  const opacity = solved ? fade.interpolate({ inputRange: [0, 1], outputRange: [0, 0.9] }) : reduce ? 0.6 : pulse.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] });
  const scale = solved ? fade.interpolate({ inputRange: [0, 1], outputRange: [1.18, 1.04] }) : pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: 'absolute', left: -5, right: -5, top: -5, bottom: -5, borderRadius: radius, borderWidth: 3, borderColor: C.orange, opacity, transform: [{ scale }] }}
    />
  );
}

/** A ? answer slot: the ? swaps for the value with a pop once the question is solved; the ring fades. */
export function QSlot({ value, solved, size = 16 }: { value: string | null; solved: boolean; size?: number }) {
  return (
    <View style={{ margin: 10, alignSelf: 'flex-start' }}>
      <Ring solved={solved} />
      {solved && value !== null ? (
        <Enter kind="pop">
          <Text style={[monoBold(size), { backgroundColor: C.lime, borderRadius: 6, paddingHorizontal: 5 }]}>{value}</Text>
        </Enter>
      ) : (
        <Text style={[monoBold(size), { color: C.deepOrange, paddingHorizontal: 6 }]}>?</Text>
      )}
    </View>
  );
}

/** The value inherited from an earlier question, sliding in from the top right with one lime glow. */
export function Carry({ text, q }: { text: string; q: number }) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) {
      v.setValue(1);
      return;
    }
    Animated.timing(v, { toValue: 1, duration: 540, delay: 350, easing: EASE, useNativeDriver: true }).start();
    Animated.sequence([
      Animated.delay(700),
      Animated.timing(glow, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(glow, { toValue: 0, duration: 360, useNativeDriver: true }),
    ]).start();
  }, [reduce]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Animated.View
      style={{
        alignSelf: 'flex-start',
        opacity: v,
        transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }, { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }],
      }}
      accessibilityLabel={`From question ${q}: ${text}`}
    >
      <Animated.View pointerEvents="none" style={{ position: 'absolute', left: -6, right: -6, top: -6, bottom: -6, borderRadius: 14, backgroundColor: C.lime, opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.55] }) }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 3, paddingLeft: 7, paddingRight: 9, borderRadius: 9, backgroundColor: C.successSheet, borderWidth: 2, borderColor: C.navy }}>
        <Text style={[body(12, true), { color: C.cream, backgroundColor: C.navy, borderRadius: 5, paddingHorizontal: 5, overflow: 'hidden' }]}>Q{q}</Text>
        <Text style={monoBold(13)}>{text}</Text>
      </View>
    </Animated.View>
  );
}

/** Pressed cards and buttons move down 2px. */
export const pressDown = ({ pressed }: { pressed: boolean }) => ({ transform: [{ translateY: pressed ? 2 : 0 }] });
