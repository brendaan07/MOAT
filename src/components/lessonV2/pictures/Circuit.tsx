// The circuit picture for the engineering lessons: a battery and resistors in a loop, with current flowing when the answer is right.
import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Circle, G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { C } from '../../../utils/theme';
import { useReduceMotion } from '../../../hooks/useReduceMotion';
import { Args, Frame, NAVY, PicState, arg } from './motion';

const AnimatedRect = Animated.createAnimatedComponent(Rect);

/** `p` holds volts, the resistors in ohms and whether to show an ammeter. */
export function Circuit({ p, state }: { p: Args; state: PicState }) {
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
