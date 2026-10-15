// Runs the steps of a track item in order: goal screen, questions, recap, results, project built and checkpoint.
import React, { useState } from 'react';
import { View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTrackStore } from '../../hooks/useTrackStore';
import { RunResult, TrackLesson } from '../../types/models';
import TrackPlayer from './TrackPlayer';
import { v2Lesson } from '../../components/lessonV2/content';
import { LessonIntroV2 } from './v2/LessonIntroV2';
import { LessonPlayerV2 } from './v2/LessonPlayerV2';
import { LessonRecapV2 } from './v2/LessonRecapV2';
import { CheckpointIntro } from './results/CheckpointIntro';
import { CheckpointResult } from './results/CheckpointResult';
import { ProjectBuilt } from './results/ProjectBuilt';
import { TrackLessonComplete } from './results/TrackLessonComplete';
import type { RootStackParamList } from '../../navigation/RootNavigator';

type Step =
  | { kind: 'lesson'; lesson: TrackLesson }
  | { kind: 'introV2'; lesson: TrackLesson }
  | { kind: 'lessonV2'; lesson: TrackLesson }
  | { kind: 'recapV2'; lesson: TrackLesson; result: RunResult }
  | { kind: 'lessonDone'; lesson: TrackLesson; result: RunResult }
  | { kind: 'projectBuilt' }
  | { kind: 'checkpointIntro' }
  | { kind: 'checkpoint' }
  | { kind: 'checkpointDone'; result: RunResult };

type Props = NativeStackScreenProps<RootStackParamList, 'TrackFlow'>;

/** Lesson, lesson complete, project built, checkpoint intro, checkpoint, result.
 *  Lessons with new-style content run goal screen, questions and recap first; the rest use TrackPlayer. */
export default function TrackFlowScreen({ route, navigation }: Props) {
  const track = useTrackStore();
  const phase = track.track?.phases.find((p) => p.number === route.params.phase);
  const startLesson = phase?.lessons.find((l) => l.id === route.params.lessonId) ?? null;
  // Checked once on open, since finishing a lesson here changes what is unlocked. A typed URL to a locked or unknown item closes the screen.
  const [allowed] = useState(() => !!phase && (startLesson ? track.lessonUnlocked(startLesson, phase) : !route.params.lessonId && track.checkpointUnlocked(phase)));
  const lessonStep = (lesson: TrackLesson): Step => (v2Lesson(lesson.id) ? { kind: 'introV2', lesson } : { kind: 'lesson', lesson });
  const [step, setStep] = useState<Step>(startLesson ? lessonStep(startLesson) : { kind: 'checkpointIntro' });
  // Part of each player's React key: bumping it on every start or replay mounts a fresh player, so no answers carry over.
  const [runID, setRunID] = useState(0);
  const close = () => navigation.goBack();
  const go = (s: Step) => {
    if (s.kind === 'lesson' || s.kind === 'lessonV2' || s.kind === 'checkpoint') setRunID((r) => r + 1);
    setStep(s);
  };
  if (!phase || !allowed) {
    close();
    return <View />;
  }
  switch (step.kind) {
    case 'lesson':
      return <TrackPlayer key={`${step.lesson.id}-${runID}`} phase={phase} lesson={step.lesson} onFinish={(r) => go({ kind: 'lessonDone', lesson: step.lesson, result: r })} onQuit={close} />;
    case 'introV2': {
      const v2 = v2Lesson(step.lesson.id)!;
      return <LessonIntroV2 lesson={v2} onStart={() => go({ kind: 'lessonV2', lesson: step.lesson })} onClose={close} />;
    }
    case 'lessonV2': {
      const v2 = v2Lesson(step.lesson.id)!;
      return <LessonPlayerV2 key={`${step.lesson.id}-v2-${runID}`} lesson={v2} onFinish={(r) => go({ kind: 'recapV2', lesson: step.lesson, result: r })} onQuit={close} />;
    }
    case 'recapV2': {
      const v2 = v2Lesson(step.lesson.id)!;
      const { lesson, result } = step;
      return <LessonRecapV2 lesson={v2} onContinue={() => go({ kind: 'lessonDone', lesson, result })} />;
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
            // phases whose checkpoint is not designed yet go back to Learn instead of the checkpoint
            if (lastPart && result.firstAttempt && phase.checkpoint.questions.length > 0 && phase.lessons.every((l) => track.isFinished(l.id))) go({ kind: 'projectBuilt' });
            else close();
          }}
          onReplay={() => go(lessonStep(lesson))}
        />
      );
    }
    case 'projectBuilt':
      return <ProjectBuilt phase={phase} onCheckpoint={() => go({ kind: 'checkpointIntro' })} onBack={close} />;
    case 'checkpointIntro':
      return <CheckpointIntro phase={phase} onStart={() => go({ kind: 'checkpoint' })} onClose={close} />;
    case 'checkpoint':
      return <TrackPlayer key={`cp-${runID}`} phase={phase} lesson={null} onFinish={(r) => go({ kind: 'checkpointDone', result: r })} onQuit={close} />;
    case 'checkpointDone':
      return <CheckpointResult phase={phase} result={step.result} onReplay={() => go({ kind: 'checkpoint' })} onDone={close} />;
  }
}
