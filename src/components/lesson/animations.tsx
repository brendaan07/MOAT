// One-shot entrance animations for the lesson screens, switched off with Reduce Motion, and the pressed-down style.
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, ViewStyle } from 'react-native';
import { EASE_OUT } from '../../utils/motion';
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
    const a = Animated.timing(v, { toValue: 1, duration: dur, delay, easing: kind === 'head' || kind === 'pop' ? Easing.linear : EASE_OUT, useNativeDriver: true });
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

/** Pressed cards and buttons move down 2px. */
export const pressDown = ({ pressed }: { pressed: boolean }) => ({ transform: [{ translateY: pressed ? 2 : 0 }] });
