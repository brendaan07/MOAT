// The "Leave this lesson?" sheet shown by every lesson player; it replaces the system alert.
import React from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { BORDER, C, body, heading } from '../utils/theme';
import { RobotForm, moodImage } from '../types/models';
import { useSlideUp } from '../hooks/useSlideUp';
import { BundleImage, Card, ChunkyButton } from './ui';
import { BoltIcon } from './icons';

/** `bolts` is what the learner would lose by leaving, since bolts only count once a lesson is finished. */
export function QuitSheet({ form, questionsDone, total, bolts, onKeep, onLeave }: { form: RobotForm; questionsDone: number; total: number; bolts: number; onKeep: () => void; onLeave: () => void }) {
  const anim = useSlideUp(true);
  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 10, justifyContent: 'flex-end' }]} accessibilityViewIsModal>
      <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(23,30,99,0.55)' }]} onPress={onKeep} accessibilityLabel="Keep going" />
      <Animated.View style={[{ backgroundColor: C.cream, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 30 }, anim]}>
        <BundleImage name={moodImage(form, 'surprised')} style={{ position: 'absolute', right: 16, top: -64, width: 104, height: 110 }} />
        <Text style={[heading(28), { paddingRight: 120 }]} accessibilityRole="header">Leave this lesson?</Text>
        <Text style={[body(16), { marginTop: 6, paddingRight: 120 }]}>All progress in this lesson will be lost.</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <Card radius={12} contentStyle={{ paddingHorizontal: 10, paddingVertical: 6 }}>
            <Text style={body(14, true)}>{questionsDone} of {total} questions done</Text>
          </Card>
          <Card fill={C.missSheet} radius={12} contentStyle={{ paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <BoltIcon size={14} />
            <Text style={body(14, true)}>{bolts} bolts lost</Text>
          </Card>
        </View>
        <Text style={[body(14), { color: C.muted, marginTop: 10 }]}>Bolts only go to your total when you finish the lesson.</Text>
        <ChunkyButton title="Keep going" onPress={onKeep} style={{ marginTop: 16 }} />
        <Pressable onPress={onLeave} accessibilityRole="button" style={{ marginTop: 12, height: 60 }}>
          <View style={{ position: 'absolute', left: 0, right: 0, top: 4, height: 56, borderRadius: 18, backgroundColor: C.deepOrange }} />
          <View style={{ height: 56, borderRadius: 18, borderWidth: BORDER, borderColor: C.deepOrange, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={[heading(20), { color: '#9A3F0A' }]}>Leave and lose progress</Text>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}
