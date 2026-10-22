import React, { useState } from 'react';
import { Image, ImageResizeMode, ImageStyle, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, Pattern, Rect } from 'react-native-svg';
import { BORDER, C, heading } from '../utils/theme';
import { IMAGES } from '../utils/images';

/** Card look: fill, navy outline, optional hard shadow 3pt below (CardStyle in Theme.swift). */
export function Card({
  fill = C.card,
  radius = 16,
  shadow = false,
  shadowColor = C.navy,
  shadowOffset = 3,
  borderColor = C.navy,
  borderWidth = BORDER,
  style,
  contentStyle,
  children,
}: {
  fill?: string;
  radius?: number;
  shadow?: boolean;
  shadowColor?: string;
  shadowOffset?: number;
  borderColor?: string;
  borderWidth?: number;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}) {
  return (
    <View style={[{ borderRadius: radius }, style]}>
      {shadow && (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { top: shadowOffset, bottom: -shadowOffset, backgroundColor: shadowColor, borderRadius: radius }]} />
      )}
      <View style={[{ backgroundColor: fill, borderRadius: radius, borderWidth, borderColor, overflow: 'hidden' }, contentStyle]}>{children}</View>
    </View>
  );
}

/** The thick-outline button used across the app (ChunkyButtonStyle). */
export function ChunkyButton({
  title,
  onPress,
  fill = C.lime,
  enabled = true,
  style,
  children,
  accessibilityLabel,
}: {
  title?: string;
  onPress?: () => void;
  fill?: string;
  enabled?: boolean;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  accessibilityLabel?: string;
}) {
  const [pressed, setPressed] = useState(false);
  const edge = enabled ? C.navy : C.lockedEdge;
  const down = pressed && enabled;
  return (
    <Pressable
      onPress={enabled ? onPress : undefined}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={!enabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !enabled }}
      accessibilityLabel={accessibilityLabel ?? title}
      style={[{ height: 60, alignSelf: 'stretch' }, style]}
    >
      <View style={{ position: 'absolute', left: 0, right: 0, top: 4, height: 56, borderRadius: 18, backgroundColor: edge }} />
      <View
        style={{
          height: 56,
          borderRadius: 18,
          borderWidth: BORDER,
          borderColor: edge,
          backgroundColor: enabled ? fill : C.locked,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 12,
          transform: [{ translateY: down ? 4 : 0 }],
        }}
      >
        {children ?? <Text style={[heading(20), { color: enabled ? C.navy : C.lockedText }]}>{title}</Text>}
      </View>
    </Pressable>
  );
}

/** Finds a bundled picture: the new "_updated" version first, then the original name (BundleImage). */
function imageSource(name: string): number | undefined {
  return IMAGES[name + '_updated'] ?? IMAGES[name];
}

export function BundleImage({ name, style, resizeMode = 'contain' }: { name: string; style?: StyleProp<ImageStyle>; resizeMode?: ImageResizeMode }) {
  const src = imageSource(name);
  if (!src) return <View style={style as StyleProp<ViewStyle>} />;
  return <Image source={src} style={style} resizeMode={resizeMode} accessibilityIgnoresInvertColors />;
}

/** A picture that fills the screen behind other content and never blocks touches.
 *  It gets an exact size from the window: without one, iOS draws it at its natural pixel size, which looks zoomed in. */
export function FullScreenPicture({ name }: { name: string }) {
  const { width, height } = useWindowDimensions();
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <BundleImage name={name} resizeMode="cover" style={{ position: 'absolute', left: 0, top: 0, width, height }} />
    </View>
  );
}

/** The cream background with the faint dot grid used on the design canvas. */
export function DottedBackground({ navy = false }: { navy?: boolean }) {
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: navy ? C.navyDeep : C.cream }]}>
      <Svg width="100%" height="100%">
        <Defs>
          <Pattern id="dots" width="18" height="18" patternUnits="userSpaceOnUse">
            <Circle cx="9" cy="9" r="1.15" fill={navy ? 'rgba(255,255,255,0.07)' : 'rgba(27,36,114,0.08)'} />
          </Pattern>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#dots)" />
      </Svg>
    </View>
  );
}
