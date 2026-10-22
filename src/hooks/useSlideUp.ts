// Slide-up and fade-in for bottom sheets.
import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { EASE_OUT } from '../utils/motion';
import { useReduceMotion } from './useReduceMotion';

/** Style that slides a sheet up and fades it in when `visible` turns true; with Reduce Motion it just appears. */
export function useSlideUp(visible: boolean) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  useEffect(() => {
    if (!visible) return;
    if (reduce) {
      v.setValue(1);
      return;
    }
    v.setValue(0);
    Animated.timing(v, { toValue: 1, duration: 260, easing: EASE_OUT, useNativeDriver: true }).start();
  }, [visible, reduce]); // eslint-disable-line react-hooks/exhaustive-deps
  return { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [36, 0] }) }] };
}
