// The sheet that slides up after each answer: the result, the worked answer, the lab notebook entry and Continue or Try again.
import React from 'react';
import { Animated, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BORDER, C, body, heading, monoBold } from '../../utils/theme';
import { RobotForm, RobotMood } from '../../types/models';
import { TRACK_BOLTS_PER_QUESTION } from '../../utils/rewards';
import { useSlideUp } from '../../hooks/useSlideUp';
import { ChunkyButton } from '../ui';
import { RobotFace } from '../track/RobotFace';
import { Enter } from './animations';
import type { V2Question } from './types';

export function FeedbackSheet({ right, q, index, line, onContinue, onRetry, robotForm, mood, earned }: {
  right: boolean; q: V2Question; index: number; line: string; onContinue: () => void; onRetry: () => void; robotForm: RobotForm; mood: RobotMood; earned: boolean;
}) {
  const anim = useSlideUp(true);
  return (
    <Animated.View style={[{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 6, backgroundColor: right ? C.successSheet : C.missSheet, borderTopWidth: BORDER, borderTopColor: C.navy, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 30 }, anim]} accessibilityLiveRegion="polite">
      <Enter kind="pop" style={{ position: 'absolute', right: 14, top: -58 }}>
        <RobotFace form={robotForm} mood={mood} width={100} height={100} />
      </Enter>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text style={heading(30)} accessibilityRole="header">{right ? q.okTitle : 'Not quite'}</Text>
        {right && earned && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 2, borderRadius: 12, backgroundColor: C.navy }}>
            <Ionicons name="flash" size={13} color={C.sky} />
            <Text style={[body(14, true), { color: C.cream }]}>+{TRACK_BOLTS_PER_QUESTION}</Text>
          </View>
        )}
      </View>
      {right && q.eq.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 10 }} accessibilityLabel="Worked answer">
          {q.eq.map((x, i) =>
            typeof x === 'string' ? (
              <Text key={i} style={monoBold(18)}>{x}</Text>
            ) : (
              <Text key={i} style={[monoBold(18), { backgroundColor: x.c, borderRadius: 11, borderWidth: BORDER, borderColor: C.navy, paddingHorizontal: 9, paddingVertical: 2, overflow: 'hidden' }]}>{x.t}</Text>
            ),
          )}
        </View>
      )}
      <Text style={[body(16), { marginTop: 10, maxWidth: 250 }]}>{line}</Text>
      {right && (
        <>
          <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: C.card, borderWidth: 2, borderColor: C.navy }}>
            <Ionicons name="book-outline" size={18} color={C.navy} />
            <View style={{ flex: 1 }}>
              <Text style={[body(13, true), { color: C.muted }]}>Added to your lab notebook, {index + 1} of 5</Text>
              <Enter kind="snap">
                <Text style={body(15, true)}>{q.entry}</Text>
              </Enter>
            </View>
          </View>
          <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="arrow-forward" size={16} color={C.navy} />
            <Text style={[body(15, true), { flex: 1 }]}>Next: {q.bridge}</Text>
          </View>
        </>
      )}
      <ChunkyButton title={right ? 'Continue' : 'Try again'} fill={right ? C.lime : C.orange} onPress={right ? onContinue : onRetry} style={{ marginTop: 14 }} />
    </Animated.View>
  );
}
