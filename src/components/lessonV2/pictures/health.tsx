// The healthcare pictures: battery, drip, gauge, 24-hour dial, wristband, syringe and bedside monitor.
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Text as SvgText } from 'react-native-svg';
import { BORDER, C, body, monoBold } from '../../../utils/theme';
import { useReduceMotion } from '../../../hooks/useReduceMotion';
import { Args, Frame, NAVY, PicState, Tag, arg, useGo, useLoop } from './motion';

/** A battery that drains. */
export function Battery({ p, state }: { p: Args; state: PicState }) {
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

/** An IV drip; the drops fall faster when the answer is right. */
export function Drip({ p, state }: { p: Args; state: PicState }) {
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

/** A coloured scale with a marker that slides to the value. */
export function Gauge({ p, state }: { p: Args; state: PicState }) {
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

/** A 24-hour dial whose hand sweeps from the start hour to the end hour. */
export function Clock24({ p, state }: { p: Args; state: PicState }) {
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

/** A patient wristband that types out its text. */
export function Wristband({ p, state }: { p: Args; state: PicState }) {
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
export function Syringe({ p, state }: { p: Args; state: PicState }) {
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
/** A bedside monitor: scrolling heartbeat, pulse number and an alert lamp. */
export function Monitor({ p, state }: { p: Args; state: PicState }) {
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
