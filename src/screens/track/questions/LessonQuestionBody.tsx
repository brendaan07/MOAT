// A track lesson question on the light layout: the project card, the code (or the lines to tap) and the answer buttons.
import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { C, body, monoBold } from '../../../utils/theme';
import { TrackPhase, labelOf } from '../../../types/models';
import { Card } from '../../../components/ui';
import { CheckIcon, CrossIcon } from '../../../components/icons';
import { LiveOutput, ProjectCard } from '../../../components/track/ProjectCard';
import { RCodeLine } from '../../../components/track/RCodeLine';
import { optionState } from '../trackQuestionLogic';
import { BugLine, Pieces, QuestionView } from './parts';

export function LessonQuestionBody({ view, phase, part, live }: { view: QuestionView; phase: TrackPhase; part: number; live: LiveOutput }) {
  const { q, answer } = view;
  return (
    <>
      <ProjectCard phase={phase} part={part} live={live} />
      <Card fill={C.screen} radius={20} shadow contentStyle={{ paddingHorizontal: 14, paddingVertical: 10, gap: 6 }}>
        <Text style={[body(14, true), { color: C.lavender }]}>R</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ gap: q.kind === 'bug' ? 4 : 0 }}>
            {q.kind === 'bug'
              ? (q.lines ?? []).map((l, i) => <BugLine key={l.id} view={view} index={i} line={l} />)
              : (q.code ?? []).map((l, i) => <RCodeLine key={i} text={l} number={i + 1} blankFill={q.kind === 'fill' && answer.pick ? labelOf(q, answer.pick) : null} />)}
            {q.kind === 'build' && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 30 }}>
                <Text style={[monoBold(13), { color: C.lilac, width: 18, textAlign: 'right' }]}>{(q.code ?? []).length + 1}</Text>
                {answer.seq.length === 0 ? (
                  <Text style={[body(15), { color: C.lavender }]}>Tap pieces below</Text>
                ) : (
                  <View style={{ flexDirection: 'row', gap: 5 }}>
                    {answer.seq.map((id, k) => (
                      <View key={k} style={{ backgroundColor: C.lime, borderRadius: 8, paddingHorizontal: 7, height: 28, justifyContent: 'center' }}>
                        <Text style={monoBold(16)}>{labelOf(q, id)}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </Card>
      {(q.kind === 'fill' || q.kind === 'predict') && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {(q.opts ?? []).map((o) => {
            const st = optionState(q, answer, o.id);
            return (
              <Pressable key={o.id} style={{ width: '48%' }} onPress={() => !answer.checked && view.onPick(o.id)} accessibilityRole="button" accessibilityState={{ selected: answer.pick === o.id }}>
                <Card fill={st.fill} radius={16} shadow style={{ opacity: st.op }} contentStyle={{ minHeight: 54, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                  {st.ok && <CheckIcon size={15} strokeWidth={3} />}
                  {st.x && <CrossIcon size={15} />}
                  <Text style={[monoBold(16), { textAlign: 'center', flexShrink: 1 }]}>{o.label}</Text>
                </Card>
              </Pressable>
            );
          })}
        </View>
      )}
      {q.kind === 'build' && (
        <View style={{ gap: 8 }}>
          <Text style={[body(14), { color: C.muted }]}>Tap a piece to add it. Tap it again to take it out.</Text>
          <Pieces view={view} dark={false} />
        </View>
      )}
      {q.kind === 'bug' && <Text style={[body(15), { color: C.muted }]}>Tap the line that causes the error.</Text>}
    </>
  );
}
