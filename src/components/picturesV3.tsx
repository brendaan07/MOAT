/**
 * Moving pictures for Biology research R (canvas "MOAT Biology Research R") and Engineering Python (circuit, battery,
 * gauge and the fruit-sorting belt, ported from picturesV2), drawn from the picture specs in the V3 content files.
 * Each picture idles while the learner thinks, then acts out the result of the option picked: the right answer ('go') or that wrong option's own consequence ('nope', with a shake).
 * Reduce Motion holds everything still at its final state. Timings follow the canvas pages.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, Text, View } from 'react-native';
import { V3_IMAGES } from '../utils/imageMapV3';
import Svg, { Path } from 'react-native-svg';
import { C, body, monoBold } from '../utils/theme';
import { useReduceMotion } from '../hooks/useReduceMotion';

export type V3State = 'idle' | 'go' | 'nope';
// The JSON picture spec: { type, label, args, options, correct_state, states: { wrong_by_option } }
type Spec = { type: string; label: string; args: any[]; options: Record<string, any>; correct_state: any; states?: { wrong_by_option?: Record<string, any> } }; // eslint-disable-line @typescript-eslint/no-explicit-any
const EASE = Easing.bezier(0.3, 0.7, 0.3, 1);
const BOUNCE = Easing.bezier(0.3, 1.5, 0.5, 1);
const LIT = '#B5E04A';
const BAD = '#FFB37A';
const PAL = ['#59B4FF', '#FFC93C', '#FF8A3D', '#B5E04A', '#F48FB1'];

/** The state each option leads to: the right answer's, the picked wrong option's, or nothing yet. */
function resolve(spec: Spec, state: V3State, pick: string | null) {
  if (state === 'go') return spec.correct_state;
  if (state === 'nope') return (pick && spec.states?.wrong_by_option?.[pick]) ?? null;
  return null;
}

/** Runs 0 -> 1 each time the picture acts something out (go or nope); instant with Reduce Motion. */
function usePlay(key: string, active: boolean, duration: number, delay = 0, easing = EASE, native = true) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    v.stopAnimation();
    if (!active) { v.setValue(0); return; }
    if (reduce) { v.setValue(1); return; }
    v.setValue(0);
    const a = Animated.timing(v, { toValue: 1, duration, delay, easing, useNativeDriver: native });
    a.start();
    return () => a.stop();
  }, [key, active, reduce]); // eslint-disable-line react-hooks/exhaustive-deps
  return v;
}

/** A gentle repeating 0 -> 1 -> 0 while the learner thinks; still with Reduce Motion. */
function useIdle(on: boolean, duration: number, delay = 0) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!on || reduce) { v.stopAnimation(); v.setValue(0); return; }
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(v, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      Animated.timing(v, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
    ]));
    const t = setTimeout(() => loop.start(), delay);
    return () => { clearTimeout(t); loop.stop(); };
  }, [on, reduce]); // eslint-disable-line react-hooks/exhaustive-deps
  return v;
}

/** Shakes its contents once on a wrong answer. */
function Shake({ state, pick, children }: { state: V3State; pick: string | null; children: React.ReactNode }) {
  const reduce = useReduceMotion();
  const x = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (state !== 'nope' || reduce) return;
    x.setValue(0);
    Animated.sequence([-6, 6, -4, 4, 0].map((toValue) => Animated.timing(x, { toValue, duration: 90, useNativeDriver: true }))).start();
  }, [state, pick, reduce]); // eslint-disable-line react-hooks/exhaustive-deps
  return <Animated.View style={{ transform: [{ translateX: x }] }}>{children}</Animated.View>;
}

/** The dark result pill that pops in after the picture has acted out the answer. */
function Result({ text, state, k, delay = 450 }: { text: string; state: V3State; k: string; delay?: number }) {
  const v = usePlay(k, state !== 'idle' && !!text, 260, delay, BOUNCE);
  if (state === 'idle' || !text) return <View style={{ height: 30 }} />;
  return (
    <Animated.View style={{ alignSelf: 'center', marginTop: 8, opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }],
      flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, backgroundColor: C.editor }}>
      <Text style={[body(12, true), { color: C.lavender }]}>result</Text>
      <Text style={[monoBold(15), { color: state === 'nope' ? '#FFB4A2' : LIT }]}>{text}</Text>
    </Animated.View>
  );
}

/* ------------------------------------------------------------------ character tiles */
function Tile({ ch, i, n, lit, state, k, w, base, neg }: { ch: string; i: number; n: number; lit: boolean; state: V3State; k: string; w: number; base: number; neg: boolean }) {
  const pop = usePlay(k, lit && state !== 'idle', 320, 60 * i, BOUNCE);
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
      {neg ? <Text style={[monoBold(9.5), { color: '#9A3F0A' }]}>{i - n}</Text> : null}
    </View>
  );
}
function Tiles({ spec, state, pick }: { spec: Spec; state: V3State; pick: string | null }) {
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
  const grow = usePlay(k, active, 650, 140 * i, EASE, false);
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
function RateBars({ spec, state, pick }: { spec: Spec; state: V3State; pick: string | null }) {
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
    state === 'nope' ? BAD : o.good_high && line != null ? (v >= line ? '#2F8F4E' : '#E0762A') : line != null && v > line ? '#E5484D' : PAL[i % 5];
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 8 }}>
        {line != null && (
          <View pointerEvents="none" style={{ position: 'absolute', left: 4, right: 4, top: 76 - (line / vmax) * H, borderTopWidth: 2.5, borderStyle: 'dashed', borderColor: '#E0762A' }}>
            <Text style={[body(10, true), { position: 'absolute', right: 0, top: -16, color: '#9A3F0A' }]}>{o.line_label}</Text>
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
function Dots({ spec, state, pick }: { spec: Spec; state: V3State; pick: string | null }) {
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
function Dot({ x, y, lit, state, i, k }: { x: number; y: number; lit: boolean; state: V3State; i: number; k: string }) {
  const pop = usePlay(k, lit && state !== 'idle', 300, 50 * i, BOUNCE);
  const idle = useIdle(state === 'idle', 1100, 120 * i);
  return (
    <Animated.View style={{ position: 'absolute', left: x - 8, top: y, width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: C.navy,
      backgroundColor: lit && state !== 'idle' ? (state === 'nope' ? BAD : LIT) : C.hintBlue,
      transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [1, 1.3] }) }, { translateY: idle.interpolate({ inputRange: [0, 1], outputRange: [0, -2] }) }] }} />
  );
}

/* ------------------------------------------------------------------ a curve that draws itself */
const APath = Animated.createAnimatedComponent(Path);
function Steps({ spec, state, pick }: { spec: Spec; state: V3State; pick: string | null }) {
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
            <APath d={d} stroke={state === 'nope' ? (over ? '#E5484D' : C.orange) : '#2F8F4E'} strokeWidth={3.5} fill="none" strokeLinejoin="round"
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

/* ------------------------------------------------------------------ paired DNA strands */
const PAIR: Record<string, string> = { A: 'T', T: 'A', G: 'C', C: 'G' };
const BASE: Record<string, string> = { A: LIT, T: BAD, G: C.sky, C: C.sun };
function Base({ top, bottom, i, state, k }: { top: string; bottom: string; i: number; state: V3State; k: string }) {
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
function Strands({ spec, state, pick }: { spec: Spec; state: V3State; pick: string | null }) {
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
function Thermo({ spec, state, pick }: { spec: Spec; state: V3State; pick: string | null }) {
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

/* ------------------------------------------------------------------ Engineering: circuit, battery, gauge (ported from picturesV2) */
/** A battery and its resistors in a loop. State: [current in A, text]; current flows round the wire, faster for more amps. */
function Circuit({ spec, state, pick }: { spec: Spec; state: V3State; pick: string | null }) {
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
function Battery({ spec, state, pick }: { spec: Spec; state: V3State; pick: string | null }) {
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
function Gauge({ spec, state, pick }: { spec: Spec; state: V3State; pick: string | null }) {
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
          borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: state === 'nope' ? '#E0762A' : C.navy, transform: [{ translateX: tx }] }} />
      </View>
      <Result text={s ? s[1] : ''} state={state} k={k} delay={1300} />
    </View>
  );
}

/** The fruit sorter: fruit passes a colour sensor, and each one takes its route (bin, stay, juice line or off the end).
 *  State: [[[sprite, route, badge], ...], text]; sprites are image paths. Options: juice (draws the juice line). */
const BX = 112, BIN_L = 252, KEEP_X = 164, BELT_END = 198, GAP = 50, STEP = 1600;
type BeltRoute = 'bin' | 'stay' | 'floor' | 'juice';
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
      <Image source={imageOf(sprite)} style={{ width: 34, height: 34 }} resizeMode="contain" />
      {badge ? <Text style={[body(10, true), { position: 'absolute', right: -12, top: -8, paddingHorizontal: 4, borderRadius: 6, borderWidth: 1.5, borderColor: C.navy, backgroundColor: C.card, overflow: 'hidden' }]}>{badge}</Text> : null}
    </Animated.View>
  );
}
function Belt({ spec, state, pick }: { spec: Spec; state: V3State; pick: string | null }) {
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
        <Image source={imageOf('assets/images/fruits/bin.png')} style={{ position: 'absolute', left: BIN_L, top: 26, width: 72, height: 68, zIndex: 3 }} resizeMode="contain" />
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

/* ------------------------------------------------------------------ Healthcare and Finance pictures */
/* eslint-disable @typescript-eslint/no-explicit-any */
/** The value a picture shows for the current state: the right answer after a right Check, the picked option's own state after a wrong one. */
function stateValue(spec: any, state: V3State, pick: string | null): any {
  if (state === 'go') return spec.correct_state;
  if (state === 'nope') return spec.states?.wrong_by_option?.[pick ?? ''] ?? null;
  return null;
}
/** The caption inside a state: its text field, or the last piece of text in it. */
function caption(v: any): string | null {
  if (v == null) return null;
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) { for (let i = v.length - 1; i >= 0; i--) { const c = caption(v[i]); if (c) return c; } return null; }
  if (typeof v === 'object') return typeof v.text === 'string' ? v.text : null;
  return null;
}
const imageOf = (path?: string) => (path ? V3_IMAGES[path] : undefined);
/** An icon for the picture types whose JSON names none, so the card never falls back to an empty box. */
const TYPE_ICON: Record<string, string> = {
  balance: 'iv_stand', flowmeter: 'oxygen_flowmeter', transfusion: 'blood_bag', gcs_chart: 'clipboard',
  ward: 'hospital_bed', wards: 'hospital_bed', lamps: 'patient_monitor', dftable: 'clipboard',
  trial: 'lab_tube', stays_pic: 'calendar', coverage: 'vaccine_syringe', grid2: 'lab_tube', ldl: 'lab_tube',
};
const typeIcon = (type?: string) => (type && TYPE_ICON[type] ? `assets/images/healthcare/icons/${TYPE_ICON[type]}.png` : undefined);

function Caption({ text, state }: { text: string | null; state: V3State }) {
  const fade = useRef(new Animated.Value(0)).current;
  const reduce = useReduceMotion();
  useEffect(() => {
    fade.setValue(0);
    if (!text) return;
    if (reduce) { fade.setValue(1); return; }
    Animated.timing(fade, { toValue: 1, duration: 300, delay: 950, useNativeDriver: true }).start();
  }, [text, state, fade, reduce]);
  if (!text) return null;
  return (
    <Animated.View style={{ flex: 1, opacity: fade, transform: [{ translateY: fade.interpolate({ inputRange: [0, 1], outputRange: [4, 0] }) }] }}>
      <Text style={[body(11, true), { color: '#4A527F' }]}>result</Text>
      <Text style={[monoBold(13), { color: state === 'nope' ? '#B3470E' : '#2F6B0F' }]}>{text}</Text>
    </Animated.View>
  );
}

/** A device whose own screen counts up: the device stays still while its screen strip steps from the start value to the reading. */
function DeviceV3({ spec, state, pick }: { spec: any; state: V3State; pick: string | null }) {
  const dev = spec.assets?.device ?? spec.assets;
  const size: number = dev.display_size_px ?? 150;
  const box = dev.screen_box_display_px;
  const key = state === 'go' ? 'correct' : state === 'nope' ? pick ?? '' : '';
  const strip = key ? dev.strips?.[key] : null;
  const frames: number = strip?.frames ?? 1;
  const step = useRef(new Animated.Value(0)).current;
  const reduce = useReduceMotion();
  useEffect(() => {
    step.setValue(0);
    if (!strip) return;
    if (reduce || frames < 2) { step.setValue(1); return; }
    Animated.timing(step, { toValue: 1, duration: 950, delay: 100, useNativeDriver: true,
      easing: (t: number) => Math.floor(t * (frames - 1)) / (frames - 1) }).start();
  }, [state, pick, strip, frames, step, reduce]);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 }}>
      <View style={{ width: size, height: size }}>
        <Image source={imageOf(dev.idle_frame)} style={{ width: size, height: size }} resizeMode="contain" />
        {strip ? (
          <View style={{ position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, overflow: 'hidden' }}>
            <Animated.Image source={imageOf(strip.strip)} style={{ width: box.w, height: box.h * frames,
              transform: [{ translateY: step.interpolate({ inputRange: [0, 1], outputRange: [0, -(frames - 1) * box.h] }) }] }} />
          </View>
        ) : null}
      </View>
      <Caption text={caption(stateValue(spec, state, pick))} state={state} />
    </View>
  );
}

/** The other Healthcare and Finance pictures: the picture's own icon, which pops on Check, and the result for the answer given.
 *  The canvas pages hold the full scene animation for these types (see docs/INTEGRATION_moat4new.md). */
function StateCardV3({ spec, state, pick }: { spec: any; state: V3State; pick: string | null }) {
  const a = spec.assets ?? {};
  const src = imageOf(spec.icon_asset ?? a.pig ?? a.pile ?? a.note ?? a.bag?.empty ?? a.face ?? a.device?.idle_frame ?? typeIcon(spec.type));
  const pop = useRef(new Animated.Value(0)).current;
  const reduce = useReduceMotion();
  useEffect(() => {
    pop.setValue(0);
    if (state === 'idle' || reduce) return;
    Animated.sequence([Animated.timing(pop, { toValue: 1, duration: 180, useNativeDriver: true }), Animated.spring(pop, { toValue: 0, useNativeDriver: true, friction: 4 })]).start();
  }, [state, pick, pop, reduce]);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 }}>
      {src ? (
        <Animated.Image source={src} style={{ width: 96, height: 96, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }] }} resizeMode="contain" />
      ) : (
        <View style={{ width: 96, height: 96, borderRadius: 16, borderWidth: 2.5, borderColor: C.navy, backgroundColor: C.editor }} />
      )}
      <Caption text={caption(stateValue(spec, state, pick))} state={state} />
    </View>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/* ------------------------------------------------------------------ entry point */
export function PictureV3({ spec, state, pick }: { spec: Spec; state: V3State; pick: string | null }) {
  const known = { tiles: Tiles, ratebars: RateBars, dots: Dots, steps: Steps, strands: Strands, thermo: Thermo, circuit: Circuit, battery: Battery, gauge: Gauge, belt: Belt }[spec.type as 'tiles'];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const a = (spec as any).assets;
  const P = known ?? (a?.strips || a?.device?.strips ? DeviceV3 : StateCardV3);
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={spec.label}>
      <Shake state={state} pick={pick}>
        <P spec={spec} state={state} pick={pick} />
      </Shake>
    </View>
  );
}

/* ------------------------------------------------------------------ checkpoint confetti */
const CONFETTI_COLOURS = ['#B5E04A', '#59B4FF', '#FFC93C', '#FF8A3D', '#FFD6E0', '#1B2472'];
/** 30 pieces fall once over the green checkpoint recap (2.0 to 2.6 s, staggered); Reduce Motion shows none. */
export function Confetti() {
  const reduce = useReduceMotion();
  const pieces = useMemo(() => Array.from({ length: 30 }, (_, i) => ({
    left: (i * 37) % 380, w: 7 + (i % 3) * 3, colour: CONFETTI_COLOURS[i % 6], delay: (i % 10) * 80, duration: 2000 + (i % 5) * 150, rot: (i * 47) % 360, v: new Animated.Value(0),
  })), []);
  useEffect(() => {
    AccessibilityInfo.announceForAccessibility('Checkpoint complete');
    if (reduce) return;
    Animated.parallel(pieces.map((p) => Animated.timing(p.v, { toValue: 1, duration: p.duration, delay: p.delay, easing: Easing.bezier(0.2, 0.6, 0.4, 1), useNativeDriver: true }))).start();
  }, [reduce]); // eslint-disable-line react-hooks/exhaustive-deps
  if (reduce) return null;
  return (
    <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', zIndex: 20 }}>
      {pieces.map((p, i) => (
        <Animated.View key={i} style={{ position: 'absolute', top: -24, left: p.left, width: p.w, height: p.w + 6, borderRadius: 2, backgroundColor: p.colour,
          opacity: p.v.interpolate({ inputRange: [0, 0.85, 1], outputRange: [1, 1, 0] }),
          transform: [{ translateY: p.v.interpolate({ inputRange: [0, 1], outputRange: [0, 900] }) }, { rotate: p.v.interpolate({ inputRange: [0, 1], outputRange: [`${p.rot}deg`, `${p.rot + 540}deg`] }) }] }} />
      ))}
    </View>
  );
}
