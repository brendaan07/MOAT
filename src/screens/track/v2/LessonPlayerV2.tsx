// Plays the five questions of a new-style lesson: picture, code box, answers, hint and science notes, then the feedback sheet.
import React, { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from '../../../components/SafeAreaView';
import { ChunkyButton, DottedBackground } from '../../../components/ui';
import { BoltPill } from '../../../components/track/BoltPill';
import { QuitSheet } from '../../../components/QuitSheet';
import { RobotFace, moodPlan } from '../../../components/track/RobotFace';
import { Answers, Look, Paper } from '../../../components/lessonV2/Answers';
import { Enter, Carry, pressDown } from '../../../components/lessonV2/animations';
import { CodeLine } from '../../../components/lessonV2/CodeBox';
import { field } from '../../../components/lessonV2/content';
import { FeedbackSheet } from '../../../components/lessonV2/FeedbackSheet';
import { Chip, Panel } from '../../../components/lessonV2/notes';
import { Picture } from '../../../components/lessonV2/pictures';
import { QuestionBar } from '../../../components/lessonV2/QuestionBar';
import type { V2Lesson, V2Question } from '../../../components/lessonV2/types';
import { BORDER, C, body, heading, monoBold } from '../../../utils/theme';
import { TRACK_BOLTS_PER_QUESTION } from '../../../utils/rewards';
import { useAppStore } from '../../../hooks/useAppStore';
import { useTrackStore } from '../../../hooks/useTrackStore';
import { useFinishRun } from '../../../hooks/useFinishRun';
import { buildMatches } from '../../../utils/buildAnswer';
import type { RunResult, TrackQuestion } from '../../../types/models';
import { CloseButton } from '../../../components/CloseButton';

const asTrackQuestion = (q: V2Question): TrackQuestion => ({ id: q.id, kind: q.kind, prompt: q.ask, hint: q.hint, ok: q.ok });

/** Plays a new-style lesson and hands its result on; finishRun pays the bolts. */
export function LessonPlayerV2({ lesson, onFinish, onQuit }: { lesson: V2Lesson; onFinish: (r: RunResult) => void; onQuit: () => void }) {
  const app = useAppStore();
  const track = useTrackStore();
  const finishRun = useFinishRun();
  const form = app.progress.currentForm;
  const [idx, setIdx] = useState(0);
  const [pick, setPick] = useState<string | null>(null);
  const [seq, setSeq] = useState<string[]>([]);
  const [checked, setChecked] = useState(false);
  const [open, setOpen] = useState<'why' | 'code' | 'hint' | null>(null);
  const [quitting, setQuitting] = useState(false);
  const [firstTry, setFirstTry] = useState<Set<string>>(new Set());
  const missed = useRef<Set<string>>(new Set());
  const started = useRef(Date.now());
  const q = lesson.questions[idx];
  const all = [...(q.opts ?? []), ...(q.lines ?? [])];
  const lab = (id: string) => all.find((o) => o.id === id)?.label ?? '';
  const isBuild = q.kind === 'build';
  const picked = isBuild ? seq.length > 0 : pick !== null;
  const right = checked && (isBuild ? buildMatches(seq, q.correct as string[], lab) : pick === q.correct);
  const wrong = checked && !right;
  const mood = moodPlan(idx);
  const earned = right && !missed.current.has(q.id) && track.pays(asTrackQuestion(q));

  const choose = (id: string) => {
    if (checked) return;
    if (isBuild) setSeq((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
    else setPick(id);
  };
  const looks = useMemo(() => {
    const out: Record<string, Look> = {};
    for (const o of all) {
      let L: Look = { bg: q.kind === 'bug' ? 'transparent' : C.card, op: 1, ok: false, x: false };
      if (isBuild) L = { ...L, bg: seq.includes(o.id) ? C.locked : C.card, op: seq.includes(o.id) ? 0.5 : 1 };
      else if (checked) {
        if (o.id === q.correct) L = { ...L, bg: C.lime, ok: true };
        else if (o.id === pick) L = { ...L, bg: C.peach, x: true };
        else if (q.kind !== 'bug') L = { ...L, op: 0.45 };
      } else if (o.id === pick) L = { ...L, bg: q.kind === 'bug' ? '#FFF1C9' : C.lime };
      out[o.id] = L;
    }
    return out;
  }, [q, pick, seq, checked]); // eslint-disable-line react-hooks/exhaustive-deps

  const check = () => {
    setChecked(true);
    setOpen(null);
    const ok = isBuild ? buildMatches(seq, q.correct as string[], lab) : pick === q.correct;
    if (ok && !missed.current.has(q.id)) setFirstTry((s) => new Set(s).add(q.id));
    if (!ok) missed.current.add(q.id);
  };
  const retry = () => {
    setPick(null);
    setSeq([]);
    setChecked(false);
  };
  const next = () => {
    if (idx < lesson.questions.length - 1) {
      setIdx(idx + 1);
      retry();
      setOpen(null);
      return;
    }
    // finishRun also pays the bolts into the account, which this player used to skip.
    onFinish(finishRun(lesson.id, lesson.questions.map(asTrackQuestion), firstTry, started.current));
  };
  const line = right ? q.ok : isBuild ? q.wrongBuild ?? 'Have another look.' : q.fb[pick ?? ''] ?? 'Have another look.';
  const toggle = (k: 'why' | 'code' | 'hint') => setOpen((o) => (o === k ? null : k));
  const blank = q.kind === 'fill' && pick ? lab(pick) : null;
  const bolts = firstTry.size * TRACK_BOLTS_PER_QUESTION - (right && earned ? TRACK_BOLTS_PER_QUESTION : 0);

  return (
    <View style={{ flex: 1, backgroundColor: C.cream }}>
      <DottedBackground />
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        {/* top bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 8, paddingRight: 16, height: 44 }}>
          <CloseButton onPress={() => setQuitting(true)} label="Quit lesson" size={26} />
          <Ionicons name={field(lesson).track} size={20} color={C.navy} />
          <QuestionBar total={lesson.questions.length} index={idx} right={right} />
          <BoltPill base={Math.max(0, bolts)} earned={right && earned} />
        </View>
        {/* robot and question */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, marginTop: 4 }}>
          <RobotFace form={form} mood={checked ? (right ? mood.ok : mood.bad) : mood.ask} width={64} height={70} />
          <View style={{ flex: 1, minHeight: 68, borderRadius: 20, borderBottomLeftRadius: 6, borderWidth: BORDER, borderColor: C.navy, backgroundColor: C.card, paddingLeft: 14, paddingRight: 52, paddingVertical: 8 }}>
            <Enter key={`h${idx}`} kind="head" delay={80} style={{ alignSelf: 'flex-start' }}>
              <View>
                <View style={{ position: 'absolute', left: 0, right: 0, bottom: 2, height: 9, backgroundColor: q.color }} />
                <Text style={[heading(30), { lineHeight: 32, paddingHorizontal: 2 }]} accessibilityRole="header">{q.word}</Text>
              </View>
            </Enter>
            <Text style={[body(16, true), { color: C.muted, marginTop: 2 }]}>{q.ask}</Text>
            <Pressable onPress={() => toggle('hint')} accessibilityRole="button" accessibilityLabel={open === 'hint' ? 'Hide hint' : 'Show hint'} accessibilityState={{ expanded: open === 'hint' }}
              style={{ position: 'absolute', right: 4, top: '50%', marginTop: -22, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 34, height: 34, borderRadius: 17, borderWidth: BORDER, borderColor: C.navy, backgroundColor: open === 'hint' ? C.orange : C.sun, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="bulb-outline" size={18} color={C.navy} />
              </View>
            </Pressable>
          </View>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 12, paddingBottom: 120, gap: 16 }}>
          <Enter key={`s${idx}`} kind="stage" style={{ gap: 16 }}>
            {open === 'hint' && (
              <Enter kind="drop">
                <View style={{ borderRadius: 16, borderWidth: BORDER, borderColor: C.navy, backgroundColor: C.hintBlue, paddingHorizontal: 14, paddingVertical: 10 }} accessibilityRole="text">
                  <Text style={body(15)}>{q.hint}</Text>
                </View>
              </Enter>
            )}
            {/* the picture: tap for the science */}
            <View>
              <Pressable onPress={() => toggle('why')} accessibilityRole="button" accessibilityLabel={`${q.label} ${field(lesson).tap}`} accessibilityState={{ expanded: open === 'why' }}
                style={(s) => [{ borderRadius: 20, borderWidth: BORDER, borderColor: q.kind === 'bug' ? C.deepOrange : C.navy, backgroundColor: q.kind === 'bug' ? C.peach : q.kind === 'fill' ? '#FFF1C9' : C.card, padding: 12, paddingTop: 8, gap: 4 }, pressDown(s)]}>
                <View style={{ position: 'absolute', right: 10, top: 10, zIndex: 2 }}>
                  <Chip label={field(lesson).chip} icon={field(lesson).icon} />
                </View>
                {q.carry ? <Carry text={q.carry[0]} q={q.carry[1]} /> : <View style={{ height: 22 }} />}
                {q.pics.map((p, i) => (
                  <View key={i} style={{ marginTop: 4 }}>
                    <Picture p={p} solved={right} state={right ? 'go' : wrong ? 'nope' : 'idle'} />
                  </View>
                ))}
              </Pressable>
              {open === 'why' && <Panel title={q.science.title} text={q.science.text} icon={field(lesson).icon} fill={C.hintBlue} onClose={() => setOpen(null)} />}
            </View>
            {/* the code: tap for what it does */}
            <View>
              <Pressable onPress={() => toggle('code')} accessibilityRole="button" accessibilityState={{ expanded: open === 'code' }}
                style={(s) => [{ borderRadius: 16, borderWidth: BORDER, borderColor: C.navy, backgroundColor: C.screen, paddingHorizontal: 14, paddingTop: 8, paddingBottom: 10 }, pressDown(s)]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={[monoBold(13), { color: C.lavender }]}>{lesson.file}</Text>
                  <Chip label="What it does" dark />
                </View>
                {q.earlier && <Text style={[body(13, true), { color: C.lilac, minHeight: 22 }]}>{q.earlier}</Text>}
                {q.code.map((c, i) =>
                  c.trim() === '___' ? (
                    <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48 }}>
                      <Text style={[monoBold(11), { color: C.lilac, width: 18, textAlign: 'right' }]}>{q.start + i}</Text>
                      <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 5, paddingLeft: c.startsWith('  ') ? 16 : 0 }}>
                        {seq.length === 0 ? (
                          <View style={{ flex: 1, height: 40, borderRadius: 10, borderWidth: 2.5, borderStyle: 'dashed', borderColor: C.sky, justifyContent: 'center', paddingHorizontal: 10 }}>
                            <Text style={[body(14, true), { color: C.lavender }]}>Your line {q.start + i} goes here</Text>
                          </View>
                        ) : (
                          seq.map((id, k) => (
                            <Enter key={`${id}-${k}`} kind="snap">
                              <Text style={[monoBold(15), { backgroundColor: C.sky, borderRadius: 8, borderWidth: 2, borderColor: C.cream, paddingHorizontal: 6, paddingVertical: 4, overflow: 'hidden' }]}>{lab(id)}</Text>
                            </Enter>
                          ))
                        )}
                      </View>
                    </View>
                  ) : (
                    <CodeLine key={i} text={c} n={q.start + i} blank={blank} py={lesson.lang === 'py'} />
                  ),
                )}
                {q.goal.length > 0 && (
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 5, marginTop: 6 }}>
                    <Text style={[body(12), { color: C.lavender }]}>Goal</Text>
                    {q.goal.map((g, i) => (
                      <Text key={i} style={[monoBold(13), { color: C.cream, backgroundColor: '#2A337F', borderRadius: 6, paddingHorizontal: 6, overflow: 'hidden' }]}>{g}</Text>
                    ))}
                  </View>
                )}
              </Pressable>
              {open === 'code' && <Panel title={q.codeNote.title} text={q.codeNote.text} icon="code" fill="#E9ECFF" onClose={() => setOpen(null)} />}
            </View>
            {/* the answers */}
            {q.kind === 'bug' ? (
              <>
                <Paper q={q} looks={looks} pick={choose} />
                {right && q.after && (
                  <Enter kind="pop">
                    <Text style={[monoBold(16), { color: C.lime, backgroundColor: C.editor, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, overflow: 'hidden' }]}>{q.after}</Text>
                  </Enter>
                )}
              </>
            ) : isBuild ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9, justifyContent: 'center', padding: 10, borderRadius: 22, borderWidth: BORDER, borderStyle: 'dashed', borderColor: C.navy, backgroundColor: C.hintBlue }}>
                {(q.opts ?? []).map((o) => (
                  <Pressable key={o.id} onPress={() => choose(o.id)} accessibilityRole="button" accessibilityState={{ selected: seq.includes(o.id) }}
                    style={(s) => [{ minWidth: 44, height: 44, paddingHorizontal: 12, borderRadius: 14, borderWidth: BORDER, borderColor: C.navy, backgroundColor: looks[o.id].bg, opacity: looks[o.id].op, alignItems: 'center', justifyContent: 'center' }, pressDown(s)]}>
                    <Text style={monoBold(18)}>{o.label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Answers q={q} looks={looks} pick={choose} />
            )}
          </Enter>
        </ScrollView>
        {!checked && (
          <View style={{ position: 'absolute', left: 16, right: 16, bottom: 30 }}>
            <ChunkyButton title="Check" fill={picked ? C.lime : C.locked} enabled={picked} onPress={check} />
          </View>
        )}
      </SafeAreaView>
      {checked && (
        <FeedbackSheet key={`sheet-${idx}-${right}`} right={right} q={q} index={idx} line={line} onContinue={next} onRetry={retry} robotForm={form} mood={right ? mood.ok : mood.bad} earned={earned} />
      )}
      {quitting && <QuitSheet form={form} questionsDone={idx} total={lesson.questions.length} bolts={firstTry.size * TRACK_BOLTS_PER_QUESTION} onKeep={() => setQuitting(false)} onLeave={onQuit} />}
    </View>
  );
}
