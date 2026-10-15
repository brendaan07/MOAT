// A find-the-bug question: the lines of a program, tap the one with the mistake.
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Question } from '../../../types/models';
import { C, code } from '../../../utils/theme';
import { Card } from '../../../components/ui';
import { Outcome, chipLook, lookFill } from './looks';

export function BugQuestion({ q, choice, outcome, onChoose }: { q: Question; choice: string | null; outcome: Outcome; onChoose: (line: string) => void }) {
  return (
    <View style={{ gap: 10, marginTop: 8 }}>
      {q.options.map((line, i) => {
        const indent = line.length - line.trimStart().length;
        return (
          <Pressable key={i} onPress={() => !outcome && onChoose(line)} accessibilityRole="button" accessibilityLabel={`Line ${i + 1}: ${line.trim()}`} accessibilityState={{ selected: choice === line }}>
            <Card fill={lookFill(chipLook(q, line, choice, outcome))} radius={14} shadow contentStyle={{ minHeight: 52, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={[code(14), { color: C.muted, width: 20 }]}>{i + 1}</Text>
              <Text style={[code(17), { paddingLeft: indent * 8, flexShrink: 1 }]}>{line.trim()}</Text>
            </Card>
          </Pressable>
        );
      })}
    </View>
  );
}
