// Fade and slide-up style for sheets that rise from the bottom of the screen.
import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import { EASE } from '../utils/motion';

/** Returns an animated style: fades in and rises 36pt each time `visible` turns true. */
export function useSlideUp(visible: boolean) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (visible) {
      v.setValue(0);
      Animated.timing(v, { toValue: 1, duration: 260, easing: EASE, useNativeDriver: true }).start();
    }
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps
  return { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [36, 0] }) }] };
}
