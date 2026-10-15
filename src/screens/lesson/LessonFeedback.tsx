// The sheet under a general-path question after Check: right or wrong, the answer, the explanation and the optional "Explain more".
import React from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Question, RobotForm, moodImage } from '../../types/models';
import { C, body } from '../../utils/theme';
import { codeJoin } from '../../utils/codeJoin';
import { AppConfig } from '../../services/apiClient';
import { Card } from '../../components/ui';
import { GameFeedbackSheet } from '../../components/gameKit';

/** What to show as the right answer when the learner got it wrong, one form per kind of question. */
function answerText(q: Question) {
  if (q.kind === 'build') return `Answer: ${codeJoin(q.answer)}`;
  if (q.kind === 'bug') return `The mistake: ${(q.answer[0] ?? '').trim()}`;
  if (q.kind === 'match') return q.options.map((o, i) => `${o} -> ${q.answer[i]}`).join('\n');
  return `Answer: ${q.answer[0] ?? ''}`;
}

export function LessonFeedback({ q, correct, form, aiText, aiLoading, onExplainMore, onNext }: {
  q: Question;
  correct: boolean;
  form: RobotForm;
  aiText: string | null;
  aiLoading: boolean;
  onExplainMore: () => void;
  onNext: () => void;
}) {
  return (
    <GameFeedbackSheet
      correct={correct}
      title={correct ? 'Nice!' : 'Not quite'}
      answerLine={correct ? undefined : answerText(q)}
      message={q.explanation}
      buttonTitle={correct ? 'Continue' : 'Got it'}
      robotName={moodImage(form, correct ? 'excited' : 'surprised')}
      action={onNext}
    >
      {/* "Explain more" only exists when the backend explainer is switched on in AppConfig. */}
      {!correct && AppConfig.useAIExplanations && (aiText ? (
        <Card radius={12} contentStyle={{ padding: 12 }}><Text style={body(15)}>{aiText}</Text></Card>
      ) : aiLoading ? (
        <ActivityIndicator color={C.navy} accessibilityLabel="Getting an explanation" />
      ) : (
        <Pressable onPress={onExplainMore} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44 }}>
          <Ionicons name="sparkles" size={16} color={C.navy} />
          <Text style={[body(15, true), { textDecorationLine: 'underline' }]}>Explain more</Text>
        </Pressable>
      ))}
    </GameFeedbackSheet>
  );
}
