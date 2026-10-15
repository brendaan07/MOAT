// Shown after the last part of a phase: the finished project card, the learner's whole script and the way on to the checkpoint.
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from '../../../components/SafeAreaView';
import { Card, ChunkyButton, DottedBackground } from '../../../components/ui';
import { C, body, heading } from '../../../utils/theme';
import { TrackPhase } from '../../../types/models';
import { ProjectCard } from '../../../components/track/ProjectCard';
import { RCodeLine } from '../../../components/track/RCodeLine';
import { Hero } from './Hero';
import { CloseButton } from '../../../components/CloseButton';

export function ProjectBuilt({ phase, onCheckpoint, onBack }: { phase: TrackPhase; onCheckpoint: () => void; onBack: () => void }) {
  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
      <DottedBackground />
      <CloseButton onPress={onBack} label="Back to Learn" icon="chevron-back" style={{ marginLeft: 8 }} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }} showsVerticalScrollIndicator={false}>
        <Hero mood="hearts" size={100} />
        <Text style={[heading(32), { textAlign: 'center' }]} accessibilityRole="header">Project built</Text>
        <Text style={[body(15), { color: C.muted, textAlign: 'center' }]}>Phase {phase.number} · {phase.area} · R</Text>
        <ProjectCard phase={phase} part={5} />
        <Card fill={C.screen} radius={20} shadow contentStyle={{ paddingHorizontal: 14, paddingVertical: 10, gap: 4 }}>
          <Text style={[body(14, true), { color: C.lavender }]}>Your code, {phase.code.length} lines</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>{phase.code.map((l, i) => <RCodeLine key={i} text={l} number={i + 1} size={13} />)}</View>
          </ScrollView>
        </Card>
      </ScrollView>
      <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
        <ChunkyButton title={`Take the phase ${phase.number} checkpoint`} onPress={onCheckpoint} />
      </View>
      <Pressable onPress={onBack} accessibilityRole="button" style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={[body(16, true), { textDecorationLine: 'underline' }]}>Back to Learn</Text>
      </Pressable>
    </SafeAreaView>
  );
}
