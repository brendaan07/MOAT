// A true-or-false style question: two big buttons side by side.
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Question } from '../../../types/models';
import { heading } from '../../../utils/theme';
import { Card } from '../../../components/ui';
import { Outcome, chipLook, lookFill } from './looks';

export function JudgeQuestion({ q, choice, outcome, onChoose }: { q: Question; choice: string | null; outcome: Outcome; onChoose: (o: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
      {q.options.map((o) => (
        <Pressable key={o} style={{ flex: 1 }} onPress={() => !outcome && onChoose(o)} accessibilityRole="button" accessibilityState={{ selected: choice === o }}>
          <Card fill={lookFill(chipLook(q, o, choice, outcome))} radius={16} shadow contentStyle={{ minHeight: 64, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={heading(22)}>{o}</Text>
          </Card>
        </Pressable>
      ))}
    </View>
  );
}
