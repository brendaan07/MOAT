// Small SVG icons shared by the whole app: bolt, star, lock, check, cross, flame and the lime done tick.
import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { C } from '../utils/theme';

export const BoltIcon = ({ size = 18, fill = C.sky, stroke = C.navy, strokeWidth = 1.6 }: { size?: number; fill?: string; stroke?: string; strokeWidth?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M13 2L4 14h7l-1 8 9-12h-7z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />
  </Svg>
);

const STAR = 'M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.2 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z';
export const StarIcon = ({ size = 15, fill = C.sun, stroke = C.navy, strokeWidth = 1.6 }: { size?: number; fill?: string; stroke?: string; strokeWidth?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d={STAR} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />
  </Svg>
);

export const LockIcon = ({ color = C.lockedText, size = 15 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect x="5" y="11" width="14" height="10" rx="2" fill="none" stroke={color} strokeWidth={2.6} />
    <Path d="M8 11V7a4 4 0 0 1 8 0v4" fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round" />
  </Svg>
);
export const CheckIcon = ({ size = 12, color = C.navy, strokeWidth = 4 }: { size?: number; color?: string; strokeWidth?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
export const CrossIcon = ({ size = 18, color = C.navy, strokeWidth = 3 }: { size?: number; color?: string; strokeWidth?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M6 6l12 12M18 6L6 18" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" />
  </Svg>
);
export const FlameIcon = ({ size = 22, fill = C.orange, stroke = C.orange }: { size?: number; fill?: string; stroke?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M12 2c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z" fill={fill} stroke={stroke} strokeWidth={2} strokeLinejoin="round" />
  </Svg>
);

export function DoneTick({ size = 20 }: { size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: C.lime, borderWidth: 2, borderColor: C.navy, alignItems: 'center', justifyContent: 'center' }}>
      <CheckIcon size={size * 0.55} />
    </View>
  );
}
