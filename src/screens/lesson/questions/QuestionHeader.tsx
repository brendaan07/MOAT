// What every question shows first: the prompt, the hint (open for under-13s, on request otherwise), any picture and any code.
import React from 'react';
import { Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Question } from '../../../types/models';
import { C, body, heading } from '../../../utils/theme';
import { Card, CodeBlock } from '../../../components/ui';

export function QuestionHeader({ q, choice, hintOpen, onShowHint }: { q: Question; choice: string | null; hintOpen: boolean; onShowHint: () => void }) {
  return (
    <>
      <Text style={heading(24)} accessibilityRole="header">{q.prompt}</Text>
      {q.hint ? (
        hintOpen ? (
          <Card fill={C.hintBlue} radius={16} contentStyle={{ padding: 12, flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
            <Ionicons name="bulb" size={18} color={C.navy} />
            <Text style={[body(15), { flex: 1 }]}>{q.hint}</Text>
          </Card>
        ) : (
          <Pressable onPress={onShowHint} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 }}>
            <Ionicons name="bulb-outline" size={18} color={C.navy} />
            <Text style={[body(15, true), { textDecorationLine: 'underline' }]}>Need a hint?</Text>
          </Pressable>
        )
      ) : null}
      {q.picture ? <Text style={{ fontSize: 56, textAlign: 'center' }} accessibilityElementsHidden>{q.picture}</Text> : null}
      {q.code ? <CodeBlock codeText={q.kind === 'choice' && q.code.includes('___') ? q.code.replace('___', choice ?? '____') : q.code} /> : null}
    </>
  );
}
