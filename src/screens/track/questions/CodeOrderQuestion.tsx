// Checkpoint "Order the code": arrange the lines of a script in the editor so it runs top to bottom.
import React from 'react';
import { Text, View } from 'react-native';
import { C, body, monoBold } from '../../../utils/theme';
import { TrackPhase, labelOf } from '../../../types/models';
import { positionOK } from '../trackQuestionLogic';
import { Arrows, EditorFrame, QuestionView } from './parts';

export function CodeOrderQuestion({ view, phase }: { view: QuestionView; phase: TrackPhase }) {
  const { q, answer } = view;
  return (
    <View style={{ gap: 10 }}>
      <EditorFrame
        file={phase.checkpoint.filename}
        trailing={<View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, backgroundColor: C.lime }}><Text style={monoBold(12)}>Goal: {q.goal}</Text></View>}
      >
        <View style={{ paddingVertical: 4 }}>
          {answer.order.map((id, i) => (
            <View key={id} style={{ flexDirection: 'row', alignItems: 'center', minHeight: 44, backgroundColor: answer.checked ? (positionOK(q, i, id) ? 'rgba(181,224,74,0.28)' : 'rgba(255,138,61,0.34)') : 'transparent' }}>
              <Text style={[monoBold(13), { color: C.lilac, width: 30, textAlign: 'right' }]}>{i + 1}</Text>
              <Text style={[monoBold(14), { color: C.cream, paddingLeft: 12, flex: 1 }]}>{labelOf(q, id)}</Text>
              <Arrows view={view} index={i} color={C.cream} />
            </View>
          ))}
        </View>
      </EditorFrame>
      <Text style={[body(14), { color: C.lavender }]}>R runs from top to bottom. A name has to exist before a line uses it.</Text>
    </View>
  );
}
