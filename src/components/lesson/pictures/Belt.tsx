// Engineering's fruit-sorting conveyor belt.
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Text, View } from 'react-native';
import { useReduceMotion } from '../../../hooks/useReduceMotion';
import { C, body } from '../../../utils/theme';
import type { BeltPicture, BeltRoute } from '../../../content/types';
import { lessonImage } from '../../../utils/lessonImages';
import { PictureState, Result, resolve, usePlay } from './motion';

/** The fruit sorter: fruit passes a colour sensor, and each one takes its route (bin, stay, juice line or off the end).
 *  State: [[[sprite, route, badge], ...], text]; sprites are image paths. Options: juice (draws the juice line). */
const BX = 112, BIN_L = 252, KEEP_X = 164, BELT_END = 198, GAP = 50, STEP = 1600;
const ROUTE_END: Record<BeltRoute, [number, number, string]> = { bin: [BIN_L + 6, 4, 'binned'], stay: [KEEP_X - 4, 84, 'kept'], floor: [BELT_END + 4, 104, 'off the end'], juice: [BX + 2, 92, 'juice'] };
function routeFrames(route: BeltRoute, k: number): number[][] { // t (0 to 1), x, y, rotate, scale, opacity
  const S = BX - 16, dx = GAP * k;
  if (route === 'bin') {
    const bx = BIN_L + 34 - S;
    return [[0, 0, 0, 0, 1, 1], [0.3, dx, 0, 0, 1, 1], [0.42, dx + 12, 0, 0, 1, 1], [0.7, dx + bx * 0.7, -22, 40, 1, 1], [0.92, dx + bx, 30, 90, 0.8, 1], [1, dx + bx, 38, 90, 0.75, 0]];
  }
  if (route === 'stay') return [[0, 0, 0, 0, 1, 1], [0.3, dx, 0, 0, 1, 1], [1, dx + KEEP_X - S, 0, 0, 1, 1]];
  if (route === 'floor') return [[0, 0, 0, 0, 1, 1], [0.3, dx, 0, 0, 1, 1], [0.66, dx + BELT_END - S, 0, 0, 1, 1], [0.84, dx + BELT_END - S + 16, 30, 70, 1, 1], [1, dx + BELT_END - S + 18, 48, 120, 1, 1]];
  return [[0, 0, 0, 0, 1, 1], [0.3, dx, 0, 0, 1, 1], [0.55, dx + 30, 0, 0, 1, 1], [1, dx + 30, 42, 0, 0.8, 1]];
}
function BeltFruit({ sprite, route, badge, k, play }: { sprite: string; route: BeltRoute; badge: string | null; k: number; play: Animated.AnimatedInterpolation<number> }) {
  const fr = routeFrames(route, k);
  const t = fr.map((f) => f[0]);
  const col = (i: number) => play.interpolate({ inputRange: t, outputRange: fr.map((f) => f[i]) });
  return (
    <Animated.View style={{ position: 'absolute', left: BX - 16 - GAP * k, top: 24, width: 34, height: 34, zIndex: 2, opacity: col(5),
      transform: [{ translateX: col(1) }, { translateY: col(2) }, { rotate: play.interpolate({ inputRange: t, outputRange: fr.map((f) => `${f[3]}deg`) }) }, { scale: col(4) }] }}>
      <Image source={lessonImage(sprite)} style={{ width: 34, height: 34 }} resizeMode="contain" />
      {badge ? <Text style={[body(10, true), { position: 'absolute', right: -12, top: -8, paddingHorizontal: 4, borderRadius: 6, borderWidth: 1.5, borderColor: C.navy, backgroundColor: C.card, overflow: 'hidden' }]}>{badge}</Text> : null}
    </Animated.View>
  );
}
/** Fruit rides the belt past the sensor; on Check each fruit takes its route and the result shows. */
export function Belt({ spec, state, pick }: { spec: BeltPicture; state: PictureState; pick: string | null }) {
  const s = resolve(spec, state, pick);
  const items: [string, BeltRoute, string | null][] = s ? s[0] : (spec.correct_state?.[0] ?? []).map(([sprite, , badge]: [string, BeltRoute, string | null]) => [sprite, 'stay', badge]);
  const k = `${state}-${pick}`;
  const reduce = useReduceMotion();
  const total = Math.max(1, items.length);
  // one clock for the whole run: fruit k moves during its own slice of it
  const run = usePlay(k, !!s, STEP * total, 0, Easing.linear);
  const stripes = useRef(new Animated.Value(0)).current;
  const push = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(Animated.timing(stripes, { toValue: 1, duration: 700, easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [reduce]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    push.stopAnimation();
    push.setValue(0);
    if (!s || reduce) return;
    const stroke = () => Animated.sequence([Animated.timing(push, { toValue: 1, duration: 100, useNativeDriver: true }), Animated.timing(push, { toValue: 0, duration: 130, useNativeDriver: true })]);
    const strokes = items.map(([, r], i) => (r === 'bin' ? Animated.sequence([Animated.delay(i * STEP + STEP * 0.3 - 100), stroke()]) : null)).filter(Boolean) as Animated.CompositeAnimation[];
    const all = Animated.parallel(strokes);
    all.start();
    return () => all.stop();
  }, [k, reduce]); // eslint-disable-line react-hooks/exhaustive-deps
  const H = spec.options?.juice ? 124 : 118;
  const S = BX - 16;
  return (
    <View>
      <View style={{ width: 326, height: H, alignSelf: 'center' }}>
        <View style={{ position: 'absolute', left: 0, top: 58, width: BELT_END + 10, height: 12, borderRadius: 6, borderWidth: 2, borderColor: C.navy, backgroundColor: '#E3DCCB', overflow: 'hidden' }}>
          <Animated.View style={{ flexDirection: 'row', transform: [{ translateX: stripes.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }}>
            {Array.from({ length: 22 }, (_, i) => <View key={i} style={{ width: 10, height: 10, backgroundColor: i % 2 ? '#CFC6B0' : '#E3DCCB' }} />)}
          </Animated.View>
        </View>
        <View style={{ position: 'absolute', left: KEEP_X - 14, top: 55, width: BELT_END - KEEP_X + 20, height: 4, borderRadius: 2, backgroundColor: C.lime }} />
        <View style={{ position: 'absolute', left: BX - 12, top: 0, width: 24, height: 10, borderRadius: 3, backgroundColor: C.screen }} />
        <View style={{ position: 'absolute', left: BX - 9, top: 10, width: 18, height: 16, backgroundColor: C.sky, opacity: 0.5 }} />
        <Animated.View style={{ position: 'absolute', left: S - 13, top: 30, width: 10, height: 22, borderRadius: 4, borderWidth: 2, borderColor: C.navy, backgroundColor: C.orange, zIndex: 3,
          transform: [{ translateX: push.interpolate({ inputRange: [0, 1], outputRange: [0, 14] }) }] }} />
        {spec.options?.juice ? (
          <>
            <View style={{ position: 'absolute', left: S + 10, top: 78, width: 58, height: 28, borderWidth: 2, borderTopWidth: 0, borderColor: C.navy, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, backgroundColor: '#FFF1C9' }} />
            <Text style={[body(10, true), { position: 'absolute', left: S + 16, top: 108, color: C.muted }]}>juice line</Text>
          </>
        ) : null}
        <Image source={lessonImage('assets/images/fruits/bin.png')} style={{ position: 'absolute', left: BIN_L, top: 26, width: 72, height: 68, zIndex: 3 }} resizeMode="contain" />
        {items.map(([sprite, route, badge], i) => (
          <BeltFruit key={`${k}-${i}`} sprite={sprite} route={route} badge={badge} k={i}
            play={run.interpolate({ inputRange: [0, i / total, (i + 1) / total, 1], outputRange: [0, 0, 1, 1], extrapolate: 'clamp' })} />
        ))}
        {s ? items.map(([, route], i) => {
          const [x, y, label] = ROUTE_END[route];
          const shown = run.interpolate({ inputRange: [0, (i + 0.9) / total, (i + 1) / total, 1], outputRange: [0, 0, 1, 1], extrapolate: 'clamp' });
          return (
            <Animated.View key={`t${i}`} style={{ position: 'absolute', left: x, top: y, zIndex: 4, opacity: shown }}>
              <Text style={[body(10.5, true), { paddingHorizontal: 5, borderRadius: 6, borderWidth: 1.5, borderColor: C.navy, overflow: 'hidden',
                backgroundColor: state === 'nope' ? C.peach : C.successSheet }]}>{label}</Text>
            </Animated.View>
          );
        }) : null}
      </View>
      <Result text={s ? s[1] : ''} state={state} k={k} delay={STEP * total} />
    </View>
  );
}
