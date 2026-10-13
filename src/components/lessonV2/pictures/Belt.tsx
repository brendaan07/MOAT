// The conveyor belt picture for the fruit-sorting lessons: fruit passes a sensor and a pusher sends spoilt fruit to the bin.
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Text, View } from 'react-native';
import { C, body } from '../../../utils/theme';
import { useReduceMotion } from '../../../hooks/useReduceMotion';
import { Args, Frame, NAVY, PicState, Tag, arg, useGo, useLoop } from './motion';

const SPRITES: Record<string, number> = {
  bin: require('../../../../assets/images/fruits/bin.png'),
  clean_apple: require('../../../../assets/images/fruits/clean_apple.png'),
  clean_banana: require('../../../../assets/images/fruits/clean_banana.png'),
  clean_cherries: require('../../../../assets/images/fruits/clean_cherries.png'),
  clean_grapes: require('../../../../assets/images/fruits/clean_grapes.png'),
  clean_greenapple: require('../../../../assets/images/fruits/clean_greenapple.png'),
  clean_kiwi: require('../../../../assets/images/fruits/clean_kiwi.png'),
  clean_lemon: require('../../../../assets/images/fruits/clean_lemon.png'),
  clean_melon: require('../../../../assets/images/fruits/clean_melon.png'),
  clean_orange: require('../../../../assets/images/fruits/clean_orange.png'),
  clean_peach: require('../../../../assets/images/fruits/clean_peach.png'),
  clean_pear: require('../../../../assets/images/fruits/clean_pear.png'),
  clean_pineapple: require('../../../../assets/images/fruits/clean_pineapple.png'),
  clean_strawberry: require('../../../../assets/images/fruits/clean_strawberry.png'),
  clean_tomato: require('../../../../assets/images/fruits/clean_tomato.png'),
  clean_watermelon: require('../../../../assets/images/fruits/clean_watermelon.png'),
  spoilt_apple: require('../../../../assets/images/fruits/spoilt_apple.png'),
  spoilt_banana: require('../../../../assets/images/fruits/spoilt_banana.png'),
  spoilt_cherries: require('../../../../assets/images/fruits/spoilt_cherries.png'),
  spoilt_grapes: require('../../../../assets/images/fruits/spoilt_grapes.png'),
  spoilt_greenapple: require('../../../../assets/images/fruits/spoilt_greenapple.png'),
  spoilt_kiwi: require('../../../../assets/images/fruits/spoilt_kiwi.png'),
  spoilt_lemon: require('../../../../assets/images/fruits/spoilt_lemon.png'),
  spoilt_melon: require('../../../../assets/images/fruits/spoilt_melon.png'),
  spoilt_orange: require('../../../../assets/images/fruits/spoilt_orange.png'),
  spoilt_peach: require('../../../../assets/images/fruits/spoilt_peach.png'),
  spoilt_pear: require('../../../../assets/images/fruits/spoilt_pear.png'),
  spoilt_pineapple: require('../../../../assets/images/fruits/spoilt_pineapple.png'),
  spoilt_strawberry: require('../../../../assets/images/fruits/spoilt_strawberry.png'),
  spoilt_tomato: require('../../../../assets/images/fruits/spoilt_tomato.png'),
  spoilt_watermelon: require('../../../../assets/images/fruits/spoilt_watermelon.png'),
};

const SX = 112, BIN_L = 252, KEEP_X = 164, BELT_END = 198, GAP = 50, STEP = 1600;
type Route = 'bin' | 'stay' | 'floor' | 'juice';
type Frame3 = [number, number, number, number, number]; // t (0-1), x, y, rotate, scale

function routeFrames(route: Route, k: number): Frame3[] {
  const S = SX - 16, dx = GAP * k;
  if (route === 'bin') {
    const bx = BIN_L + 34 - S;
    return [[0, 0, 0, 0, 1], [0.3, dx, 0, 0, 1], [0.42, dx + 12, 0, 0, 1], [0.7, dx + bx * 0.7, -22, 40, 1], [0.92, dx + bx, 30, 90, 0.8], [1, dx + bx, 38, 90, 0.75]];
  }
  if (route === 'stay') return [[0, 0, 0, 0, 1], [0.3, dx, 0, 0, 1], [1, dx + KEEP_X - S, 0, 0, 1]];
  if (route === 'floor') return [[0, 0, 0, 0, 1], [0.3, dx, 0, 0, 1], [0.66, dx + BELT_END - S, 0, 0, 1], [0.84, dx + BELT_END - S + 16, 30, 70, 1], [1, dx + BELT_END - S + 18, 48, 120, 1]];
  return [[0, 0, 0, 0, 1], [0.3, dx, 0, 0, 1], [0.55, dx + 30, 0, 0, 1], [1, dx + 30, 42, 0, 0.8]];
}

function Fruit({ sprite, route, badge, k, state, bugLoop }: { sprite: string; route: Route; badge: string | null; k: number; state: PicState; bugLoop: boolean }) {
  const reduce = useReduceMotion();
  const go = useGo(state, STEP, k * STEP, Easing.bezier(0.35, 0.7, 0.35, 1));
  const loop = useLoop(bugLoop && state === 'idle', 2600, { delay: 400 });
  const shake = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (state !== 'nope' || k !== 0 || reduce) return;
    Animated.sequence([-6, 6, -4, 4, 0].map((x) => Animated.timing(shake, { toValue: x, duration: 90, useNativeDriver: true }))).start();
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps
  const fr = routeFrames(route, k);
  const at = (i: number) => fr.map((f) => f[i]);
  const t = fr.map((f) => f[0]);
  const fade = route === 'bin' ? fr.map((f, i) => (i === fr.length - 1 ? 0 : 1)) : fr.map(() => 1);
  const bx = BIN_L + 34 - (SX - 16);
  const bug = { t: [0, 0.22, 0.32, 0.55, 0.75, 0.76, 1], x: [0, 0, 12, bx * 0.7, bx, 0, 0], y: [0, 0, 0, -22, 34, 0, 0], r: [0, 0, 0, 40, 90, 0, 0], o: [1, 1, 1, 1, 0, 0, 1] };
  const looping = bugLoop && state === 'idle' && !reduce;
  const src = looping ? loop : go;
  const T = looping ? bug.t : t;
  const style = {
    opacity: src.interpolate({ inputRange: T, outputRange: looping ? bug.o : fade }),
    transform: [
      { translateX: Animated.add(src.interpolate({ inputRange: T, outputRange: looping ? bug.x : at(1) }), shake) },
      { translateY: src.interpolate({ inputRange: T, outputRange: looping ? bug.y : at(2) }) },
      { rotate: src.interpolate({ inputRange: T, outputRange: (looping ? bug.r : at(3)).map((d) => `${d}deg`) }) },
      { scale: src.interpolate({ inputRange: T, outputRange: looping ? bug.t.map(() => 1) : at(4) }) },
    ],
  };
  return (
    <Animated.View style={[{ position: 'absolute', left: SX - 16 - GAP * k, top: 24, width: 34, height: 34, zIndex: 2 }, style]}>
      <Image source={SPRITES[sprite]} style={{ width: 34, height: 34 }} resizeMode="contain" />
      {badge ? <Text style={[body(10, true), { position: 'absolute', right: -12, top: -8, paddingHorizontal: 4, borderRadius: 6, borderWidth: 1.5, borderColor: NAVY, backgroundColor: C.card, overflow: 'hidden' }]}>{badge}</Text> : null}
    </Animated.View>
  );
}

/** `p` lists the fruit and where each one goes (bin, stay, floor or juice). */
export function Belt({ p, state }: { p: Args; state: PicState }) {
  const items = arg<[string, Route, string | null][]>(p, 0, 'items', []);
  const bugIdle = arg(p, 1, 'bug_idle', false);
  const juice = arg(p, 2, 'juice', false);
  const zoom = arg<number | null>(p, 3, 'zoom', null) ?? 1;
  const reduce = useReduceMotion();
  const stripes = useLoop(true, 700);
  const beam = useLoop(state === 'idle', 1200, { alternate: true, rest: 0.5 });
  // the pusher fires for every binned fruit (and loops with the bug before Check)
  const push = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    push.stopAnimation();
    push.setValue(0);
    if (reduce) return;
    const stroke = () => Animated.sequence([Animated.timing(push, { toValue: 1, duration: 100, useNativeDriver: true }), Animated.timing(push, { toValue: 0, duration: 130, useNativeDriver: true })]);
    if (state === 'go') {
      const seq = items.map(([, r], k) => (r === 'bin' ? Animated.sequence([Animated.delay(k * STEP + STEP * 0.3 - 100), stroke()]) : null)).filter(Boolean) as Animated.CompositeAnimation[];
      const all = Animated.parallel(seq);
      all.start();
      return () => all.stop();
    }
    if (state === 'idle' && bugIdle) {
      const loop = Animated.loop(Animated.sequence([Animated.delay(620), stroke(), Animated.delay(1750)]));
      const t = setTimeout(() => loop.start(), 400);
      return () => {
        clearTimeout(t);
        loop.stop();
      };
    }
  }, [state, reduce]); // eslint-disable-line react-hooks/exhaustive-deps
  const S = SX - 16;
  const H = juice ? 124 : 118;
  const ends: Record<Route, [number, number, string]> = { bin: [BIN_L + 6, 4, 'binned'], stay: [KEEP_X - 4, 84, 'kept'], floor: [BELT_END + 4, 104, 'no rule'], juice: [S + 18, 92, 'juice'] };
  return (
    <View style={{ height: H * zoom, overflow: 'visible' }}>
      <View style={{ width: 326, height: H, alignSelf: 'center', transform: [{ scale: zoom }], marginTop: (H * zoom - H) / 2 }}>
        <Frame state="idle" height={H} label="Conveyor belt: fruit passes a colour sensor; a pusher sends spoilt fruit into the bin">
          <View style={{ position: 'absolute', left: 0, top: 58, width: BELT_END + 10, height: 12, borderRadius: 6, borderWidth: 2, borderColor: NAVY, backgroundColor: '#E3DCCB', overflow: 'hidden' }}>
            <Animated.View style={{ flexDirection: 'row', transform: [{ translateX: stripes.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] }}>
              {Array.from({ length: 14 }, (_, i) => (
                <View key={i} style={{ width: 10, height: 10, backgroundColor: i % 2 ? '#CFC6B0' : '#E3DCCB' }} />
              ))}
            </Animated.View>
          </View>
          <View style={{ position: 'absolute', left: KEEP_X - 14, top: 55, width: BELT_END - KEEP_X + 20, height: 4, borderRadius: 2, backgroundColor: C.lime }} />
          <View style={{ position: 'absolute', left: BELT_END + 6, top: H - 12, width: BIN_L - BELT_END - 4, height: 3, borderRadius: 2, backgroundColor: C.lockedEdge }} />
          <View style={{ position: 'absolute', left: SX - 12, top: 0, width: 24, height: 10, borderRadius: 3, backgroundColor: C.screen }} />
          <Animated.View style={{ position: 'absolute', left: SX - 9, top: 10, width: 18, height: 16, backgroundColor: C.sky, opacity: beam.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.8] }) }} />
          <Animated.View style={{ position: 'absolute', left: S - 13, top: 30, width: 10, height: 22, borderRadius: 4, borderWidth: 2, borderColor: NAVY, backgroundColor: C.orange, zIndex: 3, transform: [{ translateX: push.interpolate({ inputRange: [0, 1], outputRange: [0, 14] }) }] }} />
          {juice && (
            <>
              <View style={{ position: 'absolute', left: S + 10, top: 78, width: 58, height: 28, borderWidth: 2, borderTopWidth: 0, borderColor: NAVY, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, backgroundColor: '#FFF1C9' }} />
              <Text style={[body(10, true), { position: 'absolute', left: S + 16, top: 108, color: C.muted }]}>juice line</Text>
            </>
          )}
          <Image source={SPRITES.bin} style={{ position: 'absolute', left: BIN_L, top: 26, width: 72, height: 68, zIndex: 3 }} resizeMode="contain" />
          {items.map(([sprite, route, badge], k) => (
            <Fruit key={k} sprite={sprite} route={route} badge={badge} k={k} state={state} bugLoop={bugIdle && k === 0} />
          ))}
          {items.map(([, route], k) => (
            <Tag key={`t${k}`} text={ends[route][2]} state={state} delay={(k * STEP + STEP * 0.95) / 1000} x={ends[route][0]} y={ends[route][1]} bad={route === 'floor'} />
          ))}
        </Frame>
      </View>
    </View>
  );
}
