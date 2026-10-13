// Building blocks for the moving pictures: argument lookup, the go/loop animation values, the result tag and the shaking frame.
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Text } from 'react-native';
import { C, body } from '../../../utils/theme';
import { useReduceMotion } from '../../../hooks/useReduceMotion';

export type PicState = 'idle' | 'go' | 'nope';
export type Args = { args: unknown[]; kw: Record<string, unknown> };
/** The outline colour of every picture. */
export const NAVY = C.navy;
const GO_EASE = Easing.bezier(0.3, 0.7, 0.3, 1);

/** Positional or named argument from a picture description. */
export function arg<T>(p: Args, i: number, name: string, fallback: T): T {
  if (p.args.length > i && p.args[i] !== undefined) return p.args[i] as T;
  if (name in p.kw && p.kw[name] !== undefined) return p.kw[name] as T;
  return fallback;
}

/** A value that runs 0 -> 1 when the picture turns to 'go' (instantly with Reduce Motion), and resets otherwise. */
export function useGo(state: PicState, duration: number, delay = 0, easing = GO_EASE) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (state !== 'go') {
      v.stopAnimation();
      v.setValue(0);
      return;
    }
    if (reduce) {
      v.setValue(1);
      return;
    }
    const a = Animated.timing(v, { toValue: 1, duration, delay, easing, useNativeDriver: true });
    a.start();
    return () => a.stop();
  }, [state, reduce]); // eslint-disable-line react-hooks/exhaustive-deps
  return v;
}

/** A repeating 0 -> 1 value while `on`; still at `rest` otherwise or with Reduce Motion. */
export function useLoop(on: boolean, duration: number, opts: { delay?: number; native?: boolean; alternate?: boolean; rest?: number } = {}) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(opts.rest ?? 0)).current;
  useEffect(() => {
    if (!on || reduce) {
      v.stopAnimation();
      v.setValue(opts.rest ?? 0);
      return;
    }
    v.setValue(0);
    const step = Animated.timing(v, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: opts.native ?? true });
    const seq = opts.alternate
      ? Animated.sequence([step, Animated.timing(v, { toValue: 0, duration, easing: Easing.linear, useNativeDriver: opts.native ?? true })])
      : Animated.sequence([Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: opts.native ?? true }), step]);
    const loop = Animated.loop(seq);
    const t = setTimeout(() => loop.start(), opts.delay ?? 0);
    return () => {
      clearTimeout(t);
      loop.stop();
    };
  }, [on, reduce]); // eslint-disable-line react-hooks/exhaustive-deps
  return v;
}

/** The result tag that pops in after the picture has acted out the answer. */
export function Tag({ text, state, delay, x, y, bad = false }: { text: string; state: PicState; delay: number; x: number; y: number; bad?: boolean }) {
  const v = useGo(state, 250, delay * 1000);
  if (!text) return null;
  return (
    <Animated.View style={{ position: 'absolute', left: x, top: y, zIndex: 5, opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] }}>
      <Text style={[body(11, true), { paddingHorizontal: 6, borderRadius: 7, borderWidth: 1.5, borderColor: NAVY, backgroundColor: bad ? C.peach : C.successSheet, overflow: 'hidden' }]}>{text}</Text>
    </Animated.View>
  );
}

/** Every picture sits in a 326-wide frame that shakes on a wrong answer. */
export function Frame({ state, height, label, children }: { state: PicState; height: number; label: string; children: React.ReactNode }) {
  const reduce = useReduceMotion();
  const shake = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (state !== 'nope' || reduce) return;
    shake.setValue(0);
    Animated.sequence([-6, 6, -4, 4, 0].map((x) => Animated.timing(shake, { toValue: x, duration: 90, useNativeDriver: true }))).start();
  }, [state, reduce]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Animated.View accessible accessibilityRole="image" accessibilityLabel={label} style={{ width: 326, height, alignSelf: 'center', transform: [{ translateX: shake }] }}>
      {children}
    </Animated.View>
  );
}
