// The week's seven days with the streak's days ticked and today's flame.
import React from 'react';
import { Text, View } from 'react-native';
import { CheckIcon, FlameIcon } from '../icons';
import { BORDER, C, body } from '../../utils/theme';

/** Monday to Sunday, with the streak's days ticked and today's flame. */
export function WeekStrip({ streak, activeToday, dark = true }: { streak: number; activeToday: boolean; dark?: boolean }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  const letters = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }} accessible accessibilityLabel={`${streak} day streak this week`}>
      {letters.map((l, i) => {
        const day = new Date(monday);
        day.setDate(monday.getDate() + i);
        const back = Math.round((today.getTime() - day.getTime()) / 86400000);
        const isToday = back === 0;
        const done = back >= (activeToday ? 0 : 1) && back < streak + (activeToday ? 0 : 1);
        return (
          <View key={i} style={{ alignItems: 'center', gap: 4 }}>
            <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: isToday ? C.orange : done ? C.lime : dark ? 'rgba(255,255,255,0.1)' : C.locked, borderWidth: BORDER, borderColor: isToday || done ? C.navy : dark ? C.lilac : C.lockedEdge, borderStyle: isToday || done ? 'solid' : 'dashed' }}>
              {isToday ? <FlameIcon size={16} fill={C.cream} stroke={C.navy} /> : done ? <CheckIcon size={14} /> : null}
            </View>
            <Text style={[body(14, true), { color: dark ? C.lavender : C.muted }]}>{l}</Text>
          </View>
        );
      })}
    </View>
  );
}
