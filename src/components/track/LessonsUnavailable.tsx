// The card the path and phase screens show when the learner's track couldn't be loaded.
import React from 'react';
import { StyleProp, Text, ViewStyle } from 'react-native';
import { Card } from '../ui';
import { body } from '../../utils/theme';

/** Tells the learner their lessons didn't load and what to try. */
export function LessonsUnavailable({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <Card radius={20} style={style} contentStyle={{ padding: 20 }}>
      <Text style={body(15)}>
        Your lessons couldn't load. Close MOAT and open it again. If they still don't show, go to Profile, tap Edit my
        answers and pick your study area and language again.
      </Text>
    </Card>
  );
}
