// A matching question: each line on the left gets a partner from the chips below. The highlighted line takes the next partner tapped.
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Question } from '../../../types/models';
import { C, body, code } from '../../../utils/theme';
import { Card, FlowWrap, TokenChip } from '../../../components/ui';
import { Outcome } from './looks';

/** `pairs` maps a left-hand row to the index of its partner in `partners`. */
export function MatchQuestion({ q, partners, pairs, setPairs, activeRow, setActiveRow, outcome }: {
  q: Question;
  partners: string[];
  pairs: Record<number, number>;
  setPairs: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  activeRow: number | null;
  setActiveRow: (row: number | null) => void;
  outcome: Outcome;
}) {
  /** The row waiting for a partner: the one the learner re-opened, or else the first unmatched row. */
  const currentRow = (count: number) => (activeRow !== null && pairs[activeRow] === undefined ? activeRow : [...Array(count).keys()].find((i) => pairs[i] === undefined) ?? null);
  const current = outcome ? null : currentRow(q.options.length);
  return (
    <View style={{ gap: 14, marginTop: 8 }}>
      <View style={{ gap: 10 }}>
        {q.options.map((text, row) => {
          const partner = pairs[row] !== undefined ? partners[pairs[row]] : null;
          const rl = outcome ? (pairs[row] !== undefined && partners[pairs[row]] === q.answer[row] ? 'correct' : 'wrong') : row === current ? 'active' : partner ? 'paired' : 'normal';
          const f = { normal: C.card, active: 'rgba(89,180,255,0.45)', paired: C.hintBlue, correct: C.lime, wrong: C.wrongChip }[rl];
          return (
            <Pressable key={row} onPress={() => { if (outcome) return; setPairs((pp) => { const n = { ...pp }; delete n[row]; return n; }); setActiveRow(row); }} accessibilityLabel={`${text}, matched with ${partner ?? 'nothing yet'}`}>
              <Card fill={f} radius={14} shadow contentStyle={{ paddingHorizontal: 14, paddingVertical: 10, minHeight: 64, gap: 6 }}>
                <Text style={code(17)}>{text}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="arrow-forward" size={13} color={partner ? C.navy : C.muted} />
                  <Text style={[code(15), { color: partner ? C.navy : C.muted }]}>{partner ?? 'pick a partner'}</Text>
                </View>
              </Card>
            </Pressable>
          );
        })}
      </View>
      <Text style={[body(14), { color: C.muted, textAlign: 'center' }]}>Pick a partner for the highlighted line. Tap a matched line to change it.</Text>
      <FlowWrap spacing={10}>
        {partners.map((t, j) => {
          const used = Object.values(pairs).includes(j);
          return (
            <Pressable key={j} disabled={used} onPress={() => { const r = currentRow(q.options.length); if (outcome || r === null) return; setPairs((pp) => ({ ...pp, [r]: j })); setActiveRow(null); }}>
              <TokenChip text={t} look={used ? 'used' : 'normal'} />
            </Pressable>
          );
        })}
      </FlowWrap>
    </View>
  );
}
