// Plays one project-track lesson or the phase checkpoint (5 questions, in navy exam mode) and reports the result when it ends.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from '../../components/SafeAreaView';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '../../hooks/useAppStore';
import { useFinishRun } from '../../hooks/useFinishRun';
import { useTrackStore } from '../../hooks/useTrackStore';
import { ChunkyButton, DottedBackground } from '../../components/ui';
import { BoltPill } from '../../components/track/BoltPill';
import { CoachRow, moodPlan } from '../../components/track/RobotFace';
import { FeedbackSheet } from '../../components/track/FeedbackSheet';
import { PromptBubble } from '../../components/track/PromptBubble';
import { QuitSheet } from '../../components/QuitSheet';
import { SegmentBar, StarSlots } from '../../components/track/progressBars';
import { C } from '../../utils/theme';
import { TRACK_BOLTS_PER_QUESTION } from '../../utils/rewards';
import { RunResult, TrackLesson, TrackPhase, moodImage } from '../../types/models';
import { QState, STYLE_TAG, comboText, freshQState, isAnswerRight, kindLabel, liveOutput, okTitle, sheetMessage } from './trackQuestionLogic';
import { QuestionView } from './questions/parts';
import { LessonQuestionBody } from './questions/LessonQuestionBody';
import { CheckpointQuestionBody } from './questions/CheckpointQuestionBody';
import { CloseButton } from '../../components/CloseButton';

/** `lesson` is null for the phase checkpoint. The player remounts (via key) on every replay so no old answers carry over. */
export default function TrackPlayer({ phase, lesson, onFinish, onQuit }: { phase: TrackPhase; lesson: TrackLesson | null; onFinish: (r: RunResult) => void; onQuit: () => void }) {
  const app = useAppStore();
  const track = useTrackStore();
  const finishRun = useFinishRun();
  // No lesson means the phase checkpoint.
  const isCheckpoint = lesson === null;
  const questions = lesson?.questions ?? phase.checkpoint.questions;
  const itemID = lesson?.id ?? phase.checkpoint.id;
  const [index, setIndex] = useState(0);
  const q = questions[index];
  const [answer, setAnswer] = useState<QState>(() => freshQState(questions[0]));
  const [firstTry, setFirstTry] = useState<Set<string>>(new Set());
  const [missed, setMissed] = useState<Set<string>>(new Set());
  const [hintOpen, setHintOpen] = useState(false);
  const [showQuit, setShowQuit] = useState(false);
  const started = useRef(Date.now());
  const form = app.progress.currentForm;

  const isRight = useMemo(() => isAnswerRight(q, answer), [q, answer]);
  const correct = answer.checked && isRight;
  const earnedNow = correct && firstTry.has(q.id) && track.pays(q);
  const boltBase = TRACK_BOLTS_PER_QUESTION * questions.slice(0, index).filter((x) => firstTry.has(x.id) && track.pays(x)).length;
  const canCheck = q.kind === 'build' ? answer.seq.length > 0 : q.kind === 'order' ? true : answer.pick !== null;
  const moods = moodPlan(index + (isCheckpoint ? 0 : lesson?.part ?? 0));
  const mood = !answer.checked ? moods.ask : correct ? moods.ok : moods.bad;

  useEffect(() => {
    if (answer.checked && correct) Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }, [answer.checked]); // eslint-disable-line react-hooks/exhaustive-deps

  const sub = isCheckpoint ? `Checkpoint ${phase.number} · Q${index + 1} of ${questions.length}` : `Part ${lesson?.part ?? 1} of 4 · ${kindLabel(q)}`;
  const tag = isCheckpoint ? STYLE_TAG[q.style ?? 'predict'] : undefined;
  const live = liveOutput(q, answer, correct);

  const check = () => {
    if (!canCheck || answer.checked) return;
    if (isRight) {
      if (!missed.has(q.id)) setFirstTry((s) => new Set(s).add(q.id));
    } else setMissed((s) => new Set(s).add(q.id));
    setHintOpen(false);
    setAnswer((s) => ({ ...s, checked: true }));
  };
  const retry = () => setAnswer(freshQState(q));
  const advance = () => {
    if (index + 1 < questions.length) {
      setIndex(index + 1);
      setAnswer(freshQState(questions[index + 1]));
      setHintOpen(false);
    } else {
      onFinish(finishRun(itemID, questions, firstTry, started.current));
    }
  };

  const view: QuestionView = {
    q,
    answer,
    onPick: (id) => setAnswer({ ...answer, pick: id }),
    onToggleSeq: (id) => {
      if (answer.checked) return;
      setAnswer({ ...answer, seq: answer.seq.includes(id) ? answer.seq.filter((x) => x !== id) : [...answer.seq, id] });
    },
    onMove: (i, d) => {
      if (answer.checked) return;
      const j = i + d;
      if (j < 0 || j >= answer.order.length) return;
      const o = [...answer.order];
      [o[i], o[j]] = [o[j], o[i]];
      setAnswer({ ...answer, order: o });
    },
  };

  const checkLabel = q.kind === 'order' ? (q.style === 'code' ? 'Run it' : 'Check plan') : 'Check';
  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
      <DottedBackground navy={isCheckpoint} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingLeft: 8, paddingRight: 16, marginTop: 8 }}>
        <CloseButton onPress={() => setShowQuit(true)} label={isCheckpoint ? 'Quit checkpoint' : 'Quit lesson'} color={isCheckpoint ? C.cream : C.navy} />
        {isCheckpoint ? <StarSlots total={questions.length} index={index} currentCorrect={correct} /> : <SegmentBar total={questions.length} index={index} currentCorrect={correct} />}
        <BoltPill key={`bolt-${index}`} base={boltBase} earned={earnedNow} />
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: answer.checked ? 340 : 24, gap: 10 }} keyboardShouldPersistTaps="handled">
        <CoachRow form={form} mood={mood}>
          <PromptBubble sub={sub} title={q.prompt} hint={q.hint} tag={tag?.[0]} tagColor={tag?.[1]} darkShadow={isCheckpoint} hintOpen={hintOpen} onToggleHint={() => setHintOpen((h) => !h)} />
        </CoachRow>
        {isCheckpoint ? <CheckpointQuestionBody view={view} phase={phase} live={live} /> : <LessonQuestionBody view={view} phase={phase} part={lesson?.part ?? 1} live={live} />}
      </ScrollView>
      <View style={{ paddingHorizontal: 16, paddingBottom: 12, opacity: answer.checked ? 0 : 1 }}>
        <ChunkyButton title={checkLabel} enabled={canCheck && !answer.checked} onPress={check} />
      </View>
      {answer.checked && (
        <FeedbackSheet
          key={`${q.id}-${index}`}
          correct={correct}
          title={correct ? okTitle(q) : 'Not quite'}
          message={sheetMessage(q, answer, correct)}
          answerLine={q.kind === 'order' ? undefined : q.answerLine}
          bonusLine={earnedNow ? `+${TRACK_BOLTS_PER_QUESTION} bolts, ${comboText(questions, firstTry, index)}` : undefined}
          note={q.note}
          robot={moodImage(form, correct ? moods.ok : moods.bad)}
          onContinue={advance}
          onRetry={retry}
        />
      )}
      {showQuit && (
        <QuitSheet form={form} questionsDone={index} total={questions.length} bolts={boltBase} onKeep={() => setShowQuit(false)} onLeave={() => { track.addTime((Date.now() - started.current) / 1000); onQuit(); }} />
      )}
    </SafeAreaView>
  );
}
