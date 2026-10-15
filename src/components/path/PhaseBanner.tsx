// The banner above each phase on a path screen: name, how far through it, or what it takes to open it.
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C, body, heading } from '../../utils/theme';
import { Card } from '../ui';

export function PhaseBanner({ unlocked, eyebrow, title, progressLabel, lockedLabel, lockedIcon, onPress, accessibilityLabel }: {
  unlocked: boolean;
  /** Small line above the title, e.g. "Phase 2". */
  eyebrow: string;
  title: string;
  /** "3 of 5", shown on the blue pill when the phase is open. */
  progressLabel: string;
  /** Shown on the orange pill when the phase is locked. */
  lockedLabel: string;
  lockedIcon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel} style={{ paddingHorizontal: 16, paddingVertical: 14, backgroundColor: unlocked ? 'transparent' : C.lockedOverlay }}>
      <Card fill={unlocked ? C.cream : C.premiumBand} radius={20} shadow contentStyle={{ minHeight: 64, paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ flex: 1 }}>
          <Text style={[body(13, true), { color: unlocked ? C.muted : C.premiumText }]}>{eyebrow}</Text>
          <Text style={[heading(20), { color: unlocked ? C.navy : C.cream }]} numberOfLines={1}>{title}</Text>
        </View>
        {unlocked ? (
          <View style={{ height: 30, paddingHorizontal: 12, borderRadius: 15, backgroundColor: C.sky, borderWidth: 2, borderColor: C.navy, justifyContent: 'center' }}>
            <Text style={body(13, true)}>{progressLabel}</Text>
          </View>
        ) : (
          <View style={{ height: 30, paddingHorizontal: 10, borderRadius: 15, backgroundColor: C.orange, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name={lockedIcon} size={14} color={C.navy} />
            <Text style={body(13, true)}>{lockedLabel}</Text>
          </View>
        )}
      </Card>
    </Pressable>
  );
}
