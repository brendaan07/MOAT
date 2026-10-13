// Checkpoint "Plan it": put the steps of a plan in order along a dashed path, from Start to Result.
import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BORDER, C, body, heading } from '../../../utils/theme';
import { TrackPhase, labelOf } from '../../../types/models';
import { Card } from '../../../components/ui';
import { positionOK } from '../trackQuestionLogic';
import { Arrows, QuestionView } from './parts';

export function PlanQuestion({ view, phase }: { view: QuestionView; phase: TrackPhase }) {
  const { q, answer } = view;
  return (
    <View style={{ gap: 10 }}>
      <Card fill={C.hintBlue} radius={20} shadow shadowColor={C.shadowDark} contentStyle={{ paddingHorizontal: 14, paddingVertical: 9 }}>
        <Text style={[body(13, true), { color: C.muted }]}>The problem</Text>
        <Text style={body(15)}>{q.task ?? phase.checkpoint.problem}</Text>
      </Card>
      <View>
        <View style={{ position: 'absolute', left: 17, top: 16, bottom: 16, width: 4, borderLeftWidth: 4, borderStyle: 'dashed', borderColor: C.sun }} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <View style={{ width: 38, alignItems: 'center' }}><View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: C.sun, borderWidth: 2.5, borderColor: C.cream }} /></View>
          <Text style={[body(13, true), { color: C.sun }]}>Start</Text>
        </View>
        <View style={{ gap: 8 }}>
          {answer.order.map((id, i) => (
            <View key={id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: C.sun, borderWidth: BORDER, borderColor: C.navy, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={heading(17)}>{i + 1}</Text>
              </View>
              <Card fill={answer.checked ? (positionOK(q, i, id) ? C.successSheet : C.peach) : C.card} radius={16} shadow shadowColor={C.shadowDark} style={{ flex: 1 }} contentStyle={{ minHeight: 50, paddingLeft: 12, flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[body(15, true), { flex: 1 }]}>{labelOf(q, id)}</Text>
                <Arrows view={view} index={i} color={C.navy} />
              </Card>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 }}>
          <View style={{ width: 38, alignItems: 'center' }}><Ionicons name="flag" size={16} color={C.lime} /></View>
          <Text style={[body(13, true), { color: C.lime }]}>Result</Text>
        </View>
      </View>
    </View>
  );
}
