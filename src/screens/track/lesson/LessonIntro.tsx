// A lesson's goal screen: who needs it, the notebook to fill and the script it builds.
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from '../../../components/SafeAreaView';
import { ChunkyButton, DottedBackground } from '../../../components/ui';
import { RobotFace } from '../../../components/track/RobotFace';
import { Enter } from '../../../components/lesson/animations';
import { Segments } from '../../../components/lesson/QuestionBar';
import { Message } from '../../../components/lesson/notes';
import { Notebook } from '../../../components/lesson/Notebook';
import { C, body, heading, monoBold } from '../../../utils/theme';
import type { PlayerLesson } from '../../../content/types';
import { CloseButton } from '../../../components/CloseButton';

/** A lesson's or checkpoint's goal screen before the first question. */
export function LessonIntro({ lesson, onStart, onClose }: { lesson: PlayerLesson; onStart: () => void; onClose: () => void }) {
  const cp = !!lesson.checkpoint;
  return (
    <View style={{ flex: 1, backgroundColor: cp ? C.screen : C.cream }}>
      {!cp && <DottedBackground />}
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 8, paddingRight: 16, height: 44 }}>
          <CloseButton onPress={onClose} label="Back to Learn" size={26} color={cp ? C.cream : C.navy} />
          <Segments done={0} total={lesson.questions.length} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 110 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Enter kind="pop">
              <RobotFace mood="excited" width={92} height={92} />
            </Enter>
            <View style={{ flex: 1 }}>
              <Text style={[body(14, true), { color: cp ? C.lavender : C.muted }]}>{cp ? `Checkpoint: ${lesson.questions.length} questions, no hints` : `${lesson.project}, part ${lesson.part} of ${lesson.parts ?? 4}`}</Text>
              <Enter kind="head" delay={80}>
                <Text style={[heading(cp ? 28 : 32), { lineHeight: cp ? 30 : 34, color: cp ? C.cream : C.navy }]} accessibilityRole="header">{lesson.title}</Text>
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
