// A number that counts up to its target, for bolt and star totals.
import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';
import { EASE_OUT } from '../utils/motion';

/** The shown value while it counts from `from` to `target`; jumps straight there when `run` is false. */
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
    const a = Animated.timing(v, { toValue: target, duration, delay, easing: EASE_OUT, useNativeDriver: false });
    a.start();
    return () => a.stop();
  }, [target, from, run]); // eslint-disable-line react-hooks/exhaustive-deps
  return shown;
}
