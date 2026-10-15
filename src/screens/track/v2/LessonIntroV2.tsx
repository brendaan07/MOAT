// The goal screen before a new-style lesson: who is asking, the empty lab notebook and what the script will be.
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from '../../../components/SafeAreaView';
import { ChunkyButton, DottedBackground } from '../../../components/ui';
import { RobotFace } from '../../../components/track/RobotFace';
import { Enter } from '../../../components/lessonV2/animations';
import { Notebook } from '../../../components/lessonV2/Notebook';
import { Message } from '../../../components/lessonV2/pictures/static';
import { Segments } from '../../../components/lessonV2/QuestionBar';
import type { V2Lesson } from '../../../components/lessonV2/types';
import { C, body, heading, monoBold } from '../../../utils/theme';
import { useAppStore } from '../../../hooks/useAppStore';
import { CloseButton } from '../../../components/CloseButton';

/** The goal screen: shows what the lesson will build before the first question. */
export function LessonIntroV2({ lesson, onStart, onClose }: { lesson: V2Lesson; onStart: () => void; onClose: () => void }) {
  const form = useAppStore().progress.currentForm;
  return (
    <View style={{ flex: 1, backgroundColor: C.cream }}>
      <DottedBackground />
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 8, paddingRight: 16, height: 44 }}>
          <CloseButton onPress={onClose} label="Back to Learn" size={26} />
          <Segments done={0} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 110 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Enter kind="pop">
              <RobotFace form={form} mood="excited" width={92} height={92} />
            </Enter>
            <View style={{ flex: 1 }}>
              <Text style={[body(14, true), { color: C.muted }]}>{lesson.project}, part {lesson.part} of 4</Text>
              <Enter kind="head" delay={80}>
                <Text style={[heading(32), { lineHeight: 34 }]} accessibilityRole="header">{lesson.title}</Text>
              </Enter>
            </View>
          </View>
          <Message who={lesson.person} text={lesson.intro} />
          <Notebook lesson={lesson} filled={false} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, backgroundColor: C.screen }}>
            <Text style={[monoBold(14), { color: C.lavender }]}>{lesson.file}</Text>
            <Text style={[body(14, true), { color: C.cream, flex: 1 }]}>One script, built line by line: {lesson.script.length} lines by the end</Text>
          </View>
        </ScrollView>
        <View style={{ position: 'absolute', left: 16, right: 16, bottom: 30 }}>
          <ChunkyButton title={lesson.start} onPress={onStart} />
        </View>
      </SafeAreaView>
    </View>
  );
}
