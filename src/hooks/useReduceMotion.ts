// Whether the phone's Reduce Motion setting is on, kept up to date. Animations check it and hold still when it is.
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** The Reduce Motion setting. */
export function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => sub.remove();
  }, []);
  return reduce;
}
