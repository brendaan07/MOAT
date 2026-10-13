// The top bar of the general-path lesson and game screens: quit button, progress bar and the bolts earned so far.
import React from 'react';
import { Text, View } from 'react-native';
import { BORDER, C, heading } from '../../utils/theme';
import { Card } from '../ui';
import { BoltIcon } from '../icons';
import { CloseButton } from '../CloseButton';

/** `progress` runs from 0 to 1. The quit button hides once the lesson is finished. */
export function LessonTopBar({ progress, bolts, finished, onQuit }: { progress: number; bolts: number; finished: boolean; onQuit: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 8 }}>
      <CloseButton onPress={onQuit} label="Quit lesson" size={26} disabled={finished} style={{ opacity: finished ? 0 : 1 }} />
      <View style={{ flex: 1, height: 16, borderRadius: 8, backgroundColor: C.locked, borderWidth: BORDER, borderColor: C.navy, overflow: 'hidden' }} accessible accessibilityLabel="Lesson progress" accessibilityValue={{ text: `${Math.round(progress * 100)} percent` }}>
        <View style={{ width: `${Math.max(0, progress) * 100}%`, height: '100%', backgroundColor: C.lime }} />
      </View>
      <Card radius={18} contentStyle={{ height: 36, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <BoltIcon size={18} strokeWidth={0} />
        <Text style={heading(18)} accessibilityLabel={`${bolts} bolts earned this lesson`}>+{bolts}</Text>
      </Card>
    </View>
  );
}
