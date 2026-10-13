// The small illustrations on a track phase (DNA helix, quality bars, well plate, growth curve, report, batch), full size or compact.
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path, Polyline, Rect, Text as SvgText } from 'react-native-svg';
import { C, body, heading, monoBold } from '../../utils/theme';
import { Card } from '../ui';

const baseColor = (b: string) => (b === 'A' ? C.orange : b === 'T' ? C.sun : b === 'G' ? C.lime : C.sky);

/** A row of coloured base tiles for a short DNA sequence. */
function DNAStrip({ sequence, size = 24 }: { sequence: string; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 4 }} accessible accessibilityLabel={`DNA sample ${sequence}`}>
      {sequence.split('').map((b, i) => (
        <View key={i} style={{ width: size, height: size, borderRadius: 6, borderWidth: 2, borderColor: C.navy, backgroundColor: baseColor(b), alignItems: 'center', justifyContent: 'center' }}>
          <Text style={monoBold(size / 2 + 1)}>{b}</Text>
        </View>
      ))}
    </View>
  );
}

function HelixGauge() {
  const w = 196, h = 56, n = 72, seq = 'ATGCGCATGCGC';
  const pt = (t: number, sign: number) => [4 + (w - 8) * t, h / 2 + sign * (h / 2 - 6) * Math.sin(t * 4 * Math.PI)];
  const strand = (sign: number) => Array.from({ length: n + 1 }, (_, i) => pt(i / n, sign)).map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const r = 19, circ = 2 * Math.PI * r;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 56 }} accessible accessibilityLabel="A DNA double helix next to a gauge showing 67 percent GC content">
      <Svg width={w} height={h}>
        {seq.split('').map((b, k) => {
          const t = (k + 1) / (seq.length + 1);
          const [x, y1] = pt(t, 1), [, y2] = pt(t, -1);
          if (Math.abs(y1 - y2) < 6) return null;
          return <Line key={k} x1={x} y1={y1} x2={x} y2={y2} stroke={baseColor(b)} strokeWidth={5} strokeLinecap="round" />;
        })}
        <Path d={strand(-1)} stroke={C.navy} strokeWidth={3} fill="none" strokeLinecap="round" />
        <Path d={strand(1)} stroke={C.navy} strokeWidth={3} fill="none" strokeLinecap="round" />
      </Svg>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Svg width={48} height={48} viewBox="0 0 48 48">
          <Circle cx={24} cy={24} r={r} fill="none" stroke={C.locked} strokeWidth={8} />
          <Circle cx={24} cy={24} r={r} fill="none" stroke={C.lime} strokeWidth={8} strokeDasharray={`${(circ * 0.67).toFixed(1)} ${circ.toFixed(1)}`} transform="rotate(-90 24 24)" />
          <Circle cx={24} cy={24} r={r + 4} fill="none" stroke={C.navy} strokeWidth={2} />
          <Circle cx={24} cy={24} r={r - 4} fill="none" stroke={C.navy} strokeWidth={2} />
        </Svg>
        <View>
          <Text style={[body(12, true), { color: C.muted }]}>GC content</Text>
          <Text style={heading(20)}>67%</Text>
        </View>
      </View>
    </View>
  );
}

function QualityBars({ compact, width }: { compact: boolean; width: number }) {
  const bases = 'ACGTTAGCAT'.split('');
  const q = [38, 37, 36, 34, 31, 28, 24, 19, 13, 8];
  const h = compact ? 26 : 66, n = q.length;
  const bw = compact ? (width - 9 * 6) / n : 22;
  const gap = compact ? 6 : (width - 40 - n * 22) / (n - 1);
  const area = compact ? h - 4 : h - 26;
  const y20 = 4 + area - (20 / 40) * area;
  return (
    <Svg width={width} height={h} accessibilityLabel="Quality score for each base of a read, dropping below Q20 at the end">
      {q.map((v, i) => {
        const bh = (v / 40) * area, x = i * (bw + gap);
        return (
          <G key={i}>
            <Rect x={x} y={(compact ? 2 : 4) + area - bh} width={bw} height={bh} rx={compact ? 3 : 4} fill={v >= 20 ? C.lime : C.orange} stroke={C.navy} strokeWidth={compact ? 1.5 : 2} />
            {!compact && <Rect x={x} y={area + 7} width={bw} height={17} rx={4} fill={baseColor(bases[i])} stroke={C.navy} strokeWidth={1.5} />}
            {!compact && <SvgText x={x + bw / 2} y={area + 19.5} fontSize={11} fontWeight="700" fill={C.navy} textAnchor="middle">{bases[i]}</SvgText>}
          </G>
        );
      })}
      {!compact && <Line x1={0} y1={y20} x2={width - 38} y2={y20} stroke={C.navy} strokeWidth={1.5} strokeDasharray="4 4" />}
      {!compact && <SvgText x={width - 34} y={y20 + 4} fontSize={12} fontFamily="AtkinsonHyperlegible-Bold" fill={C.muted}>Q20</SvgText>}
    </Svg>
  );
}

function WellPlate({ compact, width }: { compact: boolean; width: number }) {
  const cols = compact ? 16 : 12, rows = compact ? 1 : 4, h = compact ? 26 : 66;
  const cw = (width - 24) / cols, ch = (h - 12) / rows, r = Math.min(cw, ch) / 2 - 1.5;
  const wells = [];
  for (let j = 0; j < rows; j++)
    for (let i = 0; i < cols; i++) {
      const fill = i < 5 && j < 2 ? C.lime : i === 5 && j === 0 ? C.orange : j < 2 ? C.hintBlue : C.paper;
      wells.push(<Circle key={`${i}-${j}`} cx={12 + (i + 0.5) * cw} cy={6 + (j + 0.5) * ch} r={r} fill={fill} stroke={C.navy} strokeWidth={1.5} />);
    }
  return (
    <Svg width={width} height={h} accessibilityLabel="A well plate: some wells filled, one sample split across two wells">
      <Rect x={1} y={1} width={width - 2} height={h - 2} rx={10} fill={C.card} stroke={C.navy} strokeWidth={2} />
      {wells}
    </Svg>
  );
}

function GrowthCurve({ width, height = 66 }: { width: number; height?: number }) {
  const pts = [1, 2, 4, 8, 16, 32, 64, 128], L = 30, B = height - 6, T = 4;
  const xy = (i: number) => [L + (i * (width - L - 10)) / 7, B - (pts[i] / 128) * (B - T)];
  const y100 = B - (100 / 128) * (B - T);
  return (
    <Svg width={width} height={height} accessibilityLabel="Bacterial count doubling each hour, crossing 100 after 7 hours">
      <Path d={`M${L} ${T} L${L} ${B} L${width - 6} ${B}`} stroke={C.navy} strokeWidth={2} fill="none" />
      <Line x1={L} y1={y100} x2={width - 6} y2={y100} stroke={C.orange} strokeWidth={1.5} strokeDasharray="4 4" />
      <SvgText x={2} y={y100 + 4} fontSize={11} fontFamily="AtkinsonHyperlegible-Bold" fill={C.muted}>100</SvgText>
      <Polyline points={pts.map((_, i) => xy(i).map((n) => n.toFixed(1)).join(',')).join(' ')} stroke={C.navy} strokeWidth={2.5} fill="none" strokeLinejoin="round" />
      {pts.map((v, i) => {
        const [x, y] = xy(i);
        return <Circle key={i} cx={x} cy={y} r={4.5} fill={v < 100 ? C.lime : C.orange} stroke={C.navy} strokeWidth={1.5} />;
      })}
    </Svg>
  );
}

function ReportMini({ compact }: { compact: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, height: compact ? 26 : 66 }} accessible accessibilityLabel="A report with a fixed seed and a species tally: 2 ants, 1 bee">
      {!compact && (
        <Card radius={8} style={{ width: 96 }} contentStyle={{ padding: 10, height: 62, gap: 7 }}>
          {[70, 56, 64, 40].map((w) => (
            <View key={w} style={{ width: w, height: 5, borderRadius: 3, backgroundColor: w === 70 ? C.navy : C.lockedEdge }} />
          ))}
        </Card>
      )}
      <View style={{ paddingHorizontal: 10, height: compact ? 22 : 30, borderRadius: 15, backgroundColor: C.sun, borderWidth: compact ? 1.5 : 2, borderColor: C.navy, justifyContent: 'center' }}>
        <Text style={monoBold(compact ? 12 : 13)}>set.seed(42)</Text>
      </View>
      <View style={{ gap: compact ? 0 : 6 }}>
        {([['ant', 2], ['bee', 1]] as [string, number][]).map(([n, v]) => (
          <View key={n} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={monoBold(12)}>{n}</Text>
            <View style={{ width: v * (compact ? 24 : 28), height: compact ? 10 : 15, borderRadius: 3, backgroundColor: C.sky, borderWidth: 1.5, borderColor: C.navy }} />
          </View>
        ))}
      </View>
    </View>
  );
}

function BatchBars() {
  const rows: [string, number, boolean][] = [['S1', 52, false], ['S2', 48, false], ['S3', 71, true], ['S4', 50, false]];
  return (
    <View style={{ gap: 4, height: 66 }} accessible accessibilityLabel="GC content for four samples; S3 at 71 percent is flagged">
      {rows.map(([s, v, flag]) => (
        <View key={s} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={[monoBold(12), { width: 22 }]}>{s}</Text>
          <View style={{ flex: 1, height: 12, borderRadius: 6, backgroundColor: C.locked, borderWidth: 1.5, borderColor: C.navy, overflow: 'hidden' }}>
            <View style={{ width: `${v}%`, height: '100%', backgroundColor: flag ? C.orange : C.sky }} />
          </View>
          <Text style={[monoBold(12), { width: 72 }]}>{v}%{flag ? ' flag' : ''}</Text>
        </View>
      ))}
    </View>
  );
}

/** The picture for a phase by its `kind`; `compact` is the one-line version inside the project card. */
export function PhasePicture({ kind, compact = false }: { kind: string; compact?: boolean }) {
  const [width, setWidth] = useState(300);
  return (
    <View onLayout={(e) => setWidth(Math.max(120, e.nativeEvent.layout.width))}>
      {kind === 'helix' && (compact ? <DNAStrip sequence="ATGCGC" /> : <HelixGauge />)}
      {kind === 'quality' && <QualityBars compact={compact} width={width} />}
      {kind === 'plate' && <WellPlate compact={compact} width={width} />}
      {kind === 'growth' && <GrowthCurve width={width} height={compact ? 30 : 66} />}
      {kind === 'report' && <ReportMini compact={compact} />}
      {kind === 'batch' && <BatchBars />}
    </View>
  );
}
