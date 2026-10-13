// Checkpoint "Debug": an error message on top, and the editor's lines below to tap the guilty one.
import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BORDER, C, body, monoBold } from '../../../utils/theme';
import { TrackPhase } from '../../../types/models';
import { LiveOutput } from '../../../components/track/ProjectCard';
import { BugLine, EditorFrame, QuestionView } from './parts';

export function DebugQuestion({ view, phase, live }: { view: QuestionView; phase: TrackPhase; live: LiveOutput }) {
  const { q } = view;
  return (
    <View style={{ gap: 10 }}>
      <View style={{ borderRadius: 16, borderWidth: BORDER, borderColor: C.orange, backgroundColor: C.errBg, paddingHorizontal: 14, paddingVertical: 9, gap: 3 }} accessibilityLiveRegion="polite">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="warning" size={18} color={C.orange} />
          <Text style={[body(13, true), { color: C.errText }]}>{live.label}</Text>
        </View>
        <Text style={[monoBold(14), { color: live.color }]}>{live.text}</Text>
      </View>
      <EditorFrame file={phase.checkpoint.filename} trailing={<Text style={[body(12, true), { color: C.lavender }]}>tap the guilty line</Text>}>
        <View style={{ padding: 4 }}>{(q.lines ?? []).map((l, i) => <BugLine key={l.id} view={view} index={i} line={l} magnifier />)}</View>
      </EditorFrame>
    </View>
  );
}
