// Segmented progress bars for the results screens.
import React from 'react';
import { View } from 'react-native';
import { BORDER, C } from '../../utils/theme';

/** A segmented bar: finished segments lime, the current one lime when right. */
export function SegmentBar({ total, index, currentCorrect }: { total: number; index: number; currentCorrect: boolean }) {
  return (
    <View style={{ flex: 1, flexDirection: 'row', gap: 6 }} accessible accessibilityLabel={`Question ${Math.min(index + 1, total)} of ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={{ flex: 1, height: 12, borderRadius: 6, borderWidth: BORDER, borderColor: C.navy, backgroundColor: i < index ? C.lime : i === index ? (currentCorrect ? C.lime : C.sky) : C.locked }} />
      ))}
    </View>
  );
}
