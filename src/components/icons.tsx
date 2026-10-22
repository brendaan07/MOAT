// Small drawn icons shared by the track screens: bolt, star, lock, tick and flame.
import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';
import { C } from '../utils/theme';

/** The bolt (the app's currency). */
export const BoltIcon = ({ size = 18, fill = C.sky, stroke = C.navy, strokeWidth = 1.6 }: { size?: number; fill?: string; stroke?: string; strokeWidth?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M13 2L4 14h7l-1 8 9-12h-7z" fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />
  </Svg>
);
/** A small spark that flies off the bolt counter. */
export const ZapIcon = ({ fill, rotate }: { fill: string; rotate: number }) => (
  <Svg width={16} height={18} viewBox="0 0 16 18">
    <Path d="M9.5 1 L3.5 9.5 H7.5 L5.5 17 L12.5 7.5 H8.5 Z" fill={fill} stroke={C.navy} strokeWidth={1.4} strokeLinejoin="round" transform={`rotate(${rotate} 8 9)`} />
  </Svg>
);
const STAR = 'M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.2 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z';
/** A star. */
export const StarIcon = ({ size = 15, fill = C.sun, stroke = C.navy, strokeWidth = 1.6 }: { size?: number; fill?: string; stroke?: string; strokeWidth?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d={STAR} fill={fill} stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" />
  </Svg>
);
/** The four-point glint on a shimmering star. */
export const Sparkle = ({ size }: { size: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M12 0 L15.4 8.6 L24 12 L15.4 15.4 L12 24 L8.6 15.4 L0 12 L8.6 8.6 Z" fill="#FFFFFF" />
  </Svg>
);
/** A padlock, for locked phases and checkpoints. */
export const LockIcon = ({ color = C.lockedText, size = 15 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Rect x="5" y="11" width="14" height="10" rx="2" fill="none" stroke={color} strokeWidth={2.6} />
    <Path d="M8 11V7a4 4 0 0 1 8 0v4" fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round" />
  </Svg>
);
/** A tick. */
export const CheckIcon = ({ size = 12, color = C.navy, strokeWidth = 4 }: { size?: number; color?: string; strokeWidth?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);
/** The streak flame. */
export const FlameIcon = ({ size = 22, fill = C.orange, stroke = C.orange }: { size?: number; fill?: string; stroke?: string }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24">
    <Path d="M12 2c1 4 5 5.5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z" fill={fill} stroke={stroke} strokeWidth={2} strokeLinejoin="round" />
  </Svg>
);
