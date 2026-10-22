// The lesson's lab notebook: one row per question, filled in on the recap.
import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BORDER, C, body, heading, monoBold } from '../../utils/theme';
import type { PlayerLesson } from '../../content/types';
import { Enter } from './animations';

/** The lab notebook: empty slots on the goal screen, the answers popping in on the recap. */
export function Notebook({ lesson, filled }: { lesson: PlayerLesson; filled: boolean }) {
  return (
    <View style={{ borderRadius: 20, borderWidth: BORDER, borderColor: C.navy, backgroundColor: C.card, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <Ionicons name="book-outline" size={18} color={C.navy} />
        <Text style={heading(19)} accessibilityRole="header">Your lab notebook</Text>
      </View>
      {lesson.notebook.map(([lab, val], k) => (
        <Enter key={k} kind="rowIn" delay={150 + 80 * k}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 40, borderTopWidth: 1.5, borderTopColor: C.locked }}>
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: filled ? C.navy : C.locked, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={[body(13, true), { color: filled ? C.cream : C.navy }]}>{k + 1}</Text>
            </View>
            <Text style={[body(15, true), { flex: 1 }]}>{lab}</Text>
            {filled ? (
              <Enter kind="snap" delay={500 + 150 * k}>
                <Text numberOfLines={1} style={[body(14, true), { maxWidth: 170, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 2, borderColor: C.navy, backgroundColor: C.successSheet, overflow: 'hidden' }]}>{val}</Text>
              </Enter>
            ) : (
              <View style={{ width: 44, height: 26, borderRadius: 8, borderWidth: 2, borderStyle: 'dashed', borderColor: C.lockedEdge, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={[monoBold(14), { color: '#B8AE95' }]}>?</Text>
              </View>
            )}
          </View>
        </Enter>
      ))}
    </View>
  );
}
