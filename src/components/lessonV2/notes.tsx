// Text with `code` chips, the tap-to-open note panel under a picture or code box, and the small field chip.
import React from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BORDER, C, body, monoBold } from '../../utils/theme';
import { Enter } from './animations';
import { CloseButton } from '../CloseButton';

/** Text with `code` between backticks shown as dark code chips. */
function NoteText({ text, size = 15, bold = false }: { text: string; size?: number; bold?: boolean }) {
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

/** The note that drops down under a picture or code box when it is tapped. */
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
          <CloseButton onPress={onClose} label="Close" size={22} style={{ marginRight: -8 }} />
        </View>
        <NoteText text={text} />
      </View>
    </Enter>
  );
}

/** A small label such as "Biology" or "What it does". */
export function Chip({ label, dark = false, icon = 'flask-outline' }: { label: string; dark?: boolean; icon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 9, backgroundColor: dark ? '#E9ECFF' : C.hintBlue, borderWidth: dark ? 0 : 2, borderColor: C.navy }}>
      <Ionicons name={dark ? 'code-slash' : icon} size={13} color={C.navy} />
      <Text style={body(12, true)}>{label}</Text>
    </View>
  );
}
