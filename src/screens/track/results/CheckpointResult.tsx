// The screen after a checkpoint: its stars, then what it unlocked or what still needs full stars.
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from '../../../components/SafeAreaView';
import { Card, ChunkyButton, DottedBackground } from '../../../components/ui';
import { BoltIcon, StarIcon } from '../../../components/icons';
import { StarsRow } from '../../../components/track/stars';
import { useTrackStore } from '../../../hooks/useTrackStore_updated';
import { BORDER, C, body, heading } from '../../../utils/theme';
import { RunResult, isPerfect } from '../../../types/models';
import type { TrackPhase } from '../../../content/types';
import { Hero } from './Hero';

/** Shown after a checkpoint run; on the track's last phase it closes cycle 1 instead of opening a next phase. */
export function CheckpointResult({ phase, result, onReplay, onDone }: { phase: TrackPhase; result: RunResult; onReplay: () => void; onDone: () => void }) {
  const track = useTrackStore();
  const last = phase.number >= (track.track?.phases.length ?? phase.number);
  const complete = track.phaseComplete(phase);
  const perfect = isPerfect(result);
  const u = phase.checkpoint.unlock;
  const weak = [
    ...phase.lessons.filter((l) => track.stars(l.id) < l.questions.length).map((l) => [`Part ${l.part} · ${l.title}`, track.stars(l.id), l.questions.length] as [string, number, number]),
    ...(track.stars(phase.checkpoint.id) < phase.checkpoint.questions.length ? [[`Checkpoint · ${phase.checkpoint.name}`, track.stars(phase.checkpoint.id), phase.checkpoint.questions.length] as [string, number, number]] : []),
  ];
  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
      <DottedBackground navy />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12 }}>
        <Pressable onPress={onDone} accessibilityRole="button" accessibilityLabel="Close" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="close" size={24} color={C.cream} />
        </Pressable>
        <View style={{ height: 36, flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: 8, paddingRight: 12, borderRadius: 18, backgroundColor: C.lime, borderWidth: BORDER, borderColor: C.navy }}>
          <BoltIcon size={18} />
          <Text style={heading(18)}>+{result.earned + result.bonus}</Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }} showsVerticalScrollIndicator={false}>
        <Hero mood={perfect ? 'hearts' : 'wink'} size={100} dark />
        <Text style={[heading(34), { color: C.cream, textAlign: 'center' }]} accessibilityRole="header">
          {complete && last ? 'Cycle 1 complete' : perfect ? 'Perfect checkpoint' : 'Checkpoint done'}
        </Text>
        <Text style={[body(16), { color: C.lavender, textAlign: 'center' }]}>Phase {phase.number} · {phase.checkpoint.name}{perfect && result.firstAttempt ? ' · first try' : ''}</Text>
        <Card radius={20} shadow shadowColor="#050828" contentStyle={{ padding: 14, gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={body(17, true)}>{result.stars} of {result.total} right first try</Text>
            {result.bonus > 0 && (
              <View style={{ paddingHorizontal: 9, paddingVertical: 2, borderRadius: 9, backgroundColor: C.sun, borderWidth: 2, borderColor: C.navy }}>
                <Text style={body(13, true)}>+30 perfect bonus</Text>
              </View>
            )}
          </View>
          <StarsRow filled={result.stars} total={result.total} size={44} />
        </Card>
        {complete ? (
          <Card radius={20} shadow shadowColor="#050828" contentStyle={{ padding: 16, gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="lock-open" size={18} color={C.navy} />
              <View style={{ paddingHorizontal: 8, paddingVertical: 1, borderRadius: 8, backgroundColor: C.lime, borderWidth: 1.5, borderColor: C.navy }}><Text style={body(13, true)}>{u[0]}</Text></View>
            </View>
            <Text style={heading(24)}>{u[1]}</Text>
            <Text style={body(15)}>{u[2]}</Text>
          </Card>
        ) : (
          <Card radius={20} shadow shadowColor="#050828" contentStyle={{ padding: 16, gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="lock-closed" size={16} color={C.muted} />
              <Text style={[body(14, true), { color: C.muted }]}>{last ? 'Cycle 2 is still locked' : `Phase ${phase.number + 1} is still locked`}</Text>
            </View>
            <Text style={body(15)}>Get full stars on every lesson in this phase to open it. Still to fix:</Text>
            {weak.map(([t, s, n]) => (
              <View key={t} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 30 }}>
                <StarIcon />
                <Text style={[body(15, true), { flex: 1 }]}>{t}</Text>
                <Text style={body(14, true)}>{s}/{n}</Text>
              </View>
            ))}
            <Text style={[body(13), { color: C.muted }]}>Replays only pay bolts for questions you missed the first time.</Text>
          </Card>
        )}
      </ScrollView>
      {complete ? (
        <View style={{ padding: 16 }}>
          <ChunkyButton title={last ? 'Start cycle 2' : `Start phase ${phase.number + 1}`} onPress={onDone} />
        </View>
      ) : (
        <>
          <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
            <ChunkyButton title="Replay the checkpoint" onPress={onReplay} />
          </View>
          <Pressable onPress={onDone} accessibilityRole="button" style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={[body(16, true), { color: C.cream, textDecorationLine: 'underline' }]}>Back to Learn</Text>
          </Pressable>
        </>
      )}
    </SafeAreaView>
  );
}
