// Biology pictures that chart values: character tiles, bars against a line, a dot plot and a self-drawing curve.
import React, { useMemo } from 'react';
import { Animated, Easing, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { C, body, monoBold } from '../../../utils/theme';
import type { DotsPicture, RateBarsPicture, StepsPicture, TilesPicture } from '../../../content/types';
import { EASE_BOUNCE, EASE_PICTURE } from '../../../utils/motion';
import { BAD, LIT, PAL, PictureState, Result, resolve, useIdle, usePlay } from './motion';

/* ------------------------------------------------------------------ character tiles */
function Tile({ ch, i, n, lit, state, k, w, base, neg }: { ch: string; i: number; n: number; lit: boolean; state: PictureState; k: string; w: number; base: number; neg: boolean }) {
  const pop = usePlay(k, lit && state !== 'idle', 320, 60 * i, EASE_BOUNCE);
  const idle = useIdle(state === 'idle', 900, 90 * i);
  const dim = state !== 'idle' && !lit;
  return (
    <View style={{ alignItems: 'center' }}>
      <Animated.View style={{ width: w, height: 32, borderRadius: 7, borderWidth: 2, borderColor: C.navy, alignItems: 'center', justifyContent: 'center',
        backgroundColor: lit && state !== 'idle' ? (state === 'nope' ? BAD : LIT) : C.card, opacity: dim ? 0.5 : 1,
        transform: [{ translateY: Animated.add(pop.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }), idle.interpolate({ inputRange: [0, 1], outputRange: [0, -1.5] })) },
                    { scale: pop.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1, 1.15, 1] }) }] }}>
        <Text style={monoBold(w >= 22 ? 16 : 13)}>{ch === ' ' ? '·' : ch}</Text>
      </Animated.View>
      <Text style={[monoBold(10), { color: C.muted, marginTop: 2 }]}>{i + base}</Text>
      {neg ? <Text style={[monoBold(9.5), { color: C.brownText }]}>{i - n}</Text> : null}
    </View>
  );
}
/** A sequence as numbered tiles; on Check the answer's tiles light up. */
export function Tiles({ spec, state, pick }: { spec: TilesPicture; state: PictureState; pick: string | null }) {
  const text: string = spec.args[0];
  const base: number = spec.options?.base ?? 0;
  const s = resolve(spec, state, pick);
  const lit: number[] = s ? s[0] : [];
  const k = `${state}-${pick}`;
  const w = Math.max(16, Math.min(28, Math.floor(300 / text.length) - 3));
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 3, paddingTop: 4 }}>
        {text.split('').map((ch, i) => <Tile key={i} ch={ch} i={i} n={text.length} lit={lit.includes(i)} state={state} k={k} w={w} base={base} neg={!!spec.options?.neg} />)}
      </View>
      <Result text={s ? s[1] : ''} state={state} k={k} />
    </View>
  );
}

/* ------------------------------------------------------------------ bars against a line */
function Bar({ h, colour, i, k, active, label, name }: { h: number; colour: string; i: number; k: string; active: boolean; label: string; name: string }) {
  const grow = usePlay(k, active, 650, 140 * i, EASE_PICTURE, false);
  return (
    <View style={{ alignItems: 'center', width: 56 }}>
      <View style={{ height: 76, justifyContent: 'flex-end' }}>
        <Animated.View style={{ width: 40, height: grow.interpolate({ inputRange: [0, 1], outputRange: [2, Math.max(2, h)] }), backgroundColor: colour,
          borderWidth: 2, borderColor: C.navy, borderTopLeftRadius: 6, borderTopRightRadius: 6 }} />
      </View>
      <Animated.Text style={[monoBold(12), { opacity: grow, marginTop: 2 }]}>{label}</Animated.Text>
      <Text style={[body(11, true), { color: C.muted }]}>{name}</Text>
    </View>
  );
}
/** Bars that grow to their values on Check, against an optional dashed line. */
export function RateBars({ spec, state, pick }: { spec: RateBarsPicture; state: PictureState; pick: string | null }) {
  const names: string[] = spec.args[0];
  const o = spec.options ?? {};
  const vmax: number = o.vmax ?? 3;
  const line: number | undefined = o.line ?? undefined;
  const s = resolve(spec, state, pick);
  const vals: number[] = s ? s[0] : [];
  const k = `${state}-${pick}`;
  const H = 70;
  const h = (v: number) => Math.min(1.1, Math.max(0, v) / vmax) * H;
  const colour = (v: number, i: number) =>
    state === 'nope' ? BAD : o.good_high && line != null ? (v >= line ? C.green : C.deepOrange) : line != null && v > line ? C.red : PAL[i % 5];
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 8 }}>
        {line != null && (
          <View pointerEvents="none" style={{ position: 'absolute', left: 4, right: 4, top: 76 - (line / vmax) * H, borderTopWidth: 2.5, borderStyle: 'dashed', borderColor: C.deepOrange }}>
            <Text style={[body(10, true), { position: 'absolute', right: 0, top: -16, color: C.brownText }]}>{o.line_label}</Text>
          </View>
        )}
        {names.map((n, i) => (
          <Bar key={i} i={i} k={k} active={state !== 'idle' && i < vals.length} h={h(vals[i] ?? 0)} colour={colour(vals[i] ?? 0, i)} label={i < vals.length ? String(vals[i]) : ''} name={n} />
        ))}
      </View>
      <Result text={s ? s[1] : ''} state={state} k={k} delay={300 + 140 * names.length} />
    </View>
  );
}

/* ------------------------------------------------------------------ dot plot with mean and median */
function Marker({ x, colour, label, k, top }: { x: number | null; colour: string; label: string; k: string; top: number }) {
  const slide = usePlay(k, x != null, 700, 150);
  if (x == null) return null;
  return (
    <Animated.View style={{ position: 'absolute', top, left: 0, width: 3, height: 58 - top, backgroundColor: colour,
      transform: [{ translateX: slide.interpolate({ inputRange: [0, 1], outputRange: [0, x] }) }] }}>
      <Text style={[body(10, true), { position: 'absolute', left: 5, top: -3, width: 60, color: colour }]}>{label}</Text>
    </Animated.View>
  );
}
/** Values on a number line; on Check the picked dots light and the mean or median marker slides in. */
export function Dots({ spec, state, pick }: { spec: DotsPicture; state: PictureState; pick: string | null }) {
  const values: number[] = spec.args[0];
  const vmax: number = spec.args[1];
  const s = resolve(spec, state, pick) ?? {};
  const k = `${state}-${pick}`;
  const W = 280;
  const px = (v: number) => (Math.min(vmax, Math.max(0, v)) / vmax) * W;
  const lit: number[] = s.lit ?? [];
  return (
    <View>
      <View style={{ height: 84, width: W + 20, alignSelf: 'center' }}>
        <View style={{ position: 'absolute', left: 0, width: W, top: 58, height: 3, borderRadius: 2, backgroundColor: C.navy }} />
        {[0, vmax / 2, vmax].map((t, i) => <Text key={i} style={[monoBold(10), { position: 'absolute', top: 64, left: px(t) - 12, width: 24, textAlign: 'center', color: C.muted }]}>{String(t)}</Text>)}
        {values.map((v, i) => <Dot key={i} x={px(v)} y={40 - (i % 2) * 11} lit={lit.includes(i)} state={state} i={i} k={k} />)}
        <Marker key={`m${k}`} x={s.mean != null ? px(s.mean) : null} colour={C.sky} label="mean" k={k} top={12} />
        <Marker key={`d${k}`} x={s.median != null ? px(s.median) : null} colour="#2F8F4E" label="median" k={k} top={22} />
      </View>
      <Result text={s.text ?? ''} state={state} k={k} delay={700} />
    </View>
  );
}
function Dot({ x, y, lit, state, i, k }: { x: number; y: number; lit: boolean; state: PictureState; i: number; k: string }) {
  const pop = usePlay(k, lit && state !== 'idle', 300, 50 * i, EASE_BOUNCE);
  const idle = useIdle(state === 'idle', 1100, 120 * i);
  return (
    <Animated.View style={{ position: 'absolute', left: x - 8, top: y, width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: C.navy,
      backgroundColor: lit && state !== 'idle' ? (state === 'nope' ? BAD : LIT) : C.hintBlue,
      transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] }) }, { translateY: idle.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) }] }} />
  );
}

/* ------------------------------------------------------------------ a curve that draws itself */
/** react-native-svg's Path minus the `collapsable` prop Animated adds, which react-native-web would write to the DOM as an
 *  invalid attribute (a console error on every Check). */
const PlainPath = React.forwardRef<Path, React.ComponentProps<typeof Path> & { collapsable?: boolean }>(({ collapsable: _collapsable, ...props }, ref) => <Path ref={ref} {...props} />);
const APath = Animated.createAnimatedComponent(PlainPath);
/** A stepped curve that draws itself on Check. */
export function Steps({ spec, state, pick }: { spec: StepsPicture; state: PictureState; pick: string | null }) {
  const ymin: number = spec.options?.ymin ?? 0;
  const s = resolve(spec, state, pick);
  const vals: number[] = s ? s[0] : [];
  const k = `${state}-${pick}`;
  const draw = usePlay(k, vals.length > 0, 1600, 0, Easing.out(Easing.cubic), false);
  const X0 = 34, Y0 = 8, W = 270, H = 74;
  const d = useMemo(() => {
    let p = `M${X0} ${Y0}`;
    let x = X0;
    const step = W / Math.max(1, vals.length);
    for (const v of vals) {
      const c = Math.max(ymin - 0.3 * (1 - ymin), Math.min(1 + 0.3 * (1 - ymin), v));
      p += ` H${(x + step / 2).toFixed(1)} V${(Y0 + (1 - (c - ymin) / (1 - ymin)) * H).toFixed(1)}`;
      x += step;
    }
    return p + ` H${X0 + W}`;
  }, [k]); // eslint-disable-line react-hooks/exhaustive-deps
  const over = vals.some((v) => v > 1);
  return (
    <View>
      <View style={{ alignSelf: 'center' }}>
        <Svg width={320} height={100}>
          <Path d={`M${X0} ${Y0}V${Y0 + H}H${X0 + W}`} stroke={C.navy} strokeWidth={2} fill="none" />
          {vals.length > 0 && (
            <APath d={d} stroke={state === 'nope' ? (over ? C.red : C.orange) : C.green} strokeWidth={3.5} fill="none" strokeLinejoin="round"
              strokeDasharray="700" strokeDashoffset={draw.interpolate({ inputRange: [0, 1], outputRange: [700, 0] })} />
          )}
        </Svg>
        <Text style={[monoBold(10), { position: 'absolute', left: 6, top: 2, color: C.muted }]}>1.0</Text>
        <Text style={[monoBold(10), { position: 'absolute', left: 10, top: Y0 + H - 6, color: C.muted }]}>{String(ymin)}</Text>
      </View>
      <Result text={s ? s[1] : ''} state={state} k={k} delay={1300} />
    </View>
  );
}
