// Counts a number up (or down) so a reward visibly adds to the total.
import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { EASE } from '../utils/motion';

/** Returns the number to show right now. With run=false (Reduce Motion) it jumps straight to the target. */
export function useCountUp(target: number, opts: { from?: number; duration?: number; delay?: number; run?: boolean } = {}) {
  const { from = target, duration = 900, delay = 0, run = true } = opts;
  const v = useRef(new Animated.Value(from)).current;
  const [shown, setShown] = useState(from);
  useEffect(() => {
    const id = v.addListener(({ value }) => setShown(Math.round(value)));
    return () => v.removeListener(id);
  }, [v]);
  useEffect(() => {
    if (!run) {
      v.setValue(target);
      setShown(target);
      return;
    }
    v.setValue(from);
    const a = Animated.timing(v, { toValue: target, duration, delay, easing: EASE, useNativeDriver: false });
    a.start();
    return () => a.stop();
  }, [target, from, run]); // eslint-disable-line react-hooks/exhaustive-deps
  return shown;
}
