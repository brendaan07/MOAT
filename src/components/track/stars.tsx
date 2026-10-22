// A row of stars that pop in and shimmer, for the results screens.
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { Sparkle, StarIcon } from '../icons';
import { C } from '../../utils/theme';
import { useReduceMotion } from '../../hooks/useReduceMotion';

function ShimmerStar({ on, index, size, reduce }: { on: boolean; index: number; size: number; reduce: boolean }) {
  const pop = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  const shine = useRef(new Animated.Value(0.2)).current;
  useEffect(() => {
    if (reduce) return;
    Animated.sequence([Animated.delay(350 + index * 130), Animated.spring(pop, { toValue: 1, friction: 4, tension: 90, useNativeDriver: true })]).start();
    if (on) {
      Animated.sequence([
        Animated.delay(900 + index * 350),
        Animated.loop(Animated.sequence([
          Animated.timing(shine, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
          Animated.timing(shine, { toValue: 0.2, duration: 1200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        ])),
      ]).start();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Animated.View style={{ width: size, height: size, opacity: pop, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }, { rotate: pop.interpolate({ inputRange: [0, 1], outputRange: ['-18deg', '0deg'] }) }] }}>
      <StarIcon size={size} fill={on ? C.sun : C.grey} />
      {on && (
        <Animated.View style={{ position: 'absolute', left: size * 0.27, top: size * 0.19, opacity: shine, transform: [{ scale: shine.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.15] }) }] }}>
          <Sparkle size={size * 0.23} />
        </Animated.View>
      )}
      {on && <Animated.View style={{ position: 'absolute', left: size * 0.62, top: size * 0.15, width: size * 0.12, height: size * 0.12, borderRadius: size, backgroundColor: '#FFFFFF', opacity: shine }} />}
    </Animated.View>
  );
}

/** Stars for a result: `filled` of `total` pop in one by one and shimmer. */
export function StarsRow({ filled, total = 5, size = 48 }: { filled: number; total?: number; size?: number }) {
  const reduce = useReduceMotion();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }} accessible accessibilityLabel={`${filled} of ${total} right on the first try`}>
      {Array.from({ length: total }, (_, i) => (
        <ShimmerStar key={i} on={i < filled} index={i} size={size} reduce={reduce} />
      ))}
    </View>
  );
}
