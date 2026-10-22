// Biology pictures of things: paired DNA strands and a thermometer.
import React from 'react';
import { Animated, Text, View } from 'react-native';
import { C, body, monoBold } from '../../../utils/theme';
import type { StrandsPicture, ThermoPicture } from '../../../content/types';
import { BAD, BOUNCE, EASE, LIT, PictureState, Result, resolve, useIdle, usePlay } from './motion';

/* ------------------------------------------------------------------ paired DNA strands */
const PAIR: Record<string, string> = { A: 'T', T: 'A', G: 'C', C: 'G' };
const BASE: Record<string, string> = { A: LIT, T: BAD, G: C.sky, C: C.sun };
function Base({ top, bottom, i, state, k }: { top: string; bottom: string; i: number; state: PictureState; k: string }) {
  const drop = usePlay(k, !!bottom, 320, 80 * i, BOUNCE);
  const ok = bottom !== '' && PAIR[top] === bottom;
  return (
    <View style={{ alignItems: 'center' }}>
      <View style={{ width: 30, height: 28, borderRadius: 7, borderWidth: 2, borderColor: C.navy, backgroundColor: BASE[top] ?? C.card, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={monoBold(14)}>{top}</Text>
      </View>
      <Animated.View style={{ width: 5, height: 16, marginVertical: 3, borderRadius: 3, backgroundColor: bottom ? (ok ? '#2F8F4E' : '#E0762A') : C.lockedEdge,
        transform: [{ scaleY: bottom ? drop : 0.4 }] }} />
      <Animated.View style={{ width: 30, height: 28, borderRadius: 7, borderWidth: 2, borderColor: C.navy, backgroundColor: bottom ? BASE[bottom] ?? C.card : C.card,
        opacity: bottom ? drop : 0.35, transform: [{ translateY: drop.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }], alignItems: 'center', justifyContent: 'center' }}>
        <Text style={monoBold(14)}>{bottom}</Text>
      </Animated.View>
    </View>
  );
}
/** The template strand on top; on Check the paired strand drops in base by base. */
export function Strands({ spec, state, pick }: { spec: StrandsPicture; state: PictureState; pick: string | null }) {
  const top: string = spec.args[0];
  const s = resolve(spec, state, pick);
  const bottom: string = s ? s[0] : '';
  const k = `${state}-${pick}`;
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 5, paddingTop: 4 }}>
        {top.split('').map((ch, i) => <Base key={i} top={ch} bottom={bottom[i] ?? ''} i={i} state={state} k={k} />)}
      </View>
      <Result text={s ? s[1] : ''} state={state} k={k} delay={300 + 80 * top.length} />
    </View>
  );
}

/* ------------------------------------------------------------------ thermometer */
export function Thermo({ spec, state, pick }: { spec: ThermoPicture; state: PictureState; pick: string | null }) {
  const vmax: number = spec.options?.vmax ?? 60;
  const s = resolve(spec, state, pick);
  const k = `${state}-${pick}`;
  const H = 72;
  const level = s ? Math.max(4, Math.min(1.15, s[0] / vmax) * H) : 8;
  const rise = usePlay(k, !!s, 900, 0, EASE, false);
  const idle = useIdle(!s, 900);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 22, height: 104 }}>
      <View style={{ alignItems: 'center' }}>
        <View style={{ width: 18, height: H + 8, borderWidth: 2.5, borderColor: C.navy, borderTopLeftRadius: 9, borderTopRightRadius: 9, backgroundColor: C.card, justifyContent: 'flex-end', overflow: 'hidden' }}>
          <Animated.View style={{ height: s ? rise.interpolate({ inputRange: [0, 1], outputRange: [8, level] }) : 8, backgroundColor: state === 'nope' ? '#E0762A' : '#E5484D' }} />
        </View>
        <Animated.View style={{ width: 30, height: 30, marginTop: -4, borderRadius: 15, borderWidth: 2.5, borderColor: C.navy, backgroundColor: state === 'nope' ? '#E0762A' : '#E5484D',
          transform: [{ scale: idle.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) }] }} />
      </View>
      <View style={{ width: 140, height: 62, borderRadius: 14, borderWidth: 2.5, borderColor: C.navy, backgroundColor: C.editor, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={[body(11, true), { color: C.lavender }]}>melting temp</Text>
        <Text style={[monoBold(20), { color: state === 'nope' ? '#FFB4A2' : LIT }]}>{s ? s[1] : '--'}</Text>
      </View>
    </View>
  );
}
