// The lesson player: five questions, each with its picture, code, answers and feedback sheet.
import React, { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from '../../../components/SafeAreaView';
import { ChunkyButton, DottedBackground } from '../../../components/ui';
import { BoltPill } from '../../../components/track/BoltPill';
import { QuitSheet } from '../../../components/QuitSheet';
import { RobotFace, moodPlan } from '../../../components/track/RobotFace';
import { LessonPicture } from '../../../components/lesson/pictures';
import { Enter, pressDown } from '../../../components/lesson/animations';
import { QuestionBar } from '../../../components/lesson/QuestionBar';
import { Chip, Panel } from '../../../components/lesson/notes';
import { CodeLine } from '../../../components/lesson/CodeBox';
import { Answers, Look } from '../../../components/lesson/Answers';
import { FixPaper } from '../../../components/lesson/FixPaper';
import { FeedbackSheet } from '../../../components/lesson/FeedbackSheet';
import { BORDER, C, body, heading, monoBold } from '../../../utils/theme';
import { useAppStore } from '../../../hooks/useAppStore';
import { useTrackStore } from '../../../hooks/useTrackStore_updated';
import type { RunResult } from '../../../types/models';
import type { PlayerLesson, PlayerQuestion, TrackQuestion } from '../../../content/types';
import { FIELDS } from '../../../content/tracks';

const field = (l: PlayerLesson) => FIELDS[l.domain];

/** The question as progress records it. */
const asTrackQuestion = (q: PlayerQuestion): TrackQuestion => ({ id: q.id, kind: q.kind });

/** Plays a lesson's or checkpoint's questions, then records stars and bolts and reports the result. */
export function LessonPlayer({ lesson, onFinish, onQuit }: { lesson: PlayerLesson; onFinish: (r: RunResult) => void; onQuit: () => void }) {
  const app = useAppStore();
  const track = useTrackStore();
  const [idx, setIdx] = useState(0);
  const [pick, setPick] = useState<string | null>(null);
  const [fixPick, setFixPick] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [open, setOpen] = useState<'why' | 'code' | 'hint' | null>(null);
  const [quitting, setQuitting] = useState(false);
  const [firstTry, setFirstTry] = useState<Set<string>>(new Set());
  const missed = useRef<Set<string>>(new Set());
  const started = useRef(Date.now());
  const q = lesson.questions[idx];
  const all = q.opts ?? [];
  const lab = (id: string) => all.find((o) => o.id === id)?.label ?? '';
  const isFix = q.kind === 'fix' && !!q.fix;
  const cp = !!lesson.checkpoint;
  const fixOk = (line: string | null, f: string | null) => !!q.fix && line === q.correct && !!q.fix.byLine[line]?.find((o) => o.id === f)?.correct;
  const isRight = () => (isFix ? fixOk(pick, fixPick) : pick === q.correct);
  const picked = isFix ? pick !== null && fixPick !== null : pick !== null;
  const right = checked && isRight();
  const wrong = checked && !right;
  const mood = moodPlan(idx);
  const earned = right && !missed.current.has(q.id) && track.pays(asTrackQuestion(q));

  const choose = (id: string) => {
    if (!checked) setPick(id);
  };
  const looks = useMemo(() => {
    const out: Record<string, Look> = {};
    for (const o of all) {
      let L: Look = { bg: cp ? ['#DCEEFF', '#FFF1C9', '#FFE3CF', '#FFD6E0'][all.findIndex((x) => x.id === o.id) % 4] : C.card, op: 1, ok: false, x: false };
      if (checked) {
        if (o.id === q.correct) L = { ...L, bg: C.lime, ok: true };
        else if (o.id === pick) L = { ...L, bg: C.peach, x: true };
        else L = { ...L, op: 0.45 };
      } else if (o.id === pick) L = { ...L, bg: C.lime };
      out[o.id] = L;
    }
    return out;
  }, [q, pick, checked]); // eslint-disable-line react-hooks/exhaustive-deps

  const check = () => {
    setChecked(true);
    setOpen(null);
    const ok = isRight();
    if (ok && !missed.current.has(q.id)) setFirstTry((s) => new Set(s).add(q.id));
    if (!ok) missed.current.add(q.id);
  };
  const retry = () => {
    setPick(null);
    setFixPick(null);
    setChecked(false);
  };
  const next = () => {
    if (idx < lesson.questions.length - 1) {
      setIdx(idx + 1);
      retry();
      setOpen(null);
      return;
    }
    const result = track.record(lesson.id, lesson.questions.map(asTrackQuestion), firstTry);
    app.creditTrack(result.earned + result.bonus);
    track.addTime(Math.round((Date.now() - started.current) / 1000));
    onFinish(result);
  };
  const line = right
    ? q.ok
    : isFix
      ? q.fix!.byLine[pick ?? '']?.find((o) => o.id === fixPick)?.feedback ?? q.fb[pick ?? ''] ?? 'Have another look.'
      : q.fb[pick ?? ''] ?? 'Have another look.';
  const toggle = (k: 'why' | 'code' | 'hint') => { if (!cp) setOpen((o) => (o === k ? null : k)); }; // checkpoints: no hints or notes
  const blank = q.kind === 'fill' && pick ? lab(pick) : null;
  const bolts = firstTry.size * 10 - (right && earned ? 10 : 0);

  return (
    <View style={{ flex: 1, backgroundColor: cp ? C.screen : C.cream }}>
      {!cp && <DottedBackground />}
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        {/* top bar */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 8, paddingRight: 16, height: 44 }}>
          <Pressable onPress={() => setQuitting(true)} accessibilityRole="button" accessibilityLabel="Quit lesson" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="close" size={26} color={cp ? C.cream : C.navy} />
          </Pressable>
          <Ionicons name={field(lesson).track} size={20} color={cp ? C.cream : C.navy} />
          <QuestionBar total={lesson.questions.length} index={idx} right={right} />
          <BoltPill base={Math.max(0, bolts)} earned={right && earned} />
        </View>
        {/* robot and question */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, marginTop: 4 }}>
          <RobotFace mood={checked ? (right ? mood.ok : mood.bad) : mood.ask} width={64} height={70} />
          <View style={{ flex: 1, minHeight: 68, borderRadius: 20, borderBottomLeftRadius: 6, borderWidth: BORDER, borderColor: C.navy, backgroundColor: C.card, paddingLeft: 14, paddingRight: 52, paddingVertical: 8 }}>
            <Enter key={`h${idx}`} kind="head" delay={80} style={{ alignSelf: 'flex-start' }}>
              <View>
                {/* Baloo's ascenders rise ~8px above a 32px line box, which iOS Safari clips; 40 keeps them inside. */}
                <View style={{ position: 'absolute', left: 0, right: 0, bottom: 6, height: 9, backgroundColor: q.color }} />
                <Text style={[heading(30), { lineHeight: 40, paddingHorizontal: 2 }]} accessibilityRole="header">{q.word}</Text>
              </View>
            </Enter>
            <Text style={[body(16, true), { color: C.muted, marginTop: 2 }]}>{q.ask}</Text>
            {!cp && <Pressable onPress={() => toggle('hint')} accessibilityRole="button" accessibilityLabel={open === 'hint' ? 'Hide hint' : 'Show hint'} accessibilityState={{ expanded: open === 'hint' }}
              style={{ position: 'absolute', right: 4, top: '50%', marginTop: -22, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 34, height: 34, borderRadius: 17, borderWidth: BORDER, borderColor: C.navy, backgroundColor: open === 'hint' ? C.orange : C.sun, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="bulb-outline" size={18} color={C.navy} />
              </View>
            </Pressable>}
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
                style={(s) => [{ borderRadius: 20, borderWidth: BORDER, borderColor: C.navy, backgroundColor: q.kind === 'fill' && !cp ? '#FFF1C9' : C.card, padding: 12, paddingTop: 8, gap: 4 }, pressDown(s)]}>
                {!cp && (
                  <View style={{ position: 'absolute', right: 10, top: 10, zIndex: 2 }}>
                    <Chip label={field(lesson).chip} icon={field(lesson).icon} />
                  </View>
                )}
                <View style={{ height: 22 }} />
                {q.pics.map((p, i) => (
                  <View key={i} style={{ marginTop: 4 }}>
                    <LessonPicture spec={p} state={right ? 'go' : wrong ? 'nope' : 'idle'} pick={pick} />
                  </View>
                ))}
              </Pressable>
              {open === 'why' && <Panel title={q.science.title} text={q.science.text} icon={field(lesson).icon} fill={C.hintBlue} onClose={() => setOpen(null)} />}
            </View>
            {/* the code: tap for what it does */}
            {!isFix && <View>
              <Pressable onPress={() => toggle('code')} accessibilityRole="button" accessibilityState={{ expanded: open === 'code' }}
                style={(s) => [{ borderRadius: 16, borderWidth: BORDER, borderColor: C.navy, backgroundColor: C.screen, paddingHorizontal: 14, paddingTop: 8, paddingBottom: 10 }, pressDown(s)]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={[monoBold(13), { color: C.lavender }]}>{lesson.file}</Text>
                  {!cp && <Chip label="What it does" dark />}
                </View>
                {q.earlier && <Text style={[body(13, true), { color: C.lilac, minHeight: 22 }]}>{q.earlier}</Text>}
                {q.code.map((c, i) => <CodeLine key={i} text={c} n={i + 1} blank={blank} py={lesson.lang === 'py'} />)}
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
            </View>}
            {/* the answers */}
            {isFix ? (
              <>
                <FixPaper q={q} line={pick} fix={fixPick} setLine={(id) => { if (!checked) { setPick(id); setFixPick(null); } }} setFix={(id) => { if (!checked) setFixPick(id); }} checked={checked} right={right} dark={cp} />
                {right && q.after && (
                  <Enter kind="pop">
                    <Text style={[monoBold(16), { color: C.lime, backgroundColor: C.editor, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10, overflow: 'hidden' }]}>{q.after}</Text>
                  </Enter>
                )}
              </>
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
        <FeedbackSheet key={`sheet-${idx}-${right}`} right={right} q={q} index={idx} total={lesson.notebook.length} line={line} onContinue={next} onRetry={retry} mood={right ? mood.ok : mood.bad} earned={earned} />
      )}
      {quitting && <QuitSheet questionsDone={idx} total={lesson.questions.length} bolts={firstTry.size * 10} onKeep={() => setQuitting(false)} onLeave={onQuit} />}
    </View>
  );
}
