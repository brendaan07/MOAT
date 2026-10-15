// A build-the-line question: tap pieces to place them in order, tap a placed piece to take it back out.
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Question } from '../../../types/models';
import { C, body } from '../../../utils/theme';
import { Card, FlowWrap, TokenChip } from '../../../components/ui';
import { Outcome } from './looks';

/** `placed` holds indexes into q.options, in the order the learner tapped them. */
export function BuildQuestion({ q, placed, outcome, onPlace, onRemove }: { q: Question; placed: number[]; outcome: Outcome; onPlace: (optionIndex: number) => void; onRemove: (position: number) => void }) {
  return (
    <View style={{ gap: 12, marginTop: 8 }}>
      <Card radius={16} contentStyle={{ padding: 10, minHeight: 72 }}>
        <FlowWrap spacing={8}>
          {placed.map((idx, k) => (
            <Pressable key={k} onPress={() => !outcome && onRemove(k)} accessibilityHint="Tap to take it out">
              <TokenChip text={q.options[idx]} look={outcome ? (outcome === 'correct' ? 'correct' : 'wrong') : 'normal'} />
            </Pressable>
          ))}
        </FlowWrap>
      </Card>
      <Text style={[body(14), { color: C.muted, textAlign: 'center' }]}>Tap a piece to add it. Tap it again to take it out.</Text>
      <FlowWrap>
        {q.options.map((o, idx) => {
          const used = placed.includes(idx);
          return (
            <Pressable key={idx} disabled={used} onPress={() => !outcome && !used && onPlace(idx)} accessibilityRole="button">
              <TokenChip text={o} look={used ? 'used' : 'normal'} />
            </Pressable>
          );
        })}
      </FlowWrap>
    </View>
  );
}
