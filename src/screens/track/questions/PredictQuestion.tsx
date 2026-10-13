// Checkpoint "Predict": read the script and choose what it prints in the console.
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { C, body, monoBold } from '../../../utils/theme';
import { TrackPhase } from '../../../types/models';
import { Card } from '../../../components/ui';
import { CheckIcon, CrossIcon } from '../../../components/icons';
import { RCodeLine } from '../../../components/track/RCodeLine';
import { optionState } from '../trackQuestionLogic';
import { EditorFrame, QuestionView } from './parts';

export function PredictQuestion({ view, phase }: { view: QuestionView; phase: TrackPhase }) {
  const { q, answer } = view;
  return (
    <View style={{ gap: 10 }}>
      <EditorFrame file={phase.checkpoint.filename} trailing={<Text style={[body(12, true), { color: C.lilac }]}>read only</Text>}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8 }}>
          <View>{(q.code ?? []).map((l, i) => <RCodeLine key={i} text={l} number={i + 1} size={14} />)}</View>
        </ScrollView>
      </EditorFrame>
      <Card radius={20} shadow shadowColor={C.shadowDark} contentStyle={{ padding: 0 }}>
        <Text style={[monoBold(13), { color: C.cream, backgroundColor: C.navy, paddingHorizontal: 12, paddingVertical: 7 }]}>
          {`> source("${phase.checkpoint.filename}")`}<Text style={{ color: C.lime }}> # what prints?</Text>
        </Text>
        {(q.opts ?? []).map((o) => {
          const st = optionState(q, answer, o.id);
          return (
            <Pressable key={o.id} onPress={() => !answer.checked && view.onPick(o.id)} accessibilityRole="button" accessibilityState={{ selected: answer.pick === o.id }} style={{ minHeight: 46, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: st.fill, opacity: st.op, borderTopWidth: 1.5, borderTopColor: C.locked }}>
              <Text style={[monoBold(15), { color: C.lilac }]}>{'>'}</Text>
              <Text style={[monoBold(15), { flex: 1 }]}>{o.label}</Text>
              {st.ok && <CheckIcon size={15} strokeWidth={3} />}
              {st.x && <CrossIcon size={15} />}
            </Pressable>
          );
        })}
      </Card>
    </View>
  );
}
