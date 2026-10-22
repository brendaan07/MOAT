// Engineering pictures: a circuit with current flowing, a draining battery and a banded gauge.
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useReduceMotion } from '../../../hooks/useReduceMotion';
import { C, body, monoBold } from '../../../utils/theme';
import type { BatteryPicture, CircuitPicture, GaugePicture } from '../../../content/types';
import { BAD, LIT, PictureState, Result, resolve, useIdle, usePlay } from './motion';

/* ------------------------------------------------------------------ Engineering: circuit, battery, gauge */
/** A battery and its resistors in a loop. State: [current in A, text]; current flows round the wire, faster for more amps. */
export function Circuit({ spec, state, pick }: { spec: CircuitPicture; state: PictureState; pick: string | null }) {
  const volts: number = spec.args[0];
  const res: number[] = spec.args[1] ?? [];
  const s = resolve(spec, state, pick);
  const amps: number = s ? s[0] : 0;
  const k = `${state}-${pick}`;
  const reduce = useReduceMotion();
  const flow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    flow.stopAnimation();
    flow.setValue(0);
    if (!s || amps <= 0 || reduce) return;
    const loop = Animated.loop(Animated.timing(flow, { toValue: 1, duration: Math.max(500, Math.min(2400, 2400 / amps)), easing: Easing.linear, useNativeDriver: true }));
    loop.start();
    return () => loop.stop();
  }, [k, amps, reduce]); // eslint-disable-line react-hooks/exhaustive-deps
  const colour = state === 'nope' ? BAD : LIT;
  return (
    <View>
      <View style={{ width: 300, height: 92, alignSelf: 'center' }}>
        <Svg width={300} height={92} viewBox="0 0 300 92">
          <Path d="M20 14 H280 V78 H20 Z" fill="none" stroke={C.navy} strokeWidth={2.6} strokeLinejoin="round" />
          <Path d="M8 32 h24 M14 40 h12 M8 48 h24 M14 56 h12" stroke={C.navy} strokeWidth={3} />
          {res.map((_, i) => {
            const x = 96 + i * 76;
            return <Path key={i} d={`M${x} 14 l6 -6 l8 12 l8 -12 l8 12 l8 -12 l8 12 l6 -6`} fill={C.card} stroke={C.navy} strokeWidth={2.4} strokeLinejoin="round" />;
          })}
        </Svg>
        <Text style={[monoBold(12), { position: 'absolute', left: 38, top: 38 }]}>{`${volts} V`}</Text>
        {res.map((r, i) => <Text key={i} style={[monoBold(12), { position: 'absolute', left: 96 + i * 76, top: 24, width: 52, textAlign: 'center' }]}>{`${r} Ω`}</Text>)}
        <View style={{ position: 'absolute', left: 137, top: 65, width: 26, height: 26, borderRadius: 13, borderWidth: 2.4, borderColor: C.navy, backgroundColor: C.hintBlue, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={monoBold(12)}>A</Text>
        </View>
        {s && amps > 0 ? [0, 1, 2, 3].map((i) => (
          <Animated.View key={i} style={{ position: 'absolute', left: 16, top: 72, width: 9, height: 9, borderRadius: 5, backgroundColor: colour, borderWidth: 1.5, borderColor: C.navy,
            transform: [{ translateX: flow.interpolate({ inputRange: [0, 1], outputRange: [i * 65, i * 65 + 65] }) }] }} />
        )) : null}
      </View>
      <Result text={s ? s[1] : ''} state={state} k={k} />
    </View>
  );
}

/** A battery that drains on Check. State: [charge left at the end, 0 to 1, text]. */
export function Battery({ spec, state, pick }: { spec: BatteryPicture; state: PictureState; pick: string | null }) {
  const s = resolve(spec, state, pick);
  const left: number = s ? Math.max(0.04, Math.min(1, s[0])) : 1;
  const k = `${state}-${pick}`;
  const drain = usePlay(k, !!s, 1800, 100, Easing.in(Easing.quad));
  const idle = useIdle(!s, 800);
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'center', paddingTop: 6 }}>
        <View style={{ width: 220, height: 46, borderWidth: 3, borderColor: C.navy, borderRadius: 9, backgroundColor: C.card, overflow: 'hidden', padding: 3 }}>
          <Animated.View style={{ flex: 1, borderRadius: 5, backgroundColor: state === 'nope' ? BAD : LIT,
            opacity: idle.interpolate({ inputRange: [0, 1], outputRange: [1, 0.75] }),
            transform: [{ translateX: drain.interpolate({ inputRange: [0, 1], outputRange: [0, -107 * (1 - left)] }) },
                        { scaleX: drain.interpolate({ inputRange: [0, 1], outputRange: [1, left] }) }] }} />
        </View>
        <View style={{ width: 10, height: 22, backgroundColor: C.navy, borderTopRightRadius: 4, borderBottomRightRadius: 4 }} />
      </View>
      <Result text={s ? s[1] : ''} state={state} k={k} delay={1900} />
    </View>
  );
}

/** A scale with coloured bands and a pointer that slides to the value. Options: bands [[lo, hi, colour, label]], vmin, vmax. State: [value, text]. */
export function Gauge({ spec, state, pick }: { spec: GaugePicture; state: PictureState; pick: string | null }) {
  const o = spec.options ?? {};
  const bands: [number, number, string, string][] = o.bands ?? [];
  const vmin: number = o.vmin ?? 0, vmax: number = o.vmax ?? 1;
  const W = 280;
  const x = (v: number) => (Math.max(vmin, Math.min(vmax, v)) - vmin) / (vmax - vmin) * W;
  const s = resolve(spec, state, pick);
  const k = `${state}-${pick}`;
  const slide = usePlay(k, !!s, 1200, 100);
  const idle = useIdle(!s, 800);
  const tx = s ? slide.interpolate({ inputRange: [0, 1], outputRange: [0, x(s[0])] }) : idle.interpolate({ inputRange: [0, 1], outputRange: [0, 8] });
  return (
    <View>
      <View style={{ width: W, height: 62, alignSelf: 'center' }}>
        {bands.map(([lo, hi, colour, label], i) => (
          <React.Fragment key={i}>
            <View style={{ position: 'absolute', left: x(lo), top: 18, width: x(hi) - x(lo), height: 18, backgroundColor: colour }} />
            <Text style={[body(10.5, true), { position: 'absolute', left: x(lo), top: 40, width: x(hi) - x(lo), textAlign: 'center', color: C.muted }]}>{label}</Text>
          </React.Fragment>
        ))}
        <View style={{ position: 'absolute', left: 0, top: 18, width: W, height: 18, borderWidth: 2, borderColor: C.navy, borderRadius: 4 }} />
        <Animated.View style={{ position: 'absolute', left: -7, top: 2, width: 0, height: 0, borderLeftWidth: 7, borderRightWidth: 7, borderTopWidth: 14,
          borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: state === 'nope' ? C.deepOrange : C.navy, transform: [{ translateX: tx }] }} />
      </View>
      <Result text={s ? s[1] : ''} state={state} k={k} delay={1300} />
    </View>
  );
}
