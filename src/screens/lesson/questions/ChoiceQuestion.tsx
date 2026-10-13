// A fill-in-the-blank question: tap one chip to choose the answer.
import React from 'react';
import { Pressable } from 'react-native';
import { Question } from '../../../types/models';
import { FlowWrap, TokenChip } from '../../../components/ui';
import { Outcome, chipLook } from './looks';

export function ChoiceQuestion({ q, choice, outcome, onChoose }: { q: Question; choice: string | null; outcome: Outcome; onChoose: (o: string) => void }) {
  return (
    <FlowWrap style={{ marginTop: 8 }}>
      {q.options.map((o) => (
        <Pressable key={o} onPress={() => !outcome && onChoose(o)} accessibilityRole="button" accessibilityState={{ selected: choice === o }}>
          <TokenChip text={o} look={chipLook(q, o, choice, outcome)} />
        </Pressable>
      ))}
    </FlowWrap>
  );
}
