// The general-path lesson player: keeps the question queue, retries and bolts, and hands each question kind to its own component.
import React, { useMemo, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from '../../components/SafeAreaView';
import * as Haptics from 'expo-haptics';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useAppStore } from '../../hooks/useAppStore';
import { ChunkyButton } from '../../components/ui';
import { LessonTopBar } from '../../components/lesson/LessonTopBar';
import { SimpleLessonComplete } from '../../components/lesson/SimpleLessonComplete';
import { QuitSheet } from '../../components/QuitSheet';
import { BOLTS_FOR_FINISHING, BOLTS_PER_CORRECT } from '../../utils/rewards';
import { C, body } from '../../utils/theme';
import { Question } from '../../types/models';
import { codeJoin } from '../../utils/codeJoin';
import { APIClient } from '../../services/apiClient';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { LessonFeedback } from './LessonFeedback';
import { BugQuestion } from './questions/BugQuestion';
import { BuildQuestion } from './questions/BuildQuestion';
import { ChoiceQuestion } from './questions/ChoiceQuestion';
import { JudgeQuestion } from './questions/JudgeQuestion';
import { MatchQuestion } from './questions/MatchQuestion';
import { QuestionHeader } from './questions/QuestionHeader';

type Props = NativeStackScreenProps<RootStackParamList, 'Lesson'>;

/** Bolts: a few per question right on the first try, plus a bonus for finishing. A wrong answer comes back once at the end. */
export default function LessonScreen({ route, navigation }: Props) {
  const store = useAppStore();
  // Looked up once: the lesson must not change under the learner if the course reloads mid-lesson.
  const lesson = useMemo(() => store.orderedLessons.find((l) => l.id === route.params.lessonId), []); // eslint-disable-line react-hooks/exhaustive-deps
  // A wrong answer is queued once more at the end, so `queue` can be longer than the lesson.
  const [queue, setQueue] = useState<Question[]>(lesson?.questions ?? []);
  const [position, setPosition] = useState(0);
  const [choice, setChoice] = useState<string | null>(null);
  const [placed, setPlaced] = useState<number[]>([]);
  const [outcome, setOutcome] = useState<null | 'correct' | 'wrong'>(null);
  const [retried, setRetried] = useState<Set<string>>(new Set());
  const [finishedIDs, setFinishedIDs] = useState<Set<string>>(new Set());
  const [firstTryMisses, setMisses] = useState<Set<string>>(new Set());
  const [bolts, setBolts] = useState(0);
  const [finished, setFinished] = useState(false);
  const [confirmQuit, setConfirmQuit] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [pairs, setPairs] = useState<Record<number, number>>({});
  const [activeRow, setActiveRow] = useState<number | null>(null);
  const [aiText, setAiText] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  // Counts explain requests so a slow answer for a question the learner has left is dropped.
  const aiRequest = useRef(0);

  if (!lesson) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.cream, padding: 20 }}>
        <Text style={body(16)}>This lesson isn't available.</Text>
        <ChunkyButton title="Back" onPress={() => navigation.goBack()} />
      </SafeAreaView>
    );
  }
  const q: Question | undefined = queue[position];
  const progress = lesson.questions.length ? finishedIDs.size / lesson.questions.length : 1;
  const learner = store.progress;
  /** The right-hand chips of a match question (the answers themselves when there is no separate list). */
  const partners = q ? q.right ?? q.answer : [];

  const canCheck = !q ? false : q.kind === 'build' ? placed.length > 0 : q.kind === 'match' ? Object.keys(pairs).length === q.options.length : choice !== null;

  const check = () => {
    if (!q) return;
    let isRight: boolean;
    if (q.kind === 'build') isRight = codeJoin(placed.map((i) => q.options[i])) === codeJoin(q.answer) && placed.length === q.answer.length && placed.every((i, k) => q.options[i] === q.answer[k]);
    else if (q.kind === 'match') isRight = q.options.every((_, row) => pairs[row] !== undefined && partners[pairs[row]] === q.answer[row]);
    else isRight = choice === q.answer[0];
    if (isRight) {
      if (!firstTryMisses.has(q.id) && !finishedIDs.has(q.id)) setBolts((b) => b + BOLTS_PER_CORRECT);
      setFinishedIDs((s) => new Set(s).add(q.id));
    } else {
      setMisses((s) => new Set(s).add(q.id));
      if (retried.has(q.id)) setFinishedIDs((s) => new Set(s).add(q.id));
      else {
        setRetried((s) => new Set(s).add(q.id));
        setQueue((qq) => [...qq, q]);
      }
    }
    setOutcome(isRight ? 'correct' : 'wrong');
    Haptics.notificationAsync(isRight ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error).catch(() => {});
  };

  const next = () => {
    setChoice(null);
    setPlaced([]);
    setPairs({});
    setActiveRow(null);
    setShowHint(false);
    setOutcome(null);
    setAiText(null);
    setAiLoading(false);
    aiRequest.current++;
    const nextPos = position + 1;
    setPosition(nextPos);
    if (nextPos >= queue.length) {
      setBolts((b) => b + BOLTS_FOR_FINISHING);
      setFinished(true);
    }
  };

  const finish = () => {
    store.finishLesson(lesson, bolts);
    navigation.goBack();
  };

  const explainMore = async (qq: Question) => {
    const id = ++aiRequest.current;
    setAiLoading(true);
    const learnerAnswer = qq.kind === 'build' ? codeJoin(placed.map((i) => qq.options[i])) : qq.kind === 'match' ? qq.options.map((o, r) => `${o} -> ${pairs[r] !== undefined ? partners[pairs[r]] : '?'}`).join('; ') : choice ?? '';
    let text: string;
    try {
      text = await APIClient.explain({
        questionPrompt: qq.prompt,
        code: qq.kind === 'bug' ? qq.options.join('\n') : qq.code ?? '',
        learnerAnswer,
        correctAnswer: qq.kind === 'match' ? qq.options.map((o, i) => `${o} -> ${qq.answer[i]}`).join('; ') : codeJoin(qq.answer),
        age: learner.age,
        studyArea: learner.studyArea,
      });
    } catch {
      text = "Couldn't reach the explainer right now. The note above covers the key idea.";
    }
    if (aiRequest.current !== id) return;
    setAiText(text);
    setAiLoading(false);
  };

  const questionBody = (qq: Question) => (
    <View style={{ gap: 16 }}>
      <QuestionHeader q={qq} choice={choice} hintOpen={learner.age < 13 || showHint} onShowHint={() => setShowHint(true)} />
      {qq.kind === 'choice' && <ChoiceQuestion q={qq} choice={choice} outcome={outcome} onChoose={setChoice} />}
      {qq.kind === 'judge' && <JudgeQuestion q={qq} choice={choice} outcome={outcome} onChoose={setChoice} />}
      {qq.kind === 'bug' && <BugQuestion q={qq} choice={choice} outcome={outcome} onChoose={setChoice} />}
      {qq.kind === 'build' && <BuildQuestion q={qq} placed={placed} outcome={outcome} onPlace={(idx) => setPlaced((pl) => [...pl, idx])} onRemove={(k) => setPlaced((pl) => pl.filter((_, j) => j !== k))} />}
      {qq.kind === 'match' && <MatchQuestion q={qq} partners={partners} pairs={pairs} setPairs={setPairs} activeRow={activeRow} setActiveRow={setActiveRow} outcome={outcome} />}
    </View>
  );

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: C.cream }}>
      <LessonTopBar progress={progress} bolts={bolts} finished={finished} onQuit={() => setConfirmQuit(true)} />
      {finished ? (
        <SimpleLessonComplete bolts={bolts} form={learner.currentForm} onContinue={finish} />
      ) : q ? (
        <>
          <ScrollView contentContainerStyle={{ padding: 20 }}>{questionBody(q)}</ScrollView>
          {outcome ? (
            <LessonFeedback q={q} correct={outcome === 'correct'} form={learner.currentForm} aiText={aiText} aiLoading={aiLoading} onExplainMore={() => explainMore(q)} onNext={next} />
          ) : (
            <View style={{ padding: 16 }}>
              <ChunkyButton title="Check" enabled={canCheck} onPress={check} />
            </View>
          )}
        </>
      ) : null}
      {confirmQuit && (
        <QuitSheet form={learner.currentForm} questionsDone={finishedIDs.size} total={lesson.questions.length} bolts={bolts} onKeep={() => setConfirmQuit(false)} onLeave={() => navigation.goBack()} />
      )}
    </SafeAreaView>
  );
}
