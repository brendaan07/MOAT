// The 44pt close (or back) button in the top corner of lesson and result screens.
import React from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../utils/theme';

/** A ✕ (or a back chevron) with a 44pt tap area and a spoken label. */
export function CloseButton({ onPress, label, color = C.navy, size = 24, icon = 'close', style }: {
  onPress: () => void;
  /** Spoken by screen readers, for example "Quit lesson". */
  label: string;
  color?: string;
  size?: number;
  icon?: 'close' | 'chevron-back';
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={[{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Ionicons name={icon} size={size} color={color} />
    </Pressable>
  );
}
