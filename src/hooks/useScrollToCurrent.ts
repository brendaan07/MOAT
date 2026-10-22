// Keeps the learner's current node in view on a path screen: scrolls there on load, when `watch` changes, and when the content grows.
import { useCallback, useEffect, useRef } from 'react';
import { Dimensions, ScrollView } from 'react-native';

/** Give the current node's onLayout callback to PathNode; `watch` is whatever changes when the current node moves. */
export function useScrollToCurrent(watch: unknown) {
  const scrollRef = useRef<ScrollView>(null);
  const currentY = useRef<number | null>(null);
  const scrollToCurrent = useCallback((animated: boolean) => {
    // Wait a beat so the rows have been laid out before measuring.
    setTimeout(() => {
      if (currentY.current == null) return scrollRef.current?.scrollToEnd({ animated });
      const h = Dimensions.get('window').height;
      scrollRef.current?.scrollTo({ y: Math.max(0, currentY.current - h / 2 + 85), animated });
    }, 150);
  }, []);
  useEffect(() => scrollToCurrent(true), [watch, scrollToCurrent]);
  const onCurrentLayout = useCallback((y: number) => {
    currentY.current = y;
  }, []);
  return { scrollRef, scrollToCurrent, onCurrentLayout };
}
