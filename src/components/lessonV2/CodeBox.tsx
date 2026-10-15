// One numbered line of code on the dark editor panel, with an optional blank that snaps in the learner's pick.
import React from 'react';
import { Text, View } from 'react-native';
import { C, monoBold } from '../../utils/theme';
import { colorPy, colorR } from '../../utils/codeColor';
import { Enter } from './animations';

/** `py` picks Python colouring (R otherwise). */
export function CodeLine({ text, n, blank, size = 14, py = false }: { text: string; n: number; blank?: string | null; size?: number; py?: boolean }) {
  const parts = text.split('___');
  const colored = (s: string) => (py ? colorPy(s) : colorR(s)).map((p, i) => (<Text key={i} style={{ color: p.c }}>{p.t}</Text>));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: size + 8 }}>
      <Text style={[monoBold(size - 3), { color: C.lilac, width: 18, textAlign: 'right' }]}>{n}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1, flexWrap: 'wrap' }}>
        <Text style={[monoBold(size), { color: C.cream }]}>{colored(parts[0])}</Text>
        {parts.length > 1 &&
          (blank ? (
            <Enter kind="snap">
              <Text style={[monoBold(size), { backgroundColor: C.lime, borderRadius: 6, paddingHorizontal: 5 }]}>{blank}</Text>
            </Enter>
          ) : (
            <View style={{ width: 30, height: size, borderBottomWidth: 3, borderStyle: 'dashed', borderColor: C.lime }} />
          ))}
        {parts.length > 1 && <Text style={[monoBold(size), { color: C.cream }]}>{colored(parts[1])}</Text>}
      </View>
    </View>
  );
}
