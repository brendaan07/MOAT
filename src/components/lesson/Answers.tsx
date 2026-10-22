// The answer options for predict and fill questions, laid out to fit their labels.
import React from 'react';
import { Pressable, StyleProp, Text, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BORDER, C, monoBold } from '../../utils/theme';
import type { PlayerQuestion } from '../../content/types';
import { pressDown } from './animations';

export type Look = { bg: string; op: number; ok: boolean; x: boolean };

/** A tick or a cross on a checked option. */
export function Tick({ ok }: { ok: boolean }) {
  return <Ionicons name={ok ? 'checkmark' : 'close'} size={16} color={C.navy} />;
}

/** The options as buttons: short fill words in a row, three short outputs as circles, four as a grid, else a list. */
export function Answers({ q, looks, pick }: { q: PlayerQuestion; looks: Record<string, Look>; pick: (id: string) => void }) {
  const opts = q.opts ?? [];
  const labels = opts.map((o) => o.label);
  const press = (o: { id: string; label: string }, style: StyleProp<ViewStyle>, textSize: number, inner?: React.ReactNode) => {
    const L = looks[o.id];
    return (
      <Pressable key={o.id} onPress={() => pick(o.id)} accessibilityRole="button" accessibilityState={{ selected: L.bg === C.lime && !L.ok }} style={(s) => [style, { backgroundColor: L.bg, opacity: L.op }, pressDown(s)]}>
        {inner ?? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {(L.ok || L.x) && <Tick ok={L.ok} />}
            <Text style={monoBold(textSize)}>{o.label}</Text>
          </View>
        )}
      </Pressable>
    );
  };
  const box = { borderWidth: BORDER, borderColor: C.navy, alignItems: 'center' as const, justifyContent: 'center' as const };
  if (q.kind === 'fill') {
    if (labels.every((l) => l.length <= 3))
      return <View style={{ flexDirection: 'row', gap: 12 }}>{opts.map((o) => press(o, [box, { flex: 1, height: 64, borderRadius: 18 }], 28))}</View>;
    return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>{opts.map((o) => press(o, [box, { minWidth: 76, height: 52, paddingHorizontal: 18, borderRadius: 26 }], 18))}</View>;
  }
  if (labels.length === 3 && labels.every((l) => l.length <= 9 && !l.includes('\n')))
    return <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>{opts.map((o) => press(o, [box, { width: 104, height: 104, borderRadius: 52 }], 18))}</View>;
  if (labels.length === 4 && labels.every((l) => l.split('\n')[0].length <= 14))
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {opts.map((o) => press(o, [box, { width: '47%', minHeight: 56, borderRadius: 16, padding: 8, alignItems: 'flex-start' }], 14))}
      </View>
    );
  const longest = Math.max(...labels.flatMap((l) => l.split('\n').map((x) => x.length)));
  return (
    <View style={{ borderWidth: BORDER, borderColor: C.navy, borderRadius: 20, overflow: 'hidden', backgroundColor: C.card }}>
      {opts.map((o) =>
        press(
          o,
          { minHeight: 46, paddingHorizontal: 14, paddingVertical: 4, borderBottomWidth: 1.5, borderBottomColor: C.locked, flexDirection: 'row', alignItems: 'center' },
          14,
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <Text style={[monoBold(14), { color: C.lilac, alignSelf: 'flex-start' }]}>&gt;</Text>
            <Text style={[monoBold(longest <= 26 ? 14 : 13), { flex: 1 }]}>{o.label}</Text>
            {(looks[o.id].ok || looks[o.id].x) && <Tick ok={looks[o.id].ok} />}
          </View>,
        ),
      )}
    </View>
  );
}
