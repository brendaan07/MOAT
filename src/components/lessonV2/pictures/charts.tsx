// The two data charts used by healthcare lessons: blood-pressure style bars with a cut-off, and a day-by-day curve.
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import Svg, { Line, Path, Text as SvgText } from 'react-native-svg';
import { C, body, monoBold } from '../../../utils/theme';
import { useReduceMotion } from '../../../hooks/useReduceMotion';
import { Args, Frame, NAVY, PicState, Tag, arg, useGo, useLoop } from './motion';

const AnimatedPath = Animated.createAnimatedComponent(Path);

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

/** Bars that grow in one by one, with a dashed cut-off line; bars over it flash. */
export function BpBars({ p, state }: { p: Args; state: PicState }) {
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

/** A line over several days; when the answer is right a second line is drawn in. */
export function Curve({ p, state }: { p: Args; state: PicState }) {
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
