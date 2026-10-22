import React, { useState } from 'react';
import { View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTrackStore } from '../../hooks/useTrackStore_updated';
import { RunResult, TrackLesson } from '../../types/models';
import { LessonIntroV2, LessonPlayerV2, LessonRecapV2, v2Lesson } from '../../components/lessonKitV2_updated';
import { CheckpointResult, ProjectBuilt, TrackLessonComplete } from './TrackResults';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type Step =
  | { kind: 'intro'; lesson: TrackLesson }
  | { kind: 'player'; lesson: TrackLesson }
  | { kind: 'recap'; lesson: TrackLesson; result: RunResult }
  | { kind: 'lessonDone'; lesson: TrackLesson; result: RunResult }
  | { kind: 'projectBuilt' }
  | { kind: 'checkpointIntro' }
  | { kind: 'checkpoint' }
  | { kind: 'checkpointDone'; result: RunResult };

type Props = NativeStackScreenProps<RootStackParamList, 'TrackFlow'>;

/** One lesson or checkpoint run: intro → player → recap → lesson done → (project built) → checkpoint intro →
 *  checkpoint → checkpoint result (TrackFlowView). */
export default function TrackFlowScreen({ route, navigation }: Props) {
  const track = useTrackStore();
  const phase = track.track?.phases.find((p) => p.number === route.params.phase);
  const startLesson = phase?.lessons.find((l) => l.id === route.params.lessonId) ?? null;
  // Checked once on open, since finishing a lesson here changes what is unlocked. A typed URL to a locked or unknown item closes the screen.
  const [allowed] = useState(() => !!phase && (startLesson ? track.lessonUnlocked(startLesson, phase) : !route.params.lessonId && track.checkpointUnlocked(phase)));
  const [step, setStep] = useState<Step>(startLesson ? { kind: 'intro', lesson: startLesson } : { kind: 'checkpointIntro' });
  const checkpoint = phase ? v2Lesson(phase.checkpoint.id) : null;
  const [runID, setRunID] = useState(0);
  const close = () => navigation.goBack();
  const go = (s: Step) => {
    if (s.kind === 'player' || s.kind === 'checkpoint') setRunID((r) => r + 1);
    setStep(s);
  };
  const content = step.kind === 'intro' || step.kind === 'player' || step.kind === 'recap' ? v2Lesson(step.lesson.id) : checkpoint;
  if (!phase || !allowed || ((step.kind === 'intro' || step.kind === 'checkpointIntro') && !content)) {
    close();
    return <View />;
  }
  switch (step.kind) {
    case 'intro':
      return <LessonIntroV2 lesson={content!} onStart={() => go({ kind: 'player', lesson: step.lesson })} onClose={close} />;
    case 'player':
      return <LessonPlayerV2 key={`${step.lesson.id}-${runID}`} lesson={content!} onFinish={(r) => go({ kind: 'recap', lesson: step.lesson, result: r })} onQuit={close} />;
    case 'recap': {
      const { lesson, result } = step;
      return <LessonRecapV2 lesson={content!} onContinue={() => go({ kind: 'lessonDone', lesson, result })} />;
    }
    case 'lessonDone': {
      const { lesson, result } = step;
      return (
        <TrackLessonComplete
          phase={phase}
          lesson={lesson}
          result={result}
          onContinue={() => {
            const lastPart = lesson.part === phase.lessons.length;
            // phases without a checkpoint (the general tracks) go back to the path instead
            if (lastPart && result.firstAttempt && phase.checkpoint.questions.length > 0 && phase.lessons.every((l) => track.isFinished(l.id))) go(phase.code.length ? { kind: 'projectBuilt' } : { kind: 'checkpointIntro' });
            else close();
          }}
          onReplay={() => go({ kind: 'intro', lesson })}
        />
      );
    }
    case 'projectBuilt':
      return <ProjectBuilt phase={phase} onCheckpoint={() => go({ kind: 'checkpointIntro' })} onBack={close} />;
    case 'checkpointIntro':
      return <LessonIntroV2 lesson={checkpoint!} onStart={() => go({ kind: 'checkpoint' })} onClose={close} />;
    case 'checkpoint':
      return <LessonPlayerV2 key={`cp-${runID}`} lesson={checkpoint!} onFinish={(r) => go({ kind: 'checkpointDone', result: r })} onQuit={close} />;
    case 'checkpointDone':
      return <CheckpointResult phase={phase} result={step.result} onReplay={() => go({ kind: 'checkpoint' })} onDone={close} />;
  }
}
