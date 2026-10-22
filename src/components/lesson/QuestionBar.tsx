// The lesson progress bars: the live question bar, and the plain one on the goal and recap screens.
import React, { useEffect, useRef, useState } from 'react';
import { Animated, View } from 'react-native';
import { BORDER, C } from '../../utils/theme';
import { EASE_OUT } from '../../utils/motion';
import { useReduceMotion } from '../../hooks/useReduceMotion';

/** The lesson's question bar: one segment per question; the current one is outlined and fills lime when right. */
export function QuestionBar({ total, index, right }: { total: number; index: number; right: boolean }) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(0)).current;
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!right) {
      v.setValue(0);
      return;
    }
    if (reduce) v.setValue(1);
    else Animated.timing(v, { toValue: 1, duration: 500, easing: EASE_OUT, useNativeDriver: true }).start();
  }, [right, reduce]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <View style={{ flex: 1, flexDirection: 'row', gap: 6 }} accessibilityRole="progressbar" accessibilityLabel={`Question ${index + 1} of ${total}`}>
      {Array.from({ length: total }, (_, i) => {
        const done = i < index;
        const cur = i === index;
        return (
          <View
            key={i}
            onLayout={cur ? (e) => setW(e.nativeEvent.layout.width) : undefined}
            style={{
              flex: 1,
              height: 12,
              borderRadius: 6,
              borderWidth: BORDER,
              borderColor: C.navy,
              overflow: 'hidden',
              backgroundColor: done ? C.lime : cur ? C.hintBlue : C.locked,
              ...(cur ? { shadowColor: C.sky, shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 0 }, elevation: 0 } : {}),
            }}
          >
            {cur && w > 0 && <Animated.View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: w, backgroundColor: C.lime, transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [-w, 0] }) }] }} />}
          </View>
        );
      })}
    </View>
  );
}

/** A plain progress bar: `done` of `total` segments filled. */
export function Segments({ done, total = 5 }: { done: number; total?: number }) {
  return (
    <View style={{ flex: 1, flexDirection: 'row', gap: 6 }} accessibilityRole="progressbar" accessibilityLabel={`${done} of ${total} questions done`}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={{ flex: 1, height: 12, borderRadius: 6, borderWidth: BORDER, borderColor: C.navy, backgroundColor: i < done ? C.lime : C.locked }} />
      ))}
    </View>
  );
}
