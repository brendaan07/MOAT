// The sheet that slides up after a track answer: success or miss, the answer, the bolt bonus and the Continue or Try again button.
import React, { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { BORDER, C, body, heading, monoBold } from '../../utils/theme';
import { useSlideUp } from '../../hooks/useSlideUp';
import { BundleImage, Card, ChunkyButton } from '../ui';
import { BoltIcon } from '../icons';

function PoppingImage({ name, width, height, style }: { name: string; width: number; height: number; style?: object }) {
  const s = useRef(new Animated.Value(0.9)).current;
  const y = useRef(new Animated.Value(10)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(s, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }),
      Animated.spring(y, { toValue: 0, friction: 4, tension: 120, useNativeDriver: true }),
    ]).start();
  }, [name]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Animated.View style={[{ position: 'absolute', transform: [{ scale: s }, { translateY: y }] }, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <BundleImage name={name} style={{ width, height }} />
    </Animated.View>
  );
}

export function FeedbackSheet({
  correct,
  title,
  message,
  answerLine,
  bonusLine,
  note,
  robot,
  onContinue,
  onRetry,
}: {
  correct: boolean;
  title: string;
  message: string;
  answerLine?: string;
  bonusLine?: string;
  note?: string;
  robot: string;
  onContinue: () => void;
  onRetry: () => void;
}) {
  const anim = useSlideUp(true);
  return (
    <Animated.View style={[{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 6, backgroundColor: correct ? C.successSheet : C.missSheet, borderTopWidth: BORDER, borderTopColor: C.navy, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 30 }, anim]} accessibilityLiveRegion="polite">
      <PoppingImage name={robot} width={104} height={104} style={{ right: 14, top: -58 }} />
      <View style={{ paddingRight: 110, gap: 6 }}>
        <Text style={heading(28)} accessibilityRole="header">{title}</Text>
        <Text style={body(16)}>{message}</Text>
        {correct && bonusLine ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, paddingHorizontal: 12, height: 32, borderRadius: 16, backgroundColor: C.navy, marginTop: 6 }}>
            <BoltIcon size={16} stroke={C.sky} />
            <Text style={[body(15, true), { color: C.cream }]}>{bonusLine}</Text>
          </View>
        ) : null}
        {!correct && answerLine ? (
          <Card radius={12} style={{ alignSelf: 'flex-start', marginTop: 6 }} contentStyle={{ paddingHorizontal: 12, paddingVertical: 6 }}>
            <Text style={monoBold(15)}>{answerLine}</Text>
          </Card>
        ) : null}
      </View>
      {correct && note ? (
        <View style={{ marginTop: 12, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 2, borderStyle: 'dashed', borderColor: C.navy }}>
          <Text style={body(14)}>{note}</Text>
        </View>
      ) : null}
      <ChunkyButton title={correct ? 'Continue' : 'Try again'} fill={correct ? C.lime : C.orange} onPress={correct ? onContinue : onRetry} style={{ marginTop: 16 }} />
    </Animated.View>
  );
}
