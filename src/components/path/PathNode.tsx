// One stop on the climbing learning path: a round button on a zig-zag, bigger with the robot beside it when it is the current one.
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BORDER, C, heading } from '../../utils/theme';
import { BundleImage, Card } from '../ui';

/** The sideways offset of each step, repeating, which makes the path wiggle. */
const pathOffset = (step: number) => [0, 55, 0, -55][step % 4];

export function PathNode({ step, isCurrent, fill, icon, iconColor, phaseLocked, title, accessibilityLabel, onPress, robotName, onCurrentLayout, badge }: {
  step: number;
  isCurrent: boolean;
  fill: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  /** Dims the whole row when the phase it belongs to is locked. */
  phaseLocked: boolean;
  /** Shown in a card under the current node only. */
  title: string;
  accessibilityLabel: string;
  onPress: () => void;
  robotName: string;
  onCurrentLayout: (y: number) => void;
  /** Sits under the circle, e.g. the stars earned. */
  badge?: React.ReactNode;
}) {
  const x = pathOffset(step);
  const size = isCurrent ? 88 : 64;
  return (
    <View onLayout={isCurrent ? (e) => onCurrentLayout(e.nativeEvent.layout.y) : undefined} style={{ height: isCurrent ? 170 : 96, alignItems: 'center', justifyContent: 'center' }}>
      {phaseLocked && <View pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: C.lockedOverlay }} />}
      <View style={{ alignItems: 'center', gap: 8, transform: [{ translateX: x }] }}>
        <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel}>
          <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            {isCurrent && <View style={{ position: 'absolute', width: size + 20, height: size + 20, borderRadius: (size + 20) / 2, borderWidth: 3, borderColor: C.cream }} />}
            <View style={{ position: 'absolute', top: 4, width: size, height: size, borderRadius: size / 2, backgroundColor: C.navy }} />
            <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: fill, borderWidth: BORDER, borderColor: C.navy, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={icon} size={isCurrent ? 32 : 24} color={iconColor} />
            </View>
            {badge}
          </View>
        </Pressable>
        {isCurrent && (
          <Card radius={16} shadow contentStyle={{ paddingHorizontal: 14, paddingVertical: 6 }}>
            <Text style={heading(16)}>{title}</Text>
          </Card>
        )}
      </View>
      {isCurrent && <BundleImage name={robotName} style={{ position: 'absolute', width: 96, height: 112, transform: [{ translateX: x > 0 ? -110 : 110 }] }} />}
    </View>
  );
}
