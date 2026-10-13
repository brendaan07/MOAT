// The recap after a new-style lesson: the filled lab notebook and the whole script the learner wrote, line by line.
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from '../../../components/SafeAreaView';
import { ChunkyButton, DottedBackground } from '../../../components/ui';
import { RobotFace } from '../../../components/track/RobotFace';
import { Enter } from '../../../components/lessonV2/animations';
import { CodeLine } from '../../../components/lessonV2/CodeBox';
import { Notebook } from '../../../components/lessonV2/Notebook';
import { Segments } from '../../../components/lessonV2/QuestionBar';
import type { V2Lesson } from '../../../components/lessonV2/types';
import { BORDER, C, body, heading, monoBold } from '../../../utils/theme';
import { useAppStore } from '../../../hooks/useAppStore';

/** The recap: the filled notebook and a collapsible copy of the finished script. */
export function LessonRecapV2({ lesson, onContinue }: { lesson: V2Lesson; onContinue: () => void }) {
  const form = useAppStore().progress.currentForm;
  const [open, setOpen] = useState(false);
  return (
    <View style={{ flex: 1, backgroundColor: C.cream }}>
      <DottedBackground />
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 60, paddingRight: 16, height: 44 }}>
          <Segments done={5} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 110 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Enter kind="pop">
              <RobotFace form={form} mood="hearts" width={84} height={84} />
            </Enter>
            <View style={{ flex: 1 }}>
              <Enter kind="head" delay={80}>
                <Text style={[heading(28), { lineHeight: 30 }]} accessibilityRole="header">{lesson.doneTitle}</Text>
              </Enter>
              <Text style={[body(15), { marginTop: 4 }]}>{lesson.doneSub}</Text>
            </View>
          </View>
          <Notebook lesson={lesson} filled />
          <View style={{ borderRadius: 16, borderWidth: BORDER, borderColor: C.navy, backgroundColor: C.screen, overflow: 'hidden' }}>
            <Pressable onPress={() => setOpen(!open)} accessibilityRole="button" accessibilityState={{ expanded: open }} style={{ minHeight: 52, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={[monoBold(14), { color: C.lavender }]}>{lesson.file}</Text>
              <Text style={[body(15, true), { color: C.cream, flex: 1 }]}>{lesson.script.length} lines you wrote</Text>
              <Text style={[body(13, true), { backgroundColor: '#E9ECFF', borderRadius: 9, paddingHorizontal: 9, paddingVertical: 2, overflow: 'hidden' }]}>{open ? 'Hide' : 'Show'}</Text>
            </Pressable>
            {open && (
              <Enter kind="drop" style={{ paddingHorizontal: 14, paddingBottom: 12, borderTopWidth: 1.5, borderTopColor: 'rgba(255,255,255,0.14)' }}>
                {lesson.script.map((l, i) => (
                  <CodeLine key={i} text={l} n={i + 1} size={13} py={lesson.lang === 'py'} />
                ))}
              </Enter>
            )}
          </View>
        </ScrollView>
        <View style={{ position: 'absolute', left: 16, right: 16, bottom: 30 }}>
          <ChunkyButton title="Continue" onPress={onContinue} />
        </View>
      </SafeAreaView>
    </View>
  );
}
