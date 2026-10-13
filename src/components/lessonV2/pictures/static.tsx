// The still pictures: base strip, readout, rows, bar chart, tubes, pH scale, machine and chat message. Each is drawn from the lesson JSON.
import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { BORDER, C, body, monoBold } from '../../../utils/theme';
import { QSlot } from '../animations';

const BASE: Record<string, string> = { A: C.orange, T: C.sun, G: C.lime, C: C.sky };

/** A row of base tiles (A, T, G, C), optionally dimming all but some. */
export function Strip({ text, hi, size }: { text: string; hi: number[] | null; size: number }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: size > 26 ? 4 : 3 }} accessibilityLabel={`Bases ${text}`}>
      {text.split('').map((ch, i) => (
        <View key={i} style={{ width: size, height: size, borderRadius: 7, borderWidth: BORDER, borderColor: C.navy, backgroundColor: BASE[ch.toUpperCase()] ?? C.locked, opacity: hi === null || hi.includes(i) ? 1 : 0.32, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={monoBold(Math.floor(size / 2) + 1)}>{ch}</Text>
        </View>
      ))}
    </View>
  );
}

/** A labelled value, or a "?" slot when the learner has to work it out. */
export function Readout({ label, value, known, solved }: { label: string; value: string; known: boolean; solved: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
      <Text style={[body(13, true), { color: C.muted }]}>{label}</Text>
      {known ? <Text style={[monoBold(16), { backgroundColor: C.locked, borderRadius: 6, paddingHorizontal: 5 }]}>{value}</Text> : <QSlot value={value} solved={solved} />}
    </View>
  );
}

/** Two columns of name and value; the hidden values show a "?" slot. */
export function Rows({ items, solved }: { items: [string, string, boolean][]; solved: boolean }) {
  return (
    <View>
      {items.map(([a, b, hid], i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', minHeight: 28, borderTopWidth: 1.5, borderTopColor: C.lockedEdge }}>
          <Text style={[monoBold(14), { flex: 1 }]}>{a}</Text>
          <View style={{ flex: 1 }}>{hid ? <QSlot value={b} solved={solved} size={15} /> : <Text style={monoBold(15)}>{b}</Text>}</View>
        </View>
      ))}
    </View>
  );
}

const T = ({ x, y, s, size = 11, anchor = 'middle', fill = C.navy }: { x: number; y: number; s: string; size?: number; anchor?: 'start' | 'middle' | 'end'; fill?: string }) => (
  <SvgText x={x} y={y} fontSize={size} fontWeight="700" fill={fill} textAnchor={anchor}>
    {s}
  </SvgText>
);

/** A bar chart with optional cut-off line, missing values (NA) and hidden bars. */
export function Bars({ vals, cutoff, hide, labels, cmax }: { vals: (number | null)[]; cutoff: number | null; hide: number[]; labels: string[] | null; cmax: number | null }) {
  const h = 62;
  const max = cmax ?? Math.max(...(vals.filter((v) => v !== null) as number[]));
  const w = Math.min(54, Math.floor(260 / vals.length));
  return (
    <Svg width="100%" height={h + 26} viewBox={`0 0 326 ${h + 26}`} accessibilityLabel={`Bar chart of ${vals.map((v) => (v === null ? 'NA' : v)).join(', ')}`}>
      <Line x1={22} y1={h + 4} x2={316} y2={h + 4} stroke={C.navy} strokeWidth={2} />
      {cutoff !== null && (
        <>
          <Line x1={22} y1={h + 4 - (cutoff / max) * h} x2={316} y2={h + 4 - (cutoff / max) * h} stroke={C.deepOrange} strokeWidth={2} strokeDasharray="5 4" />
          <T x={316} y={h - (cutoff / max) * h} s={`cutoff ${cutoff}`} anchor="end" fill="#9A3F0A" />
        </>
      )}
      {vals.map((v, i) => {
        const x = 34 + i * (w + 14);
        const lab = labels ? labels[i] : String(i + 1);
        if (v === null)
          return (
            <React.Fragment key={i}>
              <Rect x={x} y={h - 16} width={w} height={20} rx={4} fill="none" stroke={C.navy} strokeWidth={2} strokeDasharray="4 3" />
              <T x={x + w / 2} y={h - 2} s="NA" />
              <T x={x + w / 2} y={h + 20} s={lab} />
            </React.Fragment>
          );
        const bh = Math.max(4, (v / max) * h);
        const hidden = hide.includes(i);
        return (
          <React.Fragment key={i}>
            <Rect x={x} y={h + 4 - bh} width={w} height={bh} rx={4} fill={hidden ? C.card : C.lime} stroke={C.navy} strokeWidth={2} strokeDasharray={hidden ? '4 3' : undefined} />
            {!hidden && <T x={x + w / 2} y={h - bh} s={String(v)} />}
            <T x={x + w / 2} y={h + 20} s={lab} />
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

/** Wells filled to a volume, against a maximum line. */
export function Tubes({ vols, cap }: { vols: number[]; cap: number }) {
  const h = 60;
  const top = cap * 1.25;
  const cy = 6 + h - 2 - (cap / top) * (h - 4);
  return (
    <Svg width="100%" height={h + 30} viewBox={`0 0 326 ${h + 30}`} accessibilityLabel={`Wells of ${vols.join(', ')} microlitres against a ${cap} microlitre limit`}>
      {vols.map((v, i) => {
        const x = 40 + i * 70;
        const fill = (Math.min(v, top) / top) * (h - 4);
        return (
          <React.Fragment key={i}>
            <Rect x={x} y={6} width={34} height={h} rx={8} fill={C.card} stroke={C.navy} strokeWidth={2.4} />
            <Rect x={x + 3} y={6 + h - 2 - fill} width={28} height={fill} rx={5} fill={v > cap ? C.number : C.sky} opacity={0.7} />
            <T x={x + 17} y={h + 22} s={`${v} uL`} />
          </React.Fragment>
        );
      })}
      <Line x1={30} y1={cy} x2={50 + 70 * vols.length} y2={cy} stroke={C.deepOrange} strokeWidth={2} strokeDasharray="5 4" />
      <T x={56 + 70 * vols.length} y={cy + 4} s={`max ${cap}`} anchor="start" fill="#9A3F0A" />
    </Svg>
  );
}

/** The 0 to 14 pH scale with marks. */
export function PhScale({ marks }: { marks: number[] }) {
  return (
    <Svg width="100%" height={48} viewBox="0 0 326 48" accessibilityLabel={`pH scale from 0 to 14 with marks at ${marks.join(', ')}`}>
      {Array.from({ length: 14 }, (_, i) => (
        <Rect key={i} x={20 + i * 21} y={10} width={21} height={16} fill={i < 7 ? C.orange : i === 7 ? C.locked : C.sky} />
      ))}
      <Rect x={20} y={10} width={294} height={16} fill="none" stroke={C.navy} strokeWidth={2} />
      {[0, 7, 14].map((p) => (
        <T key={p} x={20 + p * 21} y={42} s={String(p)} />
      ))}
      {marks.map((p, i) => (
        <Path key={i} d={`M${20 + p * 21} 10l-6 -8h12z`} fill={C.navy} />
      ))}
    </Svg>
  );
}

/** Input, then a function box, then a "?" for its output. */
export function Machine({ input, name, solved }: { input: string; name: string; solved: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Text style={[monoBold(14), { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 2, borderColor: C.navy, backgroundColor: C.card }]}>{input}</Text>
      <Ionicons name="arrow-forward" size={16} color={C.navy} />
      <Text style={[monoBold(14), { color: C.cream, backgroundColor: C.screen, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, overflow: 'hidden' }]}>{name}</Text>
      <Ionicons name="arrow-forward" size={16} color={C.navy} />
      <QSlot value={null} solved={solved} />
    </View>
  );
}

/** A chat bubble from a person, used for the lesson's opening request. */
export function Message({ who, text }: { who: string; text: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
      <View style={{ width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: C.navy, backgroundColor: C.hintBlue, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="person-outline" size={18} color={C.navy} />
      </View>
      <View style={{ flex: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, borderTopLeftRadius: 4, borderWidth: 2, borderColor: C.navy, backgroundColor: C.card }}>
        <Text style={[body(12, true), { color: C.muted }]}>{who}</Text>
        <Text style={[body(14, true), { lineHeight: 18 }]}>{text}</Text>
      </View>
    </View>
  );
}
