// Checkpoint "Build it": finish a report by assembling its last line from pieces.
import React from 'react';
import { Text, View } from 'react-native';
import { C, body, heading, monoBold } from '../../../utils/theme';
import { labelOf } from '../../../types/models';
import { Card } from '../../../components/ui';
import { DoneTick } from '../../../components/icons';
import { Pieces, QuestionView } from './parts';

export function BuildQuestion({ view }: { view: QuestionView }) {
  const { q, answer } = view;
  const goal = q.screen?.goal;
  return (
    <View style={{ gap: 10 }}>
      <Card radius={20} shadow shadowColor={C.shadowDark} contentStyle={{ paddingHorizontal: 14, paddingVertical: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={heading(18)}>{q.reportTitle ?? 'Report'}</Text>
          <View style={{ paddingHorizontal: 8, paddingVertical: 1, borderRadius: 8, backgroundColor: C.sun, borderWidth: 1.5, borderColor: C.navy }}><Text style={body(12, true)}>Last line</Text></View>
        </View>
        {(q.report ?? []).map((r, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 30, borderTopWidth: 1.5, borderTopColor: C.locked }}>
            <DoneTick />
            <Text style={body(14, true)}>{r[0]}</Text>
            <View style={{ flex: 1 }} />
            <Text style={monoBold(14)}>{r[1]}</Text>
          </View>
        ))}
        <View style={{ marginTop: 6, padding: 10, borderRadius: 12, backgroundColor: C.screen, gap: 4 }}>
          {(q.code ?? []).map((l, i) => <Text key={i} style={[monoBold(13), { color: C.lilac }]}>{l}</Text>)}
          <View style={{ minHeight: 32, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 6, borderRadius: 9, borderWidth: 2, borderStyle: 'dashed', borderColor: C.lime, flexWrap: 'wrap' }}>
            {answer.seq.length === 0 ? (
              <Text style={[body(13), { color: C.lavender }]}>{q.slot ?? 'Last line'}: tap pieces below</Text>
            ) : (
              answer.seq.map((id, k) => (
                <View key={k} style={{ backgroundColor: C.lime, borderRadius: 7, paddingHorizontal: 6, height: 26, justifyContent: 'center' }}><Text style={monoBold(13)}>{labelOf(q, id)}</Text></View>
              ))
            )}
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
          <Text style={[body(13, true), { color: C.muted }]}>Goal</Text>
          <View style={{ paddingHorizontal: 8, paddingVertical: 1, borderRadius: 8, backgroundColor: C.screen }}><Text style={[monoBold(13), { color: C.lime }]}>{goal}</Text></View>
        </View>
      </Card>
      <View style={{ padding: 10, borderRadius: 18, borderWidth: 2.5, borderStyle: 'dashed', borderColor: C.sun, backgroundColor: 'rgba(255,201,60,0.08)' }}><Pieces view={view} dark /></View>
    </View>
  );
}
