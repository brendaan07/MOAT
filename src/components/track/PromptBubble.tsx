// The question bubble, with the hint bulb in its corner and the hint card it opens.
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { BORDER, C, body, heading } from '../../utils/theme';
import { Card } from '../ui';

const BulbIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={C.navy} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M9 18h6" />
    <Path d="M10 22h4" />
    <Path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.7A7 7 0 0 0 12 2z" />
  </Svg>
);

export function PromptBubble({
  sub,
  title,
  hint,
  tag,
  tagColor = C.sun,
  darkShadow = false,
  hintOpen,
  onToggleHint,
}: {
  sub: string;
  title: string;
  hint: string;
  tag?: string;
  tagColor?: string;
  darkShadow?: boolean;
  hintOpen: boolean;
  onToggleHint: () => void;
}) {
  const pop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(pop, { toValue: hintOpen ? 1 : 0, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [hintOpen]); // eslint-disable-line react-hooks/exhaustive-deps
  const radius = { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomRightRadius: 20, borderBottomLeftRadius: 6 };
  return (
    <View style={{ flex: 1, zIndex: 3 }}>
      <View style={[StyleSheet.absoluteFill, radius, { top: 3, bottom: -3, backgroundColor: darkShadow ? C.shadowDark : C.navy }]} />
      <View style={[radius, { backgroundColor: C.card, borderWidth: BORDER, borderColor: C.navy, paddingLeft: 14, paddingRight: 50, paddingVertical: 12 }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {tag ? (
            <View style={{ paddingHorizontal: 7, paddingVertical: 1, borderRadius: 7, backgroundColor: tagColor, borderWidth: 1.5, borderColor: C.navy }}>
              <Text style={body(13, true)} numberOfLines={1}>{tag}</Text>
            </View>
          ) : null}
          <Text style={[body(14, true), { color: C.muted }]}>{sub}</Text>
        </View>
        <Text style={[heading(22), { marginTop: 3 }]} accessibilityRole="header">{title}</Text>
      </View>
      <Pressable onPress={onToggleHint} accessibilityRole="button" accessibilityLabel={hintOpen ? 'Hide hint' : 'Show hint'} style={{ position: 'absolute', right: 4, top: 4, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 34, height: 34 }}>
          <View style={{ position: 'absolute', left: 0, right: 0, top: 2, height: 34, borderRadius: 17, backgroundColor: C.navy }} />
          <View style={{ width: 34, height: 34, borderRadius: 17, borderWidth: BORDER, borderColor: C.navy, backgroundColor: hintOpen ? C.orange : C.sun, alignItems: 'center', justifyContent: 'center' }}>
            <BulbIcon />
          </View>
        </View>
      </Pressable>
      {hintOpen && (
        <Animated.View style={{ position: 'absolute', right: 0, top: 52, width: 240, zIndex: 5, opacity: pop, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) }] }}>
          <Card fill={C.hintBlue} radius={16} shadow contentStyle={{ paddingHorizontal: 14, paddingVertical: 11 }}>
            <Text style={body(15)} accessibilityRole="text">{hint}</Text>
          </Card>
        </Animated.View>
      )}
    </View>
  );
}
