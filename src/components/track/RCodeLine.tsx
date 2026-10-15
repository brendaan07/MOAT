// One line of R on a dark editor panel, optionally with a blank that fills with the learner's pick.
import React from 'react';
import { Text, View } from 'react-native';
import { C, monoBold } from '../../utils/theme';
import { colorR } from '../../utils/codeColor';

/** One line of code, optionally with a blank that fills with the learner's pick. */
export function RCodeLine({ text, number, blankFill, size = 16 }: { text: string; number?: number; blankFill?: string | null; size?: number }) {
  const parts = text.split('___');
  const colored = (s: string) => colorR(s).map((p, i) => (<Text key={i} style={{ color: p.c }}>{p.t}</Text>));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: size + 10 }}>
      {number !== undefined && <Text style={[monoBold(size - 3), { color: C.lilac, width: 18, textAlign: 'right' }]}>{number}</Text>}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={[monoBold(size), { color: C.cream }]}>{colored(parts[0])}</Text>
        {parts.length > 1 &&
          (blankFill ? (
            <View style={{ backgroundColor: C.lime, borderRadius: 8, paddingHorizontal: 6 }}>
              <Text style={monoBold(size)}>{blankFill}</Text>
            </View>
          ) : (
            <View style={{ width: 96, height: 24, borderBottomWidth: 3, borderStyle: 'dashed', borderColor: C.lime }} />
          ))}
        {parts.length > 1 && <Text style={[monoBold(size), { color: C.cream }]}>{colored(parts[1])}</Text>}
      </View>
    </View>
  );
}
