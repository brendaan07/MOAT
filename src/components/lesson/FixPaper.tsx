// A fix question's script: tap the buggy line, then pick its replacement.
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BORDER, C, body, monoBold } from '../../utils/theme';
import type { PlayerQuestion } from '../../content/types';
import { Enter, pressDown } from './animations';
import { Tick } from './Answers';

/** Tap the line with the bug (given lines are green and locked); the other lines fold away and that line's own
 *  replacements appear. Tapping the line again unfolds the script. Lines with nothing to change say so. */
export function FixPaper({ q, line, fix, setLine, setFix, checked, right, dark }: {
  q: PlayerQuestion; line: string | null; fix: string | null; setLine: (id: string | null) => void; setFix: (id: string) => void; checked: boolean; right: boolean; dark: boolean;
}) {
  const F = q.fix!;
  const longest = Math.max(...F.lines.map((l) => l.code.length));
  const size = longest <= 26 ? 14 : 13;
  const opts = line ? F.byLine[line] ?? [] : [];
  const n = (id: string) => F.lines.findIndex((l) => l.id === id) + 1;
  return (
    <View style={{ gap: 12 }}>
      <View style={{ borderWidth: BORDER, borderColor: '#E5484D', borderRadius: 20, overflow: 'hidden', backgroundColor: C.card }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 40, paddingHorizontal: 14, backgroundColor: C.peach, borderBottomWidth: 2, borderBottomColor: '#E5484D' }}>
          <Ionicons name="warning" size={18} color="#C0362C" />
          <Text style={[body(14, true), { color: '#9F1D18' }]}>Bug in <Text style={monoBold(14)}>{q.file}</Text></Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 14, paddingHorizontal: 14, paddingTop: 6, paddingBottom: 2 }}>
          <Text style={[body(11, true), { color: C.muted, width: 28, textAlign: 'center' }]}>Line</Text>
          <Text style={[body(11, true), { color: C.muted }]}>Code: tap the line with the bug</Text>
        </View>
        {F.lines.map((l, i) => {
          const sel = line === l.id;
          if (line && !sel && !l.given && !checked) return null; // the other lines fold away
          const bg = l.given ? C.successSheet : checked && sel ? (right ? C.lime : C.peach) : sel ? '#FFF1C9' : 'transparent';
          return (
            <Enter key={l.id} kind="drop" delay={line ? 0 : 40 * i}>
              <Pressable disabled={l.given || checked} onPress={() => setLine(sel ? null : l.id)} accessibilityRole="button"
                accessibilityLabel={`Line ${i + 1}: ${l.code.trim()}${l.given ? ', given as correct' : ''}`} accessibilityState={{ selected: sel, disabled: l.given }}
                style={(st) => [{ minHeight: 48, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 14, borderTopWidth: 1, borderTopColor: C.paper,
                  borderLeftWidth: 6, borderLeftColor: sel ? C.navy : 'transparent', backgroundColor: bg }, pressDown(st)]}>
                <Text style={[monoBold(13), { width: 28, textAlign: 'center', color: C.muted }]}>{i + 1}</Text>
                <Text style={[monoBold(size), { flex: 1, color: l.given ? '#2F6B0F' : C.navy }]}>{l.code}</Text>
                {l.given ? <Text style={[body(11, true), { color: '#2F6B0F' }]}>✓ correct</Text> : sel && checked ? <Tick ok={right} /> : null}
              </Pressable>
            </Enter>
          );
        })}
      </View>
      {line ? (
        <Enter key={`opts-${line}`} kind="drop">
          <Text style={[body(14, true), { color: dark ? C.cream : C.muted, marginBottom: 6 }]}>
            {opts.length === 0 ? `Line ${n(line)} looks right. Tap another line.` : `Change line ${n(line)} to:`}
          </Text>
          {opts.length > 0 && (
            <View style={{ borderWidth: BORDER, borderColor: C.navy, borderRadius: 20, overflow: 'hidden', backgroundColor: C.card }}>
              {opts.map((o, i) => {
                const sel = fix === o.id;
                const bg = checked ? (sel ? (right ? C.lime : C.peach) : C.card) : sel ? C.lime : dark ? (['#DCEEFF', '#FFF1C9', '#FFE3CF', '#FFD6E0'][i % 4]) : C.card;
                return (
                  <Pressable key={o.id} disabled={checked} onPress={() => setFix(o.id)} accessibilityRole="button" accessibilityState={{ selected: sel }}
                    style={(st) => [{ minHeight: 48, paddingHorizontal: 14, paddingVertical: 6, borderBottomWidth: 1.5, borderBottomColor: C.locked, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: bg, opacity: checked && !sel ? 0.45 : 1 }, pressDown(st)]}>
                    <Text style={[monoBold(14), { color: C.lilac }]}>&gt;</Text>
                    <Text style={[monoBold(size), { flex: 1 }]}>{o.label}</Text>
                    {checked && sel ? <Tick ok={right} /> : null}
                  </Pressable>
                );
              })}
            </View>
          )}
        </Enter>
      ) : (
        <Text style={[body(14, true), { color: dark ? C.cream : C.muted }]}>Tap the line you would change.</Text>
      )}
    </View>
  );
}
