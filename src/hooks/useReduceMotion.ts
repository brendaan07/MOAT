// Whether the system Reduce Motion setting is on.
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** The system Reduce Motion setting, kept up to date while the app runs. */
export function useReduceMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => sub.remove();
  }, []);
  return reduce;
}
