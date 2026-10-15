// Pieces shared by the track question layouts: the tappable code pieces, a line to tap in a bug hunt, up/down arrows and the dark editor frame.
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BORDER, C, monoBold } from '../../../utils/theme';
import { TrackQuestion, correctOne, labelOf } from '../../../types/models';
import { Card } from '../../../components/ui';
import { QState } from '../trackQuestionLogic';

/** The current question, what the learner has done on it, and the ways they can change it. */
export interface QuestionView {
  q: TrackQuestion;
  answer: QState;
  onPick: (id: string) => void;
  onToggleSeq: (id: string) => void;
  onMove: (index: number, direction: number) => void;
}

/** The pieces a "build" question is assembled from. */
export function Pieces({ view, dark }: { view: QuestionView; dark: boolean }) {
  const { q, answer } = view;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {(q.opts ?? []).map((o) => {
        const used = answer.seq.includes(o.id);
        return (
          <Pressable key={o.id} onPress={() => view.onToggleSeq(o.id)} accessibilityRole="button" accessibilityState={{ selected: used }}>
            <Card fill={used ? C.locked : C.card} radius={14} shadow shadowColor={dark ? C.shadowDark : C.navy} style={{ opacity: used ? 0.55 : 1 }} contentStyle={{ minWidth: 46, minHeight: dark ? 44 : 46, paddingHorizontal: 14, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={monoBold(16)}>{o.label}</Text>
            </Card>
          </Pressable>
        );
      })}
    </View>
  );
}

/** One numbered line of code the learner can tap as the bug. */
export function BugLine({ view, index, line, magnifier = false }: { view: QuestionView; index: number; line: { id: string; label: string }; magnifier?: boolean }) {
  const { q, answer } = view;
  const picked = answer.pick === line.id;
  let bg = 'transparent', fg = C.cream, edge = 'transparent';
  if (answer.checked) {
    if (line.id === correctOne(q)) { bg = C.lime; fg = C.navy; edge = C.lime; }
    else if (picked) { bg = C.peach; fg = C.navy; edge = C.peach; }
  } else if (picked) { bg = 'rgba(181,224,74,0.22)'; edge = C.lime; }
  return (
    <Pressable onPress={() => !answer.checked && view.onPick(line.id)} accessibilityRole="button" accessibilityState={{ selected: picked }} style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 8, borderRadius: 12, borderWidth: 2, borderColor: edge, backgroundColor: bg }}>
      <Text style={[monoBold(13), { color: fg, opacity: 0.6, width: 18, textAlign: 'right' }]}>{index + 1}</Text>
      <Text style={[monoBold(15), { color: fg, flex: 1 }]}>{line.label}</Text>
      {magnifier && <Ionicons name="search" size={14} color={fg} style={{ opacity: 0.7 }} />}
    </Pressable>
  );
}

/** Move-up and move-down buttons for one row of an "order" question. */
export function Arrows({ view, index, color }: { view: QuestionView; index: number; color: string }) {
  const { q, answer } = view;
  return (
    <View style={{ flexDirection: 'row' }}>
      {[-1, 1].map((d) => (
        <Pressable key={d} onPress={() => view.onMove(index, d)} accessibilityRole="button" accessibilityLabel={`${d < 0 ? 'Move up' : 'Move down'}: ${labelOf(q, answer.order[index])}`} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', opacity: answer.checked || (d < 0 && index === 0) || (d > 0 && index === answer.order.length - 1) ? 0.3 : 1 }}>
          <Ionicons name={d < 0 ? 'chevron-up' : 'chevron-down'} size={18} color={color} />
        </Pressable>
      ))}
    </View>
  );
}

/** A dark code-editor window with a file name and something on the right of its title bar. */
export function EditorFrame({ file, trailing, children }: { file: string; trailing: React.ReactNode; children: React.ReactNode }) {
  return (
    <View>
      <View style={{ position: 'absolute', left: 0, right: 0, top: 4, bottom: -4, borderRadius: 18, backgroundColor: '#050828' }} />
      <View style={{ borderRadius: 18, borderWidth: BORDER, borderColor: C.sky, backgroundColor: C.editor, overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderBottomWidth: 1.5, borderBottomColor: 'rgba(255,255,255,0.12)' }}>
          {[C.orange, C.sun, C.lime].map((c) => <View key={c} style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c }} />)}
          <Text style={[monoBold(13), { color: C.lavender, marginLeft: 6, flex: 1 }]}>{file}</Text>
          {trailing}
        </View>
        {children}
      </View>
    </View>
  );
}
