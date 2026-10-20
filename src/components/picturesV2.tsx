/**
 * Moving pictures for the new-style Engineering and Healthcare lessons (canvas pages "Engineering lessons, new style"
 * and "Healthcare lessons, Python and R"). Each picture idles while the learner thinks and acts out the answer
 * when it is right ('go'); a wrong answer ('nope') gives it a short shake. Reduce Motion holds everything still.
 * Timings match the canvas so the app looks the same as the designs.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { BORDER, C, body, monoBold } from '../utils/theme';
import { useReduceMotion } from '../hooks/useReduceMotion';

export type PicState = 'idle' | 'go' | 'nope';
type Args = { args: unknown[]; kw: Record<string, unknown> };
const NAVY = C.navy;
const EASE = Easing.bezier(0.3, 0.7, 0.3, 1);
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedPath = Animated.createAnimatedComponent(Path);

const SPRITES: Record<string, number> = {
  bin: require('../../assets/images/fruits/bin.png'),
  clean_apple: require('../../assets/images/fruits/clean_apple.png'),
  clean_banana: require('../../assets/images/fruits/clean_banana.png'),
  clean_cherries: require('../../assets/images/fruits/clean_cherries.png'),
  clean_grapes: require('../../assets/images/fruits/clean_grapes.png'),
  clean_greenapple: require('../../assets/images/fruits/clean_greenapple.png'),
  clean_kiwi: require('../../assets/images/fruits/clean_kiwi.png'),
  clean_lemon: require('../../assets/images/fruits/clean_lemon.png'),
  clean_melon: require('../../assets/images/fruits/clean_melon.png'),
  clean_orange: require('../../assets/images/fruits/clean_orange.png'),
  clean_peach: require('../../assets/images/fruits/clean_peach.png'),
  clean_pear: require('../../assets/images/fruits/clean_pear.png'),
  clean_pineapple: require('../../assets/images/fruits/clean_pineapple.png'),
  clean_strawberry: require('../../assets/images/fruits/clean_strawberry.png'),
  clean_tomato: require('../../assets/images/fruits/clean_tomato.png'),
  clean_watermelon: require('../../assets/images/fruits/clean_watermelon.png'),
  spoilt_apple: require('../../assets/images/fruits/spoilt_apple.png'),
  spoilt_banana: require('../../assets/images/fruits/spoilt_banana.png'),
  spoilt_cherries: require('../../assets/images/fruits/spoilt_cherries.png'),
  spoilt_grapes: require('../../assets/images/fruits/spoilt_grapes.png'),
  spoilt_greenapple: require('../../assets/images/fruits/spoilt_greenapple.png'),
  spoilt_kiwi: require('../../assets/images/fruits/spoilt_kiwi.png'),
  spoilt_lemon: require('../../assets/images/fruits/spoilt_lemon.png'),
  spoilt_melon: require('../../assets/images/fruits/spoilt_melon.png'),
  spoilt_orange: require('../../assets/images/fruits/spoilt_orange.png'),
  spoilt_peach: require('../../assets/images/fruits/spoilt_peach.png'),
  spoilt_pear: require('../../assets/images/fruits/spoilt_pear.png'),
  spoilt_pineapple: require('../../assets/images/fruits/spoilt_pineapple.png'),
  spoilt_strawberry: require('../../assets/images/fruits/spoilt_strawberry.png'),
  spoilt_tomato: require('../../assets/images/fruits/spoilt_tomato.png'),
  spoilt_watermelon: require('../../assets/images/fruits/spoilt_watermelon.png'),
};

/** Positional or named argument from a picture description. */
function arg<T>(p: Args, i: number, name: string, fallback: T): T {
  if (p.args.length > i && p.args[i] !== undefined) return p.args[i] as T;
  if (name in p.kw && p.kw[name] !== undefined) return p.kw[name] as T;
  return fallback;
}

/** A value that runs 0 -> 1 when the picture turns to 'go' (instantly with Reduce Motion), and resets otherwise. */
function useGo(state: PicState, duration: number, delay = 0, easing = EASE) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (state !== 'go') {
      v.stopAnimation();
      v.setValue(0);
      return;
    }
    if (reduce) {
      v.setValue(1);
      return;
    }
    const a = Animated.timing(v, { toValue: 1, duration, delay, easing, useNativeDriver: true });
    a.start();
    return () => a.stop();
  }, [state, reduce]); // eslint-disable-line react-hooks/exhaustive-deps
  return v;
}

/** A repeating 0 -> 1 value while `on`; still at `rest` otherwise or with Reduce Motion. */
function useLoop(on: boolean, duration: number, opts: { delay?: number; native?: boolean; alternate?: boolean; rest?: number } = {}) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(opts.rest ?? 0)).current;
  useEffect(() => {
    if (!on || reduce) {
      v.stopAnimation();
      v.setValue(opts.rest ?? 0);
      return;
    }
    v.setValue(0);
    const step = Animated.timing(v, { toValue: 1, duration, easing: Easing.linear, useNativeDriver: opts.native ?? true });
    const seq = opts.alternate
      ? Animated.sequence([step, Animated.timing(v, { toValue: 0, duration, easing: Easing.linear, useNativeDriver: opts.native ?? true })])
      : Animated.sequence([Animated.timing(v, { toValue: 0, duration: 0, useNativeDriver: opts.native ?? true }), step]);
    const loop = Animated.loop(seq);
    const t = setTimeout(() => loop.start(), opts.delay ?? 0);
    return () => {
      clearTimeout(t);
      loop.stop();
    };
  }, [on, reduce]); // eslint-disable-line react-hooks/exhaustive-deps
  return v;
}

/** The result tag that pops in after the picture has acted out the answer. */
function Tag({ text, state, delay, x, y, bad = false }: { text: string; state: PicState; delay: number; x: number; y: number; bad?: boolean }) {
  const v = useGo(state, 250, delay * 1000);
  if (!text) return null;
  return (
    <Animated.View style={{ position: 'absolute', left: x, top: y, zIndex: 5, opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] }}>
      <Text style={[body(11, true), { paddingHorizontal: 6, borderRadius: 7, borderWidth: 1.5, borderColor: NAVY, backgroundColor: bad ? C.peach : C.successSheet, overflow: 'hidden' }]}>{text}</Text>
    </Animated.View>
  );
}

/** Every picture sits in a 326-wide frame that shakes on a wrong answer. */
function Frame({ state, height, label, children }: { state: PicState; height: number; label: string; children: React.ReactNode }) {
  const reduce = useReduceMotion();
  const shake = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (state !== 'nope' || reduce) return;
    shake.setValue(0);
    Animated.sequence([-6, 6, -4, 4, 0].map((x) => Animated.timing(shake, { toValue: x, duration: 90, useNativeDriver: true }))).start();
  }, [state, reduce]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Animated.View accessible accessibilityRole="image" accessibilityLabel={label} style={{ width: 326, height, alignSelf: 'center', transform: [{ translateX: shake }] }}>
      {children}
    </Animated.View>
  );
}

// ---------------------------------------------------------------- conveyor belt (fruit sorter)
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

function Belt({ p, state }: { p: Args; state: PicState }) {
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

// ---------------------------------------------------------------- circuit
function Circuit({ p, state }: { p: Args; state: PicState }) {
  const volts = arg(p, 0, 'volts', 12);
  const res = arg<number[]>(p, 1, 'res', [4]);
  const ammeter = arg(p, 2, 'ammeter', true);
  const reduce = useReduceMotion();
  const flow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    flow.stopAnimation();
    flow.setValue(0);
    if (state !== 'go' || reduce) return;
    const loop = Animated.loop(Animated.timing(flow, { toValue: 1, duration: 700, easing: Easing.linear, useNativeDriver: false }));
    loop.start();
    return () => loop.stop();
  }, [state, reduce]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Frame state={state} height={96} label={`Circuit: a ${volts} volt battery and resistors of ${res.join(', ')} ohms`}>
      <Svg width={326} height={96} viewBox="0 0 326 96">
        <Rect x={24} y={14} width={278} height={64} rx={10} fill="none" stroke={NAVY} strokeWidth={2.6} />
        <AnimatedRect x={24} y={14} width={278} height={64} rx={10} fill="none" stroke={C.sky} strokeWidth={3} strokeDasharray="4 10"
          strokeDashoffset={flow.interpolate({ inputRange: [0, 1], outputRange: [0, -28] })} opacity={state === 'go' ? 1 : 0} />
        <Rect x={10} y={30} width={28} height={32} fill={C.cream} />
        <Line x1={14} y1={38} x2={34} y2={38} stroke={NAVY} strokeWidth={3} />
        <Line x1={18} y1={46} x2={30} y2={46} stroke={NAVY} strokeWidth={3} />
        <Line x1={14} y1={54} x2={34} y2={54} stroke={NAVY} strokeWidth={3} />
        <SvgText x={56} y={50} fontSize={13} fontWeight="700" fill={NAVY}>{`${volts} V`}</SvgText>
        {res.map((r, k) => {
          const x = 110 + k * 78;
          return (
            <G key={k}>
              <Rect x={x - 4} y={8} width={56} height={12} fill={C.cream} />
              <Path d={`M${x - 4} 14 l6 -6 l8 12 l8 -12 l8 12 l8 -12 l8 12 l6 -6`} fill="none" stroke={NAVY} strokeWidth={2.4} strokeLinejoin="round" />
              <SvgText x={x + 24} y={36} fontSize={12} fontWeight="700" fill={NAVY} textAnchor="middle">{`${r} Ω`}</SvgText>
            </G>
          );
        })}
        {ammeter && (
          <G>
            <Circle cx={164} cy={78} r={13} fill={C.hintBlue} stroke={NAVY} strokeWidth={2.4} />
            <SvgText x={164} y={83} fontSize={13} fontWeight="700" fill={NAVY} textAnchor="middle">A</SvgText>
          </G>
        )}
      </Svg>
    </Frame>
  );
}

// ---------------------------------------------------------------- battery, drip, gauge, clock, wristband
function Battery({ p, state }: { p: Args; state: PicState }) {
  const result = arg(p, 0, 'result', '');
  const drain = useGo(state, 2000, 100, Easing.in(Easing.quad));
  const shimmer = useLoop(state === 'idle', 800, { alternate: true, rest: 1 });
  return (
    <Frame state={state} height={88} label={arg(p, 1, 'label', 'A battery')}>
      <View style={{ position: 'absolute', left: 30, top: 12, width: 220, height: 46, borderWidth: 3, borderColor: NAVY, borderRadius: 9, backgroundColor: C.card, overflow: 'hidden', padding: 3 }}>
        <Animated.View style={{ flex: 1, borderRadius: 5, backgroundColor: C.lime, opacity: shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] }),
          transform: [{ translateX: drain.interpolate({ inputRange: [0, 1], outputRange: [0, -98] }) }, { scaleX: drain.interpolate({ inputRange: [0, 1], outputRange: [1, 0.06] }) }] }} />
      </View>
      <View style={{ position: 'absolute', left: 250, top: 24, width: 10, height: 22, backgroundColor: NAVY, borderTopRightRadius: 4, borderBottomRightRadius: 4 }} />
      <Tag text={result} state={state} delay={2.1} x={104} y={64} />
    </Frame>
  );
}

function Drip({ p, state }: { p: Args; state: PicState }) {
  const fall = useLoop(true, state === 'go' ? 500 : 1400);
  return (
    <Frame state={state} height={120} label={arg(p, 1, 'label', 'A drip')}>
      <View style={{ position: 'absolute', left: 40, top: 4, width: 56, height: 54, borderWidth: 2.5, borderColor: NAVY, borderRadius: 10, borderBottomLeftRadius: 18, borderBottomRightRadius: 18, backgroundColor: C.card, overflow: 'hidden' }}>
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '62%', backgroundColor: C.sky, opacity: 0.55 }} />
      </View>
      <View style={{ position: 'absolute', left: 62, top: 58, width: 12, height: 8, backgroundColor: NAVY }} />
      <View style={{ position: 'absolute', left: 56, top: 66, width: 24, height: 42, borderWidth: 2, borderColor: NAVY, borderRadius: 6, backgroundColor: C.card }} />
      <Animated.View style={{ position: 'absolute', left: 64, top: 68, width: 8, height: 10, borderRadius: 5, backgroundColor: C.sky,
        opacity: fall.interpolate({ inputRange: [0, 0.8, 1], outputRange: [1, 1, 0] }), transform: [{ translateY: fall.interpolate({ inputRange: [0, 1], outputRange: [0, 34] }) }] }} />
      <View style={{ position: 'absolute', left: 67, top: 108, width: 2, height: 10, backgroundColor: NAVY }} />
      <Tag text={arg(p, 0, 'result', '')} state={state} delay={0.4} x={130} y={44} />
    </Frame>
  );
}

function Gauge({ p, state }: { p: Args; state: PicState }) {
  const bands = arg<[number, number, string, string][]>(p, 0, 'bands', []);
  const vmin = arg(p, 1, 'vmin', 0), vmax = arg(p, 2, 'vmax', 1), value = arg(p, 3, 'value', 0);
  const W = 280, x = (v: number) => 20 + ((v - vmin) / (vmax - vmin)) * W;
  const slide = useGo(state, 1200, 100);
  const wob = useLoop(state === 'idle', 800, { alternate: true });
  const tx = state === 'go' ? slide.interpolate({ inputRange: [0, 1], outputRange: [0, x(value) - x(vmin)] }) : wob.interpolate({ inputRange: [0, 1], outputRange: [0, 8] });
  return (
    <Frame state={state} height={90} label={arg(p, 5, 'label', 'A gauge')}>
      {bands.map(([lo, hi, col, lab], i) => (
        <React.Fragment key={i}>
          <View style={{ position: 'absolute', left: x(lo), top: 26, width: x(hi) - x(lo), height: 18, backgroundColor: col, borderTopWidth: 2, borderBottomWidth: 2, borderColor: NAVY }} />
          <Text style={[body(10.5, true), { position: 'absolute', left: x(lo), top: 48, width: x(hi) - x(lo), textAlign: 'center', color: C.muted }]}>{lab}</Text>
        </React.Fragment>
      ))}
      <View style={{ position: 'absolute', left: 20, top: 26, width: W, height: 18, borderWidth: 2, borderColor: NAVY, borderRadius: 4 }} />
      <Animated.View style={{ position: 'absolute', left: x(vmin) - 7, top: 8, width: 0, height: 0, borderLeftWidth: 7, borderRightWidth: 7, borderTopWidth: 14, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: NAVY, transform: [{ translateX: tx }] }} />
      <Tag text={arg(p, 4, 'result', '')} state={state} delay={1.3} x={120} y={66} />
    </Frame>
  );
}

function Clock24({ p, state }: { p: Args; state: PicState }) {
  const start = arg(p, 0, 'start_h', 0), end = arg(p, 1, 'end_h', 0);
  const a0 = (start / 24) * 360, a1 = a0 + ((((end - start) % 24) + 24) % 24) / 24 * 360;
  const turn = useGo(state, 1400, 100);
  return (
    <Frame state={state} height={104} label={arg(p, 3, 'label', 'A 24-hour dial')}>
      <Svg width={100} height={100} viewBox="0 0 100 100" style={{ position: 'absolute', left: 20, top: 0 }}>
        <Circle cx={50} cy={50} r={46} fill={C.card} stroke={NAVY} strokeWidth={2.5} />
        {Array.from({ length: 24 }, (_, h) => {
          const a = (h * 15 * Math.PI) / 180;
          return <Line key={h} x1={50 + 38 * Math.sin(a)} y1={50 - 38 * Math.cos(a)} x2={50 + 44 * Math.sin(a)} y2={50 - 44 * Math.cos(a)} stroke={NAVY} strokeWidth={h % 6 === 0 ? 2.5 : 1.2} />;
        })}
        {[0, 6, 12, 18].map((h) => {
          const a = (h * 15 * Math.PI) / 180;
          return <SvgText key={h} x={50 + 30 * Math.sin(a)} y={54 - 30 * Math.cos(a)} fontSize={10} fontWeight="700" fill={NAVY} textAnchor="middle">{String(h).padStart(2, '0')}</SvgText>;
        })}
      </Svg>
      <Animated.View style={{ position: 'absolute', left: 68, top: 12, width: 4, height: 38, borderRadius: 2, backgroundColor: C.orange, transformOrigin: '50% 100%',
        transform: [{ rotate: turn.interpolate({ inputRange: [0, 1], outputRange: [`${a0}deg`, `${a1}deg`] }) }] }} />
      <View style={{ position: 'absolute', left: 65, top: 45, width: 10, height: 10, borderRadius: 5, backgroundColor: NAVY }} />
      <Tag text={arg(p, 2, 'result', '')} state={state} delay={1.5} x={150} y={40} />
    </Frame>
  );
}

function Wristband({ p, state }: { p: Args; state: PicState }) {
  const text = arg(p, 0, 'text', '');
  const reduce = useReduceMotion();
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (state !== 'go') {
      setShown(0);
      return;
    }
    if (reduce) {
      setShown(text.length);
      return;
    }
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setShown(i);
      if (i >= text.length) clearInterval(id);
    }, Math.max(40, 1200 / Math.max(1, text.length)));
    return () => clearInterval(id);
  }, [state, reduce]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Frame state={state} height={88} label={arg(p, 2, 'label', 'A patient wristband')}>
      <View style={{ position: 'absolute', left: 10, top: 18, width: 300, height: 40, borderWidth: 2.5, borderColor: NAVY, borderRadius: 20, backgroundColor: C.hintBlue }} />
      <View style={{ position: 'absolute', left: 24, top: 26, width: 16, height: 24, borderRadius: 4, borderWidth: 2, borderColor: NAVY, backgroundColor: C.card }} />
      <Text style={[monoBold(16), { position: 'absolute', left: 52, top: 28 }]}>{text.slice(0, shown)}</Text>
      <Tag text={arg(p, 1, 'result', '')} state={state} delay={1.4} x={120} y={64} />
    </Frame>
  );
}

// ---------------------------------------------------------------- syringe and monitor
function Syringe({ p, state }: { p: Args; state: PicState }) {
  const goTo = arg(p, 0, 'go_to', 0), maxVal = arg(p, 1, 'max_val', 1);
  const ticks = arg<[number, string][]>(p, 3, 'ticks', []);
  const cap = arg<number | null>(p, 4, 'cap', null);
  const idleTo = arg<number | null>(p, 5, 'idle_to', null);
  const W = 230, f = (v: number) => Math.max(0, Math.min(1, v / maxVal));
  const fill = useGo(state, 1300, 100);
  const idle = useLoop(state === 'idle' && idleTo !== null, 2600);
  const level = state === 'go' ? fill.interpolate({ inputRange: [0, 1], outputRange: [0, f(goTo)] })
    : idleTo !== null ? idle.interpolate({ inputRange: [0, 0.15, 0.6, 0.85, 1], outputRange: [0, 0, f(idleTo), f(idleTo), 0] }) : new Animated.Value(0);
  return (
    <Frame state={state} height={86} label={arg(p, 6, 'label', 'A syringe')}>
      <View style={{ position: 'absolute', left: 24, top: 14, width: W, height: 28, borderWidth: 2.5, borderColor: NAVY, borderRadius: 6, backgroundColor: C.card, overflow: 'hidden' }}>
        <Animated.View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: W, backgroundColor: C.sky, opacity: 0.75,
          transform: [{ translateX: Animated.multiply(Animated.add(level, -1), W / 2) }, { scaleX: level }] }} />
      </View>
      <Animated.View style={{ position: 'absolute', left: 14, top: 10, width: 12, height: 36, borderRadius: 3, backgroundColor: C.screen, transform: [{ translateX: Animated.multiply(level, W) }] }} />
      <View style={{ position: 'absolute', left: 0, top: 24, width: 14, height: 8, backgroundColor: C.screen, borderRadius: 2 }} />
      <View style={{ position: 'absolute', left: 24 + W, top: 23, width: 30, height: 10, backgroundColor: C.lockedEdge, borderWidth: 2, borderColor: NAVY, borderTopRightRadius: 4, borderBottomRightRadius: 4 }} />
      <View style={{ position: 'absolute', left: 24 + W + 32, top: 27, width: 22, height: 2, backgroundColor: NAVY }} />
      {ticks.map(([v, t], i) => (
        <React.Fragment key={i}>
          <View style={{ position: 'absolute', left: 24 + f(v) * W - 1, top: 16, width: 2, height: 10, backgroundColor: NAVY }} />
          <Text style={[body(10.5, true), { position: 'absolute', left: 24 + f(v) * W - 18, top: 48, width: 36, textAlign: 'center', color: C.muted }]}>{t}</Text>
        </React.Fragment>
      ))}
      {cap !== null && (
        <>
          <View style={{ position: 'absolute', left: 24 + f(cap) * W - 1, top: 2, width: 3, height: 40, backgroundColor: C.deepOrange }} />
          <Text style={[body(10, true), { position: 'absolute', left: 24 + f(cap) * W + 4, top: 0, color: '#9A3F0A' }]}>max</Text>
        </>
      )}
      <Tag text={arg(p, 7, 'result', '')} state={state} delay={1.3} x={24 + f(goTo) * W - 20} y={64} />
    </Frame>
  );
}

const ECG = 'M0 30 h18 l4 -4 l4 4 h6 l3 8 l5 -30 l5 30 l3 -8 h8 l6 -6 l6 6 h20';
function Monitor({ p, state }: { p: Args; state: PicState }) {
  const pulse = arg(p, 0, 'pulse', 0), alert = arg(p, 1, 'alert', false), score = arg<string | null>(p, 3, 'score', null), idleAlert = arg(p, 4, 'idle_alert', false);
  const reduce = useReduceMotion();
  const scroll = useLoop(true, 1600);
  const beat = useLoop(true, 400, { alternate: true });
  const lamp = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    lamp.stopAnimation();
    lamp.setValue(0);
    if (reduce) {
      if (state === 'go') lamp.setValue(1);
      return;
    }
    const flash = (n: number) => Animated.loop(Animated.sequence([Animated.timing(lamp, { toValue: 1, duration: 300, useNativeDriver: false }), Animated.timing(lamp, { toValue: 0, duration: 300, useNativeDriver: false })]), { iterations: n });
    if (state === 'go' && alert) {
      const a = flash(3);
      a.start(() => lamp.setValue(1));
      return () => a.stop();
    }
    if (state === 'go') {
      Animated.timing(lamp, { toValue: 1, duration: 300, useNativeDriver: false }).start();
      return;
    }
    if (state === 'idle' && idleAlert) {
      const a = flash(-1);
      a.start();
      return () => a.stop();
    }
  }, [state, reduce]); // eslint-disable-line react-hooks/exhaustive-deps
  const lampColor = lamp.interpolate({ inputRange: [0, 1], outputRange: [C.locked, state === 'go' && !alert ? C.lime : '#FF4D4D'] });
  return (
    <Frame state={state} height={102} label={arg(p, 2, 'label', 'A bedside monitor')}>
      <View style={{ position: 'absolute', left: 0, top: 0, width: 250, height: 72, borderRadius: 12, backgroundColor: C.editor, borderWidth: BORDER, borderColor: NAVY, overflow: 'hidden' }}>
        <Animated.View style={{ position: 'absolute', left: 0, top: 6, transform: [{ translateX: scroll.interpolate({ inputRange: [0, 1], outputRange: [0, -88] }) }] }}>
          <Svg width={352} height={60} viewBox="0 0 352 60">
            {[0, 1, 2, 3].map((k) => (
              <Path key={k} d={ECG} transform={`translate(${k * 88} 0)`} fill="none" stroke={C.lime} strokeWidth={2.2} strokeLinejoin="round" />
            ))}
          </Svg>
        </Animated.View>
      </View>
      <View style={{ position: 'absolute', left: 258, top: 0, width: 68, height: 72, borderRadius: 12, backgroundColor: C.screen, borderWidth: BORDER, borderColor: NAVY, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={[body(10, true), { color: C.lavender }]}>pulse</Text>
        <Animated.Text style={[monoBold(22), { color: C.cream, transform: [{ scale: beat.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] }) }] }]}>{pulse}</Animated.Text>
      </View>
      <Animated.View style={{ position: 'absolute', left: 8, top: 80, width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: NAVY, backgroundColor: lampColor }} />
      <Text style={[body(12, true), { position: 'absolute', left: 32, top: 81, color: C.muted }]}>alert lamp</Text>
      {score ? <Tag text={score} state={state} delay={0.4} x={110} y={80} bad={alert} /> : null}
    </Frame>
  );
}

// ---------------------------------------------------------------- bars and curve
function Bar({ x, top, h, i, hidden, flagged, state }: { x: number; top: number; h: number; i: number; hidden: boolean; flagged: boolean; state: PicState }) {
  const reduce = useReduceMotion();
  const grow = useGo(state, 500, i * 120);
  const flash = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    flash.stopAnimation();
    flash.setValue(0);
    if (state !== 'go' || !flagged) return;
    if (reduce) {
      flash.setValue(1);
      return;
    }
    const a = Animated.sequence([Animated.delay(600 + i * 120), Animated.loop(Animated.sequence([Animated.timing(flash, { toValue: 1, duration: 350, useNativeDriver: false }), Animated.timing(flash, { toValue: 0.5, duration: 350, useNativeDriver: false })]), { iterations: 3 })]);
    a.start(() => flash.setValue(1));
    return () => a.stop();
  }, [state, reduce]); // eslint-disable-line react-hooks/exhaustive-deps
  const scale = state === 'go' ? grow : new Animated.Value(1);
  return (
    <Animated.View style={{ position: 'absolute', left: x, top, width: 40, height: h, transform: [{ translateY: scale.interpolate({ inputRange: [0, 1], outputRange: [h / 2, 0] }) }, { scaleY: scale }] }}>
      <Animated.View style={{ flex: 1, borderWidth: 2, borderColor: NAVY, borderStyle: hidden ? 'dashed' : 'solid', borderTopLeftRadius: 5, borderTopRightRadius: 5,
        backgroundColor: hidden ? C.card : flagged ? flash.interpolate({ inputRange: [0, 0.5, 1], outputRange: [C.sky, C.sun, C.orange] }) : C.sky }} />
    </Animated.View>
  );
}

function BpBars({ p, state }: { p: Args; state: PicState }) {
  const vals = arg<number[]>(p, 0, 'vals', []);
  const cutoff = arg(p, 1, 'cutoff', 0);
  const hide = arg<number[]>(p, 2, 'hide', []);
  const flag = arg(p, 4, 'flag', true);
  const h = arg(p, 6, 'h', 70);
  const mx = Math.max(...vals) * 1.08;
  const cy = h + 4 - (cutoff / mx) * h;
  return (
    <Frame state={state} height={h + 50} label={arg(p, 3, 'label', 'Bar chart')}>
      {vals.map((v, i) => {
        const x = 30 + i * 62, bh = (v / mx) * h;
        return (
          <React.Fragment key={i}>
            <Bar x={x} top={h + 4 - bh} h={bh} i={i} hidden={hide.includes(i)} flagged={flag && v >= cutoff} state={state} />
            <Text style={[monoBold(12), { position: 'absolute', left: x, top: h + 10, width: 40, textAlign: 'center' }]}>{hide.includes(i) ? '?' : v}</Text>
          </React.Fragment>
        );
      })}
      {cy > 0 && cy < h + 4 && (
        <>
          <View style={{ position: 'absolute', left: 20, top: cy, width: 262, borderTopWidth: 2.5, borderStyle: 'dashed', borderColor: C.deepOrange }} />
          <Text style={[body(11, true), { position: 'absolute', left: 284, top: cy - 8, color: '#9A3F0A' }]}>{cutoff}</Text>
        </>
      )}
      <View style={{ position: 'absolute', left: 20, top: h + 4, width: 262, borderTopWidth: 2, borderColor: NAVY }} />
      <Tag text={arg(p, 5, 'result', '')} state={state} delay={0.8} x={120} y={h + 28} />
    </Frame>
  );
}

function Dot({ x, y, i, last, state }: { x: number; y: number; i: number; last: boolean; state: PicState }) {
  const pop = useGo(state, 300, i * 150);
  const pulse = useLoop(last && state === 'idle', 600, { alternate: true });
  const s = state === 'go' ? pop : last ? pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.6] }) : new Animated.Value(1);
  return <Animated.View style={{ position: 'absolute', left: x - 5, top: y - 5, width: 10, height: 10, borderRadius: 5, backgroundColor: C.orange, borderWidth: 1.5, borderColor: NAVY, transform: [{ scale: s }] }} />;
}

function Curve({ p, state }: { p: Args; state: PicState }) {
  const vals = arg<number[]>(p, 0, 'vals', []);
  const extra = arg<number[] | null>(p, 2, 'extra', null);
  const h = arg(p, 5, 'h', 80);
  const ymax = arg<number | null>(p, 4, 'ymax', null) ?? Math.max(...vals, ...(extra ?? [])) * 1.1;
  const W = 270;
  const pt = (i: number, v: number, n: number): [number, number] => [30 + (i * W) / (n - 1), h - (v / ymax) * (h - 8) + 4];
  const path = (vs: number[]) => 'M' + vs.map((v, i) => pt(i, v, vs.length).map((n) => n.toFixed(0)).join(' ')).join(' L');
  const draw = useGo(state, 1400, 0, Easing.out(Easing.quad));
  return (
    <Frame state={state} height={h + 30} label={arg(p, 1, 'label', 'A curve')}>
      <Svg width={326} height={h + 26} viewBox={`0 0 326 ${h + 26}`}>
        <Line x1={22} y1={h + 4} x2={310} y2={h + 4} stroke={NAVY} strokeWidth={2} />
        <Path d={path(vals)} fill="none" stroke={C.deepOrange} strokeWidth={3} strokeLinejoin="round" />
        {extra && <AnimatedPath d={path(extra)} fill="none" stroke={C.sky} strokeWidth={3} strokeDasharray="600" strokeDashoffset={draw.interpolate({ inputRange: [0, 1], outputRange: [600, 0] })} />}
        {vals.map((_, i) => (
          <SvgText key={i} x={pt(i, 0, vals.length)[0]} y={h + 20} fontSize={11} fontWeight="700" fill={NAVY} textAnchor="middle">{`day ${i + 1}`}</SvgText>
        ))}
      </Svg>
      {vals.map((v, i) => {
        const [x, y] = pt(i, v, vals.length);
        return <Dot key={i} x={x} y={y} i={i} last={i === vals.length - 1} state={state} />;
      })}
      <Tag text={arg(p, 3, 'result', '')} state={state} delay={1.2} x={120} y={0} />
    </Frame>
  );
}

/** Draws one of the new picture types from its description; returns null for types the lesson kit draws itself. */
export function PictureV2({ p, state }: { p: { type: string } & Partial<Args>; state: PicState }) {
  const a: Args = { args: p.args ?? [], kw: p.kw ?? {} };
  switch (p.type) {
    case 'belt': return <Belt p={a} state={state} />;
    case 'circuit': return <Circuit p={a} state={state} />;
    case 'battery': return <Battery p={a} state={state} />;
    case 'drip': return <Drip p={a} state={state} />;
    case 'gauge': return <Gauge p={a} state={state} />;
    case 'clock24': return <Clock24 p={a} state={state} />;
    case 'wristband': return <Wristband p={a} state={state} />;
    case 'syringe': return <Syringe p={a} state={state} />;
    case 'monitor': return <Monitor p={a} state={state} />;
    case 'bpbars': return <BpBars p={a} state={state} />;
    case 'curve': return <Curve p={a} state={state} />;
    default: return null;
  }
}
