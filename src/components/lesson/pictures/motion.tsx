// What every lesson picture shares: its play state, colours, timing hooks, the wrong-answer shake and the result pill.
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import { C, body, monoBold } from '../../../utils/theme';
import { useReduceMotion } from '../../../hooks/useReduceMotion';

/** How far the picture has played: waiting for Check, the right answer, or the picked wrong option. */
export type PictureState = 'idle' | 'go' | 'nope';
/** Ease for the pictures' own motion. */
export const EASE = Easing.bezier(0.3, 0.7, 0.3, 1);
/** An overshooting ease for pops. */
export const BOUNCE = Easing.bezier(0.3, 1.5, 0.5, 1);
/** Fill for something the right answer lights up. */
export const LIT = '#B5E04A';
/** Fill for what a wrong answer lights up. */
export const BAD = '#FFB37A';
/** Series colours, in order. */
export const PAL = ['#59B4FF', '#FFC93C', '#FF8A3D', '#B5E04A', '#F48FB1'];

/** The state each option leads to: the right answer's, the picked wrong option's, or nothing yet. */
export function resolve<S>(spec: { correct_state: S; states?: { wrong_by_option?: Record<string, S> } }, state: PictureState, pick: string | null): S | null {
  if (state === 'go') return spec.correct_state;
  if (state === 'nope') return pick ? spec.states?.wrong_by_option?.[pick] ?? null : null;
  return null;
}

/** Runs 0 -> 1 each time the picture acts something out (go or nope); instant with Reduce Motion. */
export function usePlay(key: string, active: boolean, duration: number, delay = 0, easing = EASE, native = true) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    v.stopAnimation();
    if (!active) { v.setValue(0); return; }
    if (reduce) { v.setValue(1); return; }
    v.setValue(0);
    const a = Animated.timing(v, { toValue: 1, duration, delay, easing, useNativeDriver: native });
    a.start();
    return () => a.stop();
  }, [key, active, reduce]); // eslint-disable-line react-hooks/exhaustive-deps
  return v;
}

/** A gentle repeating 0 -> 1 -> 0 while the learner thinks; still with Reduce Motion. */
export function useIdle(on: boolean, duration: number, delay = 0) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!on || reduce) { v.stopAnimation(); v.setValue(0); return; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    const t = setTimeout(() => loop.start(), delay);
    return () => { clearTimeout(t); loop.stop(); };
  }, [on, reduce]); // eslint-disable-line react-hooks/exhaustive-deps
  return v;
}

/** Shakes its contents once on a wrong answer. */
export function Shake({ state, pick, children }: { state: PictureState; pick: string | null; children: React.ReactNode }) {
  const reduce = useReduceMotion();
  const x = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (state !== 'nope' || reduce) return;
    x.setValue(0);
    Animated.sequence([-6, 6, -4, 4, 0].map((toValue) => Animated.timing(x, { toValue, duration: 90, useNativeDriver: true }))).start();
  }, [state, pick, reduce]); // eslint-disable-line react-hooks/exhaustive-deps
  return <Animated.View style={{ transform: [{ translateX: x }] }}>{children}</Animated.View>;
}

/** The dark result pill that pops in after the picture has acted out the answer. */
export function Result({ text, state, k, delay = 450 }: { text: string; state: PictureState; k: string; delay?: number }) {
  const v = usePlay(k, state !== 'idle' && !!text, 260, delay, BOUNCE);
  if (state === 'idle' || !text) return <View style={{ height: 30 }} />;
  return (
    <Animated.View style={{ alignSelf: 'center', marginTop: 8, opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
      flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: C.editor }}>
      <Text style={[body(12, true), { color: C.lavender }]}>result</Text>
      <Text style={[monoBold(15), { color: state === 'nope' ? '#FFB4A2' : LIT }]}>{text}</Text>
    </Animated.View>
  );
}
