// The lesson's note panels, chips and the person's message.
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BORDER, C, body, monoBold } from '../../utils/theme';
import { Enter } from './animations';

/** Text with `code` between backticks shown as dark code chips. */
export function NoteText({ text, size = 15, bold = false }: { text: string; size?: number; bold?: boolean }) {
  const parts = text.split('`');
  return (
    <Text style={[body(size, bold), { lineHeight: size * 1.42 }]}>
      {parts.map((p, i) =>
        i % 2 ? (
          <Text key={i} style={[monoBold(size - 1.5), { backgroundColor: C.screen, color: C.cream }]}>
            {` ${p} `}
          </Text>
        ) : (
          <Text key={i}>{p}</Text>
        ),
      )}
    </Text>
  );
}

/** A note that drops open under the picture or the code (the science or what the code does). */
export function Panel({ title, text, icon, fill, onClose }: { title: string; text: string; icon: keyof typeof Ionicons.glyphMap | 'code'; fill: string; onClose: () => void }) {
  return (
    <Enter kind="drop" style={{ marginTop: 8 }}>
      <View
        style={{ borderRadius: 20, borderWidth: BORDER, borderColor: C.navy, backgroundColor: fill, paddingHorizontal: 14, paddingTop: 6, paddingBottom: 14, shadowColor: C.navy, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 1, shadowRadius: 0 }}
        accessibilityViewIsModal={false}
        onAccessibilityEscape={onClose}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name={icon === 'code' ? 'code-slash' : icon} size={17} color={C.navy} />
          <View style={{ flex: 1 }}>
            <NoteText text={title} size={17} bold />
          </View>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -8 }}>
            <Ionicons name="close" size={22} color={C.navy} />
          </Pressable>
        </View>
        <NoteText text={text} />
      </View>
    </Enter>
  );
}

/** A small label chip on the picture or code box. */
export function Chip({ label, dark = false, icon = 'flask-outline' }: { label: string; dark?: boolean; icon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 9, backgroundColor: dark ? '#E9ECFF' : C.hintBlue, borderWidth: dark ? 0 : 2, borderColor: C.navy }}>
      <Ionicons name={dark ? 'code-slash' : icon} size={13} color={C.navy} />
      <Text style={body(12, true)}>{label}</Text>
    </View>
  );
}

/** The lesson's person speaking on the goal screen. */
export function Message({ who, text }: { who: string; text: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
      <View style={{ width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: C.navy, backgroundColor: C.hintBlue, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="person-outline" size={18} color={C.navy} />
      </View>
      <View style={{ flex: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, borderTopLeftRadius: 4, borderWidth: 2, borderColor: C.navy, backgroundColor: C.card }}>
        <Text style={[body(12, true), { color: C.muted }]}>{who}</Text>
        <Text style={[body(14, true), { lineHeight: 18 }]}>{text}</Text>
      </View>
    </View>
  );
}
