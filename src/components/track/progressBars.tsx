// Progress along the top of a question: segments for lessons, stars for checkpoints.
import React from 'react';
import { View } from 'react-native';
import { BORDER, C } from '../../utils/theme';
import { StarIcon } from '../icons';

/** One segment per question; done ones are lime and the current one is blue (lime once right). */
export function SegmentBar({ total, index, currentCorrect }: { total: number; index: number; currentCorrect: boolean }) {
  return (
    <View style={{ flex: 1, flexDirection: 'row', gap: 6 }} accessible accessibilityLabel={`Question ${Math.min(index + 1, total)} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={{ flex: 1, height: 12, borderRadius: 6, borderWidth: BORDER, borderColor: C.navy, backgroundColor: i < index ? C.lime : i === index ? (currentCorrect ? C.lime : C.sky) : C.locked }} />
      ))}
    </View>
  );
}

/** The checkpoint version of the bar: one star per question. */
export function StarSlots({ total, index, currentCorrect }: { total: number; index: number; currentCorrect: boolean }) {
  return (
    <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center', gap: 6 }} accessible accessibilityLabel={`Checkpoint question ${index + 1} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <StarIcon key={i} size={24} stroke={C.cream} fill={i < index ? C.lime : i === index ? (currentCorrect ? C.lime : C.sky) : C.locked} />
      ))}
    </View>
  );
}
