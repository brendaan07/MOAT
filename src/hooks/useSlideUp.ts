// Slide-up and fade-in for bottom sheets.
import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { EASE_OUT } from '../utils/motion';

/** Style that slides a sheet up and fades it in when `visible` turns true. */
export function useSlideUp(visible: boolean) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) {
      v.setValue(0);
      Animated.timing(v, { toValue: 1, duration: 260, easing: EASE_OUT, useNativeDriver: true }).start();
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps
  return { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [36, 0] }) }] };
}
