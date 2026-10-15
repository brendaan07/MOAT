// The "Lesson done!" screen shown at the end of a general-path lesson or game, with the bolts it earned.
import React from 'react';
import { Text, View } from 'react-native';
import { heading } from '../../utils/theme';
import { RobotForm, moodImage } from '../../types/models';
import { BundleImage, Card, ChunkyButton } from '../ui';
import { BoltIcon } from '../icons';

export function SimpleLessonComplete({ bolts, form, onContinue }: { bolts: number; form: RobotForm; onContinue: () => void }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 20 }}>
      <View style={{ flex: 1 }} />
      <BundleImage name={moodImage(form, 'excited')} style={{ width: 160, height: 190 }} />
      <Text style={heading(32)} accessibilityRole="header">Lesson done!</Text>
      <Card radius={24} shadow contentStyle={{ height: 48, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <BoltIcon size={22} strokeWidth={0} />
        <Text style={heading(22)}>+{bolts} bolts</Text>
      </Card>
      <View style={{ flex: 1 }} />
      <View style={{ alignSelf: 'stretch', padding: 16 }}>
        <ChunkyButton title="Continue" onPress={onContinue} />
      </View>
    </View>
  );
}
