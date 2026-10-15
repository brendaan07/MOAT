// The navy screen before a phase checkpoint: the problem, what kinds of questions are inside and what passing unlocks.
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from '../../../components/SafeAreaView';
import { Ionicons } from '@expo/vector-icons';
import { Card, ChunkyButton, DottedBackground } from '../../../components/ui';
import { C, FONTS, body, heading } from '../../../utils/theme';
import { TrackPhase } from '../../../types/models';
import { Hero } from './Hero';
import { CloseButton } from '../../../components/CloseButton';

const TYPES: [string, string, keyof typeof Ionicons.glyphMap][] = [
  ['Plan it', C.sun, 'flag'],
  ['Order the code', C.sky, 'code-slash'],
  ['Predict', C.lime, 'terminal'],
  ['Debug', C.orange, 'search'],
  ['Build it', C.hintBlue, 'cube'],
];

export function CheckpointIntro({ phase, onStart, onClose }: { phase: TrackPhase; onStart: () => void; onClose: () => void }) {
  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
      <DottedBackground navy />
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 }}>
        <CloseButton onPress={onClose} label="Close" color={C.cream} />
        <View style={{ flex: 1, alignItems: 'center' }}>
          <View style={{ paddingHorizontal: 10, paddingVertical: 2, borderRadius: 10, backgroundColor: C.sun, borderWidth: 2, borderColor: C.navy }}>
            <Text style={body(14, true)}>Checkpoint {phase.number}</Text>
          </View>
        </View>
        <View style={{ width: 44 }} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }} showsVerticalScrollIndicator={false}>
        <Hero mood="surprised" size={100} dark />
        <Text style={[heading(32), { color: C.cream, textAlign: 'center' }]} accessibilityRole="header">{phase.checkpoint.name}</Text>
        <Text style={[body(15), { color: C.lavender, textAlign: 'center' }]}>5 harder questions. A new problem, using everything from phase {phase.number}.</Text>
        <Card fill={C.hintBlue} radius={20} shadow shadowColor="#050828" contentStyle={{ padding: 14, gap: 3 }}>
          <Text style={heading(18)}>The problem</Text>
          <Text style={body(15)}>{phase.checkpoint.problem}</Text>
        </Card>
        <Card radius={20} shadow shadowColor="#050828" contentStyle={{ padding: 14, gap: 4 }}>
          <Text style={heading(18)}>What's inside</Text>
          {TYPES.map(([name, color, icon], i) => (
            <View key={name} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 38 }}>
              <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: color, borderWidth: 2, borderColor: C.navy, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={icon} size={14} color={C.navy} />
              </View>
              <Text style={[body(15), { flex: 1 }]}>
                <Text style={{ fontFamily: FONTS.bodyBold }}>{name}</Text> · {phase.checkpoint.questions[i]?.prompt ?? ''}
              </Text>
            </View>
          ))}
        </Card>
        <Text style={[body(14), { color: C.lavender, textAlign: 'center' }]}>
          {phase.number >= 5 ? 'Cycle 2 opens at 5 stars here and on every lesson.' : `Phase ${phase.number + 1} opens at 5 stars here and on every lesson.`}
        </Text>
      </ScrollView>
      <View style={{ padding: 16 }}>
        <ChunkyButton title="Start checkpoint" onPress={onStart} />
      </View>
    </SafeAreaView>
  );
}
