// The 44pt close (or back) button used in the top corner of lesson and result screens.
import React from 'react';
import { Pressable, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../utils/theme';
//test

export function CloseButton({ onPress, label, color = C.navy, size = 24, icon = 'close', disabled, style }: {
  onPress: () => void;
  /** Spoken by screen readers, e.g. "Quit lesson". */
  label: string;
  color?: string;
  size?: number;
  icon?: 'close' | 'chevron-back';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button" accessibilityLabel={label} style={[{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Ionicons name={icon} size={size} color={color} />
    </Pressable>
  );
}
