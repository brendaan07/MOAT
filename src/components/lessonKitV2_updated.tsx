/**
 * Lessons in the new style (canvas pages "R lessons, new style", "Engineering lessons, new style" and "Healthcare lessons,
 * Python and R"): a goal screen, five questions and a recap. Engineering and Healthcare pictures live in picturesV2.tsx.
 * Every animation from the to-do doc's "Animations to port" checklist lives here, and each one is switched
 * off when Reduce Motion is on.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleProp, Text, View, ViewStyle } from 'react-native';
import Svg, { Line, Path, Rect, Text as SvgText } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from './SafeAreaView';
import { ChunkyButton, DottedBackground } from './ui';
import { BoltPill, QuitSheet, RobotFace, colorR, moodPlan, useSlideUp } from './trackKit';
import { BORDER, C, body, heading, monoBold } from '../utils/theme';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { useAppStore } from '../hooks/useAppStore';
import { useTrackStore } from '../hooks/useTrackStore_updated';
import type { RunResult, TrackQuestion } from '../types/models';
import RAW from '../../assets/content/track_bio_r_lessons_v2.json';
import MORE from '../../assets/content/track_lessons_v2_more.json';
import { PicState, PictureV2 } from './picturesV2';
import { Confetti, PictureV3 } from './picturesV3';
import BIO_V3 from '../../assets/content/biology_r_v3.json';
import HX_PY from '../../assets/content/healthcare_python_v3.json';
import HX_R from '../../assets/content/healthcare_r_v3.json';
import FIN_PY from '../../assets/content/finance_python_v3.json';
import ENG_PY from '../../assets/content/engineering_python_v3.json';
import GEN_PY from '../../assets/content/general_python_v3.json';
import PHYS_PY from '../../assets/content/physics_python_v3.json';
import ARTS_PY from '../../assets/content/arts_python_v3.json';
import GEN_R from '../../assets/content/general_r_v3.json';
import GEN_SQL from '../../assets/content/general_sql_v3.json';
import GEN_JS from '../../assets/content/general_javascript_v3.json';

// ---------------------------------------------------------------- content
export type V2Pic =
  | { type: 'strip'; text: string; hi: number[] | null; size: number }
  | { type: 'readout'; label: string; value: string; known: boolean }
  | { type: 'rows'; items: [string, string, boolean][] }
  | { type: 'bars'; vals: (number | null)[]; cutoff: number | null; hide: number[]; labels: string[] | null; cmax: number | null }
  | { type: 'tubes'; vols: number[]; cap: number }
  | { type: 'ph'; marks: number[] }
  | { type: 'machine'; input: string; name: string }
  | { type: 'msg'; who: string; text: string }
  | { type: 'v3'; spec: any } // eslint-disable-line @typescript-eslint/no-explicit-any
  | { type: 'belt' | 'circuit' | 'battery' | 'drip' | 'gauge' | 'clock24' | 'wristband' | 'syringe' | 'monitor' | 'bpbars' | 'curve'; args: unknown[]; kw: Record<string, unknown> };
export interface V2Option { id: string; label: string }
export interface V2Question {
  id: string;
  kind: 'predict' | 'fill' | 'bug' | 'build' | 'fix';
  word: string;
  color: string;
  okTitle: string;
  ask: string;
  hint: string;
  ok: string;
  fb: Record<string, string>;
  bridge: string;
  entry: string;
  label: string;
  science: { title: string; text: string };
  codeNote: { title: string; text: string };
  carry: [string, number] | null;
  pics: V2Pic[];
  eq: (string | { t: string; c: string })[];
  goal: string[];
  earlier: string | null;
  start: number;
  code: string[];
  opts?: V2Option[];
  lines?: V2Option[];
  correct: string | string[];
  file?: string;
  after?: string;
  wrongBuild?: string;
  /** Fix questions: every line of the script, which are given as correct, and each line's own replacements. */
  fix?: { lines: { id: string; code: string; given: boolean }[]; byLine: Record<string, { id: string; label: string; correct: boolean; feedback: string | null }[]> };
}
export interface V2Lesson {
  id: string;
  /** 'eng' and 'health' lessons use their own labels; Biology lessons leave it out. */
  domain?: 'eng' | 'health' | 'fin' | 'gen';
  lang?: CodeLang;
  phase: number;
  part: number;
  title: string;
  project: string;
  person: string;
  intro: string;
  start: string;
  doneTitle: string;
  doneSub: string;
  file: string;
  notebook: [string, string][];
  script: string[];
  questions: V2Question[];
  /** Checkpoints: navy page, coloured options, no hints or notes, green confetti recap. */
  checkpoint?: boolean;
  /** Lessons in this phase (4 for the older tracks). */
  parts?: number;
}
const LESSONS: Record<string, V2Lesson> = {};
for (const l of (RAW as unknown as { lessons: V2Lesson[] }).lessons) LESSONS[l.id] = l;
for (const l of (MORE as unknown as { lessons: V2Lesson[] }).lessons) LESSONS[l.id] = l;

/* Biology research R: every rebuilt lesson and checkpoint, converted to this player's format.
 * App ids: bio_p{phase}_l{part} for lessons (legacy lessons keep their entry above); its checkpoint is the track's phase checkpoint. */
const WORD_COLOUR: Record<string, string> = { predict: '#B5E04A', fill: '#FFC93C', fix: '#FF8A3D' };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
/** Code colouring uses Python's rules for 'py' and the R-style rules for the rest. */
type CodeLang = 'py' | 'r' | 'sql' | 'js' | 'matlab' | 'java';
type V3Track = { prefix: string; lang: CodeLang; domain?: 'health' | 'fin' | 'eng' | 'gen'; name: string; checkpointId?: (phase: number) => string };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromV3(it: any, phase: number, phaseTitle: string, tr: V3Track, parts: number): V2Lesson {
  const cp = it.type === 'checkpoint';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const questions: V2Question[] = it.questions.map((q: any, i: number) => {
    const nb = it.notebook[i];
    const isFix = q.kind === 'fix';
    const fb: Record<string, string> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!isFix) for (const o of q.options) if (o.feedback) fb[o.id] = o.feedback;
    else Object.assign(fb, q.wrong_line_feedback ?? {});
    return {
      id: `${it.id}_q${i + 1}`, kind: q.kind, word: q.label, color: WORD_COLOUR[q.kind] ?? C.lime, okTitle: isFix ? 'Fixed' : 'Correct',
      ask: q.ask, hint: q.hint_before_check ?? '', ok: [q.explanation_after_check, q.takeaway].filter(Boolean).join(' '), fb,
      bridge: q.next_bridge ?? 'carry on.', entry: nb ? `${nb.label}: ${nb.value}` : '', label: q.picture?.[0]?.label ?? '',
      science: q.science_note ?? { title: '', text: '' }, codeNote: q.code_note ?? { title: '', text: '' }, carry: null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pics: (q.picture ?? []).map((spec: any) => ({ type: 'v3', spec })), eq: q.worked ?? [], goal: q.goal_output ?? [],
      earlier: q.known_from_earlier?.length && !isFix ? `Known from earlier:  ${q.known_from_earlier.join('   ')}` : null,
      start: 1, code: isFix ? [] : q.code,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      opts: isFix ? undefined : q.options.map((o: any) => ({ id: o.id, label: o.label })),
      correct: isFix ? q.buggy_line : 'a', file: q.script_file ?? it.script_file, after: q.output_after_fix ?? undefined,
      fix: isFix ? {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        lines: q.lines.map((l: any) => ({ id: l.id, code: l.code, given: !!l.given_correct })),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        byLine: Object.fromEntries(Object.entries(q.fixes_by_line).map(([k, v]: [string, any]) => [k, v.map((o: any) => ({ id: o.id, label: o.replacement, correct: !!o.correct, feedback: o.feedback }))])),
      } : undefined,
    } as V2Question;
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const last = it.questions[it.questions.length - 1] as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const script: string[] = last?.kind === 'fix' ? last.lines.map((l: any) => l.code) : last?.code ?? [];
  return {
    id: `${tr.prefix}_p${phase}_${cp ? 'c' : 'l'}${it.part}`, lang: tr.lang, domain: tr.domain, phase, part: it.part, title: it.title, project: `${tr.name}, phase ${phase}: ${phaseTitle}`,
    person: it.person, intro: it.intro, start: it.start_button ?? (cp ? 'Start the checkpoint' : 'Start'), doneTitle: it.recap?.title ?? 'Done',
    doneSub: it.recap?.subtitle ?? '', file: it.script_file, notebook: it.notebook.map((n: { label: string; value: string }) => [n.label, n.value]),
    script, questions, checkpoint: cp, parts,
  };
}
/* Every V3 track, in this player's format. App ids: <prefix>_p{phase}_l{part}; checkpoints use _c{part}, or the track's
 * own phase checkpoint id when the track passes checkpointId (the same ids loadTrack uses).
 * Items still marked `status` are not rebuilt yet and keep their older entry above. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const addV3 = (data: any, tr: V3Track) => { for (const ph of data.phases) for (const it of ph.items) {
  if (it.status) continue;
  const l = fromV3(it, ph.phase, ph.title, tr, ph.items.filter((x: { type: string }) => x.type === 'lesson').length);
  if (tr.checkpointId && l.checkpoint) l.id = tr.checkpointId(l.phase);
  LESSONS[l.id] = l;
} };
addV3(BIO_V3, { prefix: 'bio', lang: 'r', name: 'Biology research R', checkpointId: (n) => `bio_p${n}_cp` });
addV3(HX_PY, { prefix: 'hx_py', lang: 'py', domain: 'health', name: 'Healthcare Python', checkpointId: (n) => `hx_py_cp${n}` });
addV3(HX_R, { prefix: 'hx_r', lang: 'r', domain: 'health', name: 'Healthcare R', checkpointId: (n) => `hx_r_cp${n}` });
addV3(FIN_PY, { prefix: 'fin_py', lang: 'py', domain: 'fin', name: 'Finance Python', checkpointId: (n) => `fin_py_cp${n}` });
addV3(ENG_PY, { prefix: 'eng_py', lang: 'py', domain: 'eng', name: 'Engineering Python', checkpointId: (n) => `eng_py_cp${n}` });
addV3(GEN_PY, { prefix: 'gen_py', lang: 'py', domain: 'gen', name: 'General Python', checkpointId: (n) => `gen_py_cp${n}` });
addV3(PHYS_PY, { prefix: 'phys_py', lang: 'py', domain: 'gen', name: 'Physics & maths Python', checkpointId: (n) => `phys_py_cp${n}` });
addV3(ARTS_PY, { prefix: 'arts_py', lang: 'py', domain: 'gen', name: 'Arts & humanities Python', checkpointId: (n) => `arts_py_cp${n}` });
addV3(GEN_R, { prefix: 'gen_r', lang: 'r', domain: 'gen', name: 'General R', checkpointId: (n) => `gen_r_cp${n}` });
addV3(GEN_SQL, { prefix: 'gen_sql', lang: 'sql', domain: 'gen', name: 'General SQL', checkpointId: (n) => `gen_sql_cp${n}` });
addV3(GEN_JS, { prefix: 'gen_js', lang: 'js', domain: 'gen', name: 'General JavaScript', checkpointId: (n) => `gen_js_cp${n}` });

/** The label, icon and science-note wording for each field. */
const FIELD = {
  bio: { chip: 'Biology', icon: 'flask-outline' as const, tap: 'Tap for the biology.', track: 'git-branch-outline' as const },
  eng: { chip: 'Engineering', icon: 'flash-outline' as const, tap: 'Tap for the engineering.', track: 'flash' as const },
  health: { chip: 'Healthcare', icon: 'heart-outline' as const, tap: 'Tap for the clinical context.', track: 'heart' as const },
  fin: { chip: 'Finance', icon: 'cash-outline' as const, tap: 'Tap for the finance context.', track: 'cash' as const },
  gen: { chip: 'Coding', icon: 'code-slash-outline' as const, tap: 'Tap for the context.', track: 'code-slash' as const },
};
const field = (l: V2Lesson) => FIELD[l.domain ?? 'bio'];

/** Python colouring, in the same colours the app uses for R. */
const PY_KW = new Set(['def', 'return', 'if', 'elif', 'else', 'for', 'in', 'while', 'and', 'or', 'not', 'True', 'False', 'None', 'import', 'from']);
export function colorPy(line: string): { t: string; c: string }[] {
  const toks = line.match(/[frb]?"[^"]*"|[frb]?'[^']*'|\d[\d.]*|[A-Za-z_][A-Za-z0-9_]*|\s+|./g) ?? [];
  return toks.map((t, k) => {
    const next = toks[k + 1] ?? '';
    let c: string = C.cream;
    if (/^[frb]?["']/.test(t)) c = C.lime;
    else if (/^\d/.test(t)) c = C.number;
    else if (PY_KW.has(t)) c = '#FF9B63';
    else if (/^[A-Za-z_]/.test(t)) c = next === '(' ? '#7CC4FF' : C.cream;
    else if (!/^\s+$/.test(t)) c = C.lavender;
    return { t, c };
  });
}

/** The new-style lesson for an app lesson id, or null when that lesson still uses the older player. */
export function v2Lesson(id: string): V2Lesson | null {
  return LESSONS[id] ?? null;
}

// ---------------------------------------------------------------- animations
const EASE = Easing.bezier(0.2, 0.8, 0.2, 1);
type Kind = 'stage' | 'head' | 'pop' | 'snap' | 'drop' | 'rowIn';

/** One-shot entrance animations (stage slide-in, heading pop, value pop, snap-in, drop-down, row rise). */
function Enter({ kind, delay = 0, style, children }: { kind: Kind; delay?: number; style?: StyleProp<ViewStyle>; children: React.ReactNode }) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) {
      v.setValue(1);
      return;
    }
    v.setValue(0);
    const dur = { stage: 340, head: 400, pop: 420, snap: 200, drop: 260, rowIn: 320 }[kind];
    const a = Animated.timing(v, { toValue: 1, duration: dur, delay, easing: kind === 'head' || kind === 'pop' ? Easing.linear : EASE, useNativeDriver: true });
    a.start();
    return () => a.stop();
  }, [reduce]); // eslint-disable-line react-hooks/exhaustive-deps
  let anim: StyleProp<ViewStyle>;
  if (kind === 'stage') anim = { opacity: v, transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) }] };
  else if (kind === 'head')
    anim = { opacity: v.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1, 1] }), transform: [{ scale: v.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.86, 1.05, 1] }) }] };
  else if (kind === 'pop')
    anim = { transform: [{ translateY: v.interpolate({ inputRange: [0, 0.6, 1], outputRange: [10, -6, 0] }) }, { scale: v.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.9, 1.04, 1] }) }] };
  else if (kind === 'snap') anim = { opacity: v, transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) }] };
  else if (kind === 'drop') anim = { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-12, 0] }) }] };
  else anim = { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] };
  return <Animated.View style={[style, anim]}>{children}</Animated.View>;
}

/** The pulsing orange ring around an unanswered ?, which fades and grows away (0.45s) once solved. */
function Ring({ solved, radius = 10 }: { solved: boolean; radius?: number }) {
  const reduce = useReduceMotion();
  const pulse = useRef(new Animated.Value(0)).current;
  const fade = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (solved) {
      pulse.stopAnimation();
      if (reduce) fade.setValue(0);
      else Animated.timing(fade, { toValue: 0, duration: 450, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
      return;
    }
    fade.setValue(1);
    if (reduce) {
      pulse.setValue(0.5);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [solved, reduce]); // eslint-disable-line react-hooks/exhaustive-deps
  const opacity = solved ? fade.interpolate({ inputRange: [0, 1], outputRange: [0, 0.9] }) : reduce ? 0.6 : pulse.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] });
  const scale = solved ? fade.interpolate({ inputRange: [0, 1], outputRange: [1.18, 1.04] }) : pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: 'absolute', left: -5, right: -5, top: -5, bottom: -5, borderRadius: radius, borderWidth: 3, borderColor: C.orange, opacity, transform: [{ scale }] }}
    />
  );
}

/** A ? answer slot: the ? swaps for the value with a pop once the question is solved; the ring fades. */
function QSlot({ value, solved, size = 16 }: { value: string | null; solved: boolean; size?: number }) {
  return (
    <View style={{ margin: 10, alignSelf: 'flex-start' }}>
      <Ring solved={solved} />
      {solved && value !== null ? (
        <Enter kind="pop">
          <Text style={[monoBold(size), { backgroundColor: C.lime, borderRadius: 6, paddingHorizontal: 5 }]}>{value}</Text>
        </Enter>
      ) : (
        <Text style={[monoBold(size), { color: C.deepOrange, paddingHorizontal: 6 }]}>?</Text>
      )}
    </View>
  );
}

/** The value inherited from an earlier question, sliding in from the top right with one lime glow. */
function Carry({ text, q }: { text: string; q: number }) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reduce) {
      v.setValue(1);
      return;
    }
    Animated.timing(v, { toValue: 1, duration: 540, delay: 350, easing: EASE, useNativeDriver: true }).start();
    Animated.sequence([
      Animated.delay(700),
      Animated.timing(glow, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(glow, { toValue: 0, duration: 360, useNativeDriver: true }),
    ]).start();
  }, [reduce]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Animated.View
      style={{
        alignSelf: 'flex-start',
        opacity: v,
        transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }, { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }],
      }}
      accessibilityLabel={`From question ${q}: ${text}`}
    >
      <Animated.View pointerEvents="none" style={{ position: 'absolute', left: -6, right: -6, top: -6, bottom: -6, borderRadius: 14, backgroundColor: C.lime, opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.55] }) }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 3, paddingLeft: 7, paddingRight: 9, borderRadius: 9, backgroundColor: C.successSheet, borderWidth: 2, borderColor: C.navy }}>
        <Text style={[body(12, true), { color: C.cream, backgroundColor: C.navy, borderRadius: 5, paddingHorizontal: 5, overflow: 'hidden' }]}>Q{q}</Text>
        <Text style={monoBold(13)}>{text}</Text>
      </View>
    </Animated.View>
  );
}

/** The lesson's question bar: one segment per question; the current one is outlined and fills lime when right. */
function QuestionBar({ total, index, right }: { total: number; index: number; right: boolean }) {
  const reduce = useReduceMotion();
  const v = useRef(new Animated.Value(0)).current;
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!right) {
      v.setValue(0);
      return;
    }
    if (reduce) v.setValue(1);
    else Animated.timing(v, { toValue: 1, duration: 500, easing: EASE, useNativeDriver: true }).start();
  }, [right, reduce]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <View style={{ flex: 1, flexDirection: 'row', gap: 6 }} accessibilityRole="progressbar" accessibilityLabel={`Question ${index + 1} of ${total}`}>
      {Array.from({ length: total }, (_, i) => {
        const done = i < index;
        const cur = i === index;
        return (
          <View
            key={i}
            onLayout={cur ? (e) => setW(e.nativeEvent.layout.width) : undefined}
            style={{
              flex: 1,
              height: 12,
              borderRadius: 6,
              borderWidth: BORDER,
              borderColor: C.navy,
              overflow: 'hidden',
              backgroundColor: done ? C.lime : cur ? C.hintBlue : C.locked,
              ...(cur ? { shadowColor: C.sky, shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 0 }, elevation: 0 } : {}),
            }}
          >
            {cur && w > 0 && <Animated.View style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: w, backgroundColor: C.lime, transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [-w, 0] }) }] }} />}
          </View>
        );
      })}
    </View>
  );
}

/** Pressed cards and buttons move down 2px. */
const pressDown = ({ pressed }: { pressed: boolean }) => ({ transform: [{ translateY: pressed ? 2 : 0 }] });

// ---------------------------------------------------------------- small pieces
const BASE: Record<string, string> = { A: C.orange, T: C.sun, G: C.lime, C: C.sky };

/** Text with `code` between backticks shown as dark code chips. */
function NoteText({ text, size = 15, bold = false }: { text: string; size?: number; bold?: boolean }) {
  const parts = text.split('`');
  return (
    <Text style={[body(size, bold), { lineHeight: size * 1.42 }]}>
      {parts.map((p, i) =>
        i % 2 ? (
          <Text key={i} style={[monoBold(size - 1.5), { backgroundColor: C.screen, color: C.cream }]}>
            {` ${p} `}
          </Text>
        ) : (
          <Text key={i}>{p}</Text>
        ),
      )}
    </Text>
  );
}

function Panel({ title, text, icon, fill, onClose }: { title: string; text: string; icon: keyof typeof Ionicons.glyphMap | 'code'; fill: string; onClose: () => void }) {
  return (
    <Enter kind="drop" style={{ marginTop: 8 }}>
      <View
        style={{ borderRadius: 20, borderWidth: BORDER, borderColor: C.navy, backgroundColor: fill, paddingHorizontal: 14, paddingTop: 6, paddingBottom: 14, shadowColor: C.navy, shadowOffset: { width: 0, height: 5 }, shadowOpacity: 1, shadowRadius: 0 }}
        accessibilityViewIsModal={false}
        onAccessibilityEscape={onClose}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name={icon === 'code' ? 'code-slash' : icon} size={17} color={C.navy} />
          <View style={{ flex: 1 }}>
            <NoteText text={title} size={17} bold />
          </View>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -8 }}>
            <Ionicons name="close" size={22} color={C.navy} />
          </Pressable>
        </View>
        <NoteText text={text} />
      </View>
    </Enter>
  );
}

function Chip({ label, dark = false, icon = 'flask-outline' }: { label: string; dark?: boolean; icon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 9, backgroundColor: dark ? '#E9ECFF' : C.hintBlue, borderWidth: dark ? 0 : 2, borderColor: C.navy }}>
      <Ionicons name={dark ? 'code-slash' : icon} size={13} color={C.navy} />
      <Text style={body(12, true)}>{label}</Text>
    </View>
  );
}

// ---------------------------------------------------------------- pictures
function Strip({ text, hi, size }: { text: string; hi: number[] | null; size: number }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: size > 26 ? 4 : 3 }} accessibilityLabel={`Bases ${text}`}>
      {text.split('').map((ch, i) => (
        <View key={i} style={{ width: size, height: size, borderRadius: 7, borderWidth: BORDER, borderColor: C.navy, backgroundColor: BASE[ch.toUpperCase()] ?? C.locked, opacity: hi === null || hi.includes(i) ? 1 : 0.32, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={monoBold(Math.floor(size / 2) + 1)}>{ch}</Text>
        </View>
      ))}
    </View>
  );
}

function Readout({ label, value, known, solved }: { label: string; value: string; known: boolean; solved: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
      <Text style={[body(13, true), { color: C.muted }]}>{label}</Text>
      {known ? <Text style={[monoBold(16), { backgroundColor: C.locked, borderRadius: 6, paddingHorizontal: 5 }]}>{value}</Text> : <QSlot value={value} solved={solved} />}
    </View>
  );
}

function Rows({ items, solved }: { items: [string, string, boolean][]; solved: boolean }) {
  return (
    <View>
      {items.map(([a, b, hid], i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', minHeight: 28, borderTopWidth: 1.5, borderTopColor: C.lockedEdge }}>
          <Text style={[monoBold(14), { flex: 1 }]}>{a}</Text>
          <View style={{ flex: 1 }}>{hid ? <QSlot value={b} solved={solved} size={15} /> : <Text style={monoBold(15)}>{b}</Text>}</View>
        </View>
      ))}
    </View>
  );
}

const T = ({ x, y, s, size = 11, anchor = 'middle', fill = C.navy }: { x: number; y: number; s: string; size?: number; anchor?: 'start' | 'middle' | 'end'; fill?: string }) => (
  <SvgText x={x} y={y} fontSize={size} fontWeight="700" fill={fill} textAnchor={anchor}>
    {s}
  </SvgText>
);

function Bars({ vals, cutoff, hide, labels, cmax }: { vals: (number | null)[]; cutoff: number | null; hide: number[]; labels: string[] | null; cmax: number | null }) {
  const h = 62;
  const max = cmax ?? Math.max(...(vals.filter((v) => v !== null) as number[]));
  const w = Math.min(54, Math.floor(260 / vals.length));
  return (
    <Svg width="100%" height={h + 26} viewBox={`0 0 326 ${h + 26}`} accessibilityLabel={`Bar chart of ${vals.map((v) => (v === null ? 'NA' : v)).join(', ')}`}>
      <Line x1={22} y1={h + 4} x2={316} y2={h + 4} stroke={C.navy} strokeWidth={2} />
      {cutoff !== null && (
        <>
          <Line x1={22} y1={h + 4 - (cutoff / max) * h} x2={316} y2={h + 4 - (cutoff / max) * h} stroke={C.deepOrange} strokeWidth={2} strokeDasharray="5 4" />
          <T x={316} y={h - (cutoff / max) * h} s={`cutoff ${cutoff}`} anchor="end" fill="#9A3F0A" />
        </>
      )}
      {vals.map((v, i) => {
        const x = 34 + i * (w + 14);
        const lab = labels ? labels[i] : String(i + 1);
        if (v === null)
          return (
            <React.Fragment key={i}>
              <Rect x={x} y={h - 16} width={w} height={20} rx={4} fill="none" stroke={C.navy} strokeWidth={2} strokeDasharray="4 3" />
              <T x={x + w / 2} y={h - 2} s="NA" />
              <T x={x + w / 2} y={h + 20} s={lab} />
            </React.Fragment>
          );
        const bh = Math.max(4, (v / max) * h);
        const hidden = hide.includes(i);
        return (
          <React.Fragment key={i}>
            <Rect x={x} y={h + 4 - bh} width={w} height={bh} rx={4} fill={hidden ? C.card : C.lime} stroke={C.navy} strokeWidth={2} strokeDasharray={hidden ? '4 3' : undefined} />
            {!hidden && <T x={x + w / 2} y={h - bh} s={String(v)} />}
            <T x={x + w / 2} y={h + 20} s={lab} />
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

function Tubes({ vols, cap }: { vols: number[]; cap: number }) {
  const h = 60;
  const top = cap * 1.25;
  const cy = 6 + h - 2 - (cap / top) * (h - 4);
  return (
    <Svg width="100%" height={h + 30} viewBox={`0 0 326 ${h + 30}`} accessibilityLabel={`Wells of ${vols.join(', ')} microlitres against a ${cap} microlitre limit`}>
      {vols.map((v, i) => {
        const x = 40 + i * 70;
        const fill = (Math.min(v, top) / top) * (h - 4);
        return (
          <React.Fragment key={i}>
            <Rect x={x} y={6} width={34} height={h} rx={8} fill={C.card} stroke={C.navy} strokeWidth={2.4} />
            <Rect x={x + 3} y={6 + h - 2 - fill} width={28} height={fill} rx={5} fill={v > cap ? C.number : C.sky} opacity={0.7} />
            <T x={x + 17} y={h + 22} s={`${v} uL`} />
          </React.Fragment>
        );
      })}
      <Line x1={30} y1={cy} x2={50 + 70 * vols.length} y2={cy} stroke={C.deepOrange} strokeWidth={2} strokeDasharray="5 4" />
      <T x={56 + 70 * vols.length} y={cy + 4} s={`max ${cap}`} anchor="start" fill="#9A3F0A" />
    </Svg>
  );
}

function PhScale({ marks }: { marks: number[] }) {
  return (
    <Svg width="100%" height={48} viewBox="0 0 326 48" accessibilityLabel={`pH scale from 0 to 14 with marks at ${marks.join(', ')}`}>
      {Array.from({ length: 14 }, (_, i) => (
        <Rect key={i} x={20 + i * 21} y={10} width={21} height={16} fill={i < 7 ? C.orange : i === 7 ? C.locked : C.sky} />
      ))}
      <Rect x={20} y={10} width={294} height={16} fill="none" stroke={C.navy} strokeWidth={2} />
      {[0, 7, 14].map((p) => (
        <T key={p} x={20 + p * 21} y={42} s={String(p)} />
      ))}
      {marks.map((p, i) => (
        <Path key={i} d={`M${20 + p * 21} 10l-6 -8h12z`} fill={C.navy} />
      ))}
    </Svg>
  );
}

function Machine({ input, name, solved }: { input: string; name: string; solved: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Text style={[monoBold(14), { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, borderWidth: 2, borderColor: C.navy, backgroundColor: C.card }]}>{input}</Text>
      <Ionicons name="arrow-forward" size={16} color={C.navy} />
      <Text style={[monoBold(14), { color: C.cream, backgroundColor: C.screen, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, overflow: 'hidden' }]}>{name}</Text>
      <Ionicons name="arrow-forward" size={16} color={C.navy} />
      <QSlot value={null} solved={solved} />
    </View>
  );
}

function Message({ who, text }: { who: string; text: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
      <View style={{ width: 34, height: 34, borderRadius: 17, borderWidth: 2, borderColor: C.navy, backgroundColor: C.hintBlue, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="person-outline" size={18} color={C.navy} />
      </View>
      <View style={{ flex: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14, borderTopLeftRadius: 4, borderWidth: 2, borderColor: C.navy, backgroundColor: C.card }}>
        <Text style={[body(12, true), { color: C.muted }]}>{who}</Text>
        <Text style={[body(14, true), { lineHeight: 18 }]}>{text}</Text>
      </View>
    </View>
  );
}

function Picture({ p, solved, state, pick = null }: { p: V2Pic; solved: boolean; state: PicState; pick?: string | null }) {
  switch (p.type) {
    case 'v3':
      return <PictureV3 spec={p.spec} state={state} pick={pick} />;
    case 'strip':
      return <Strip text={p.text} hi={p.hi} size={p.size} />;
    case 'readout':
      return <Readout label={p.label} value={p.value} known={p.known} solved={solved} />;
    case 'rows':
      return <Rows items={p.items} solved={solved} />;
    case 'bars':
      return <Bars vals={p.vals} cutoff={p.cutoff} hide={p.hide} labels={p.labels} cmax={p.cmax} />;
    case 'tubes':
      return <Tubes vols={p.vols} cap={p.cap} />;
    case 'ph':
      return <PhScale marks={p.marks} />;
    case 'machine':
      return <Machine input={p.input} name={p.name} solved={solved} />;
    case 'msg':
      return <Message who={p.who} text={p.text} />;
    default:
      return <PictureV2 p={p as { type: string }} state={state} />;
  }
}

// ---------------------------------------------------------------- code box
function CodeLine({ text, n, blank, size = 14, py = false }: { text: string; n: number; blank?: string | null; size?: number; py?: boolean }) {
  const parts = text.split('___');
  const colored = (s: string) => (py ? colorPy(s) : colorR(s)).map((p, i) => (<Text key={i} style={{ color: p.c }}>{p.t}</Text>));
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: size + 8 }}>
      <Text style={[monoBold(size - 3), { color: C.lilac, width: 18, textAlign: 'right' }]}>{n}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 1, flexWrap: 'wrap' }}>
        <Text style={[monoBold(size), { color: C.cream }]}>{colored(parts[0])}</Text>
        {parts.length > 1 &&
          (blank ? (
            <Enter kind="snap">
              <Text style={[monoBold(size), { backgroundColor: C.lime, borderRadius: 6, paddingHorizontal: 5 }]}>{blank}</Text>
            </Enter>
          ) : (
            <View style={{ width: 30, height: size, borderBottomWidth: 3, borderStyle: 'dashed', borderColor: C.lime }} />
          ))}
        {parts.length > 1 && <Text style={[monoBold(size), { color: C.cream }]}>{colored(parts[1])}</Text>}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------- answers
type Look = { bg: string; op: number; ok: boolean; x: boolean };

function Tick({ ok }: { ok: boolean }) {
  return <Ionicons name={ok ? 'checkmark' : 'close'} size={16} color={C.navy} />;
}

function Answers({ q, looks, pick }: { q: V2Question; looks: Record<string, Look>; pick: (id: string) => void }) {
  const opts = q.opts ?? [];
  const labels = opts.map((o) => o.label);
  const press = (o: V2Option, style: StyleProp<ViewStyle>, textSize: number, inner?: React.ReactNode) => {
    const L = looks[o.id];
    return (
      <Pressable key={o.id} onPress={() => pick(o.id)} accessibilityRole="button" accessibilityState={{ selected: L.bg === C.lime && !L.ok }} style={(s) => [style, { backgroundColor: L.bg, opacity: L.op }, pressDown(s)]}>
        {inner ?? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {(L.ok || L.x) && <Tick ok={L.ok} />}
            <Text style={monoBold(textSize)}>{o.label}</Text>
          </View>
        )}
      </Pressable>
    );
  };
  const box = { borderWidth: BORDER, borderColor: C.navy, alignItems: 'center' as const, justifyContent: 'center' as const };
  if (q.kind === 'fill') {
    if (labels.every((l) => l.length <= 3))
      return <View style={{ flexDirection: 'row', gap: 12 }}>{opts.map((o) => press(o, [box, { flex: 1, height: 64, borderRadius: 18 }], 28))}</View>;
    return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>{opts.map((o) => press(o, [box, { minWidth: 76, height: 52, paddingHorizontal: 18, borderRadius: 26 }], 18))}</View>;
  }
  if (labels.length === 3 && labels.every((l) => l.length <= 9 && !l.includes('\n')))
    return <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>{opts.map((o) => press(o, [box, { width: 104, height: 104, borderRadius: 52 }], 18))}</View>;
  if (labels.length === 4 && labels.every((l) => l.split('\n')[0].length <= 14))
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {opts.map((o) => press(o, [box, { width: '47%', minHeight: 56, borderRadius: 16, padding: 8, alignItems: 'flex-start' }], 14))}
      </View>
    );
  const longest = Math.max(...labels.flatMap((l) => l.split('\n').map((x) => x.length)));
  return (
    <View style={{ borderWidth: BORDER, borderColor: C.navy, borderRadius: 20, overflow: 'hidden', backgroundColor: C.card }}>
      {opts.map((o) =>
        press(
          o,
          { minHeight: 46, paddingHorizontal: 14, paddingVertical: 4, borderBottomWidth: 1.5, borderBottomColor: C.locked, flexDirection: 'row', alignItems: 'center' },
          14,
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <Text style={[monoBold(14), { color: C.lilac, alignSelf: 'flex-start' }]}>&gt;</Text>
            <Text style={[monoBold(longest <= 26 ? 14 : 13), { flex: 1 }]}>{o.label}</Text>
            {(looks[o.id].ok || looks[o.id].x) && <Tick ok={looks[o.id].ok} />}
          </View>,
        ),
      )}
    </View>
  );
}

function Paper({ q, looks, pick }: { q: V2Question; looks: Record<string, Look>; pick: (id: string) => void }) {
  const lines = q.lines ?? [];
  const longest = Math.max(...lines.map((l) => l.label.length));
  const size = longest <= 22 ? 15 : longest <= 26 ? 14 : 13;
  return (
    <View style={{ borderWidth: BORDER, borderColor: C.navy, borderRadius: 20, overflow: 'hidden', backgroundColor: C.card }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, height: 40, paddingHorizontal: 14, backgroundColor: C.cream, borderBottomWidth: 2, borderBottomColor: C.navy }}>
        <Ionicons name="document-text-outline" size={18} color={C.navy} />
        <Text style={monoBold(14)}>{q.file}</Text>
      </View>
      {lines.map((l, i) => {
        const L = looks[l.id];
        return (
          <Pressable key={l.id} onPress={() => pick(l.id)} accessibilityRole="button" accessibilityLabel={`Line ${i + 1}: ${l.label.trim()}`}
            style={(s) => [{ minHeight: lines.length >= 4 ? 48 : 58, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 14, borderLeftWidth: 6, borderLeftColor: L.bg === 'transparent' ? 'transparent' : C.navy, backgroundColor: L.bg, borderTopWidth: 1, borderTopColor: C.paper }, pressDown(s)]}>
            <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: C.navy, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={monoBold(13)}>{i + 1}</Text>
            </View>
            <Text style={[monoBold(size), { flex: 1 }]}>{l.label}</Text>
            {L.ok || L.x ? <Tick ok={L.ok} /> : longest <= 30 ? <Ionicons name="search" size={18} color={C.muted} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------- fix questions
/** Tap the line with the bug (given lines are green and locked); the other lines fold away and that line's own
 *  replacements appear. Tapping the line again unfolds the script. Lines with nothing to change say so. */
function FixPaper({ q, line, fix, setLine, setFix, checked, right, dark }: {
  q: V2Question; line: string | null; fix: string | null; setLine: (id: string | null) => void; setFix: (id: string) => void; checked: boolean; right: boolean; dark: boolean;
}) {
  const F = q.fix!;
  const longest = Math.max(...F.lines.map((l) => l.code.length));
  const size = longest <= 26 ? 14 : 13;
  const opts = line ? F.byLine[line] ?? [] : [];
  const n = (id: string) => F.lines.findIndex((l) => l.id === id) + 1;
  return (
    <View style={{ gap: 12 }}>
      <View style={{ borderWidth: BORDER, borderColor: '#E5484D', borderRadius: 20, overflow: 'hidden', backgroundColor: C.card }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 40, paddingHorizontal: 14, backgroundColor: C.peach, borderBottomWidth: 2, borderBottomColor: '#E5484D' }}>
          <Ionicons name="warning" size={18} color="#C0362C" />
          <Text style={[body(14, true), { color: '#9F1D18' }]}>Bug in <Text style={monoBold(14)}>{q.file}</Text></Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 14, paddingHorizontal: 14, paddingTop: 6, paddingBottom: 2 }}>
          <Text style={[body(11, true), { color: C.muted, width: 28, textAlign: 'center' }]}>Line</Text>
          <Text style={[body(11, true), { color: C.muted }]}>Code: tap the line with the bug</Text>
        </View>
        {F.lines.map((l, i) => {
          const sel = line === l.id;
          if (line && !sel && !l.given && !checked) return null; // the other lines fold away
          const bg = l.given ? C.successSheet : checked && sel ? (right ? C.lime : C.peach) : sel ? '#FFF1C9' : 'transparent';
          return (
            <Enter key={l.id} kind="drop" delay={line ? 0 : 40 * i}>
              <Pressable disabled={l.given || checked} onPress={() => setLine(sel ? null : l.id)} accessibilityRole="button"
                accessibilityLabel={`Line ${i + 1}: ${l.code.trim()}${l.given ? ', given as correct' : ''}`} accessibilityState={{ selected: sel, disabled: l.given }}
                style={(st) => [{ minHeight: 48, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 14, borderTopWidth: 1, borderTopColor: C.paper,
                  borderLeftWidth: 6, borderLeftColor: sel ? C.navy : 'transparent', backgroundColor: bg }, pressDown(st)]}>
                <Text style={[monoBold(13), { width: 28, textAlign: 'center', color: C.muted }]}>{i + 1}</Text>
                <Text style={[monoBold(size), { flex: 1, color: l.given ? '#2F6B0F' : C.navy }]}>{l.code}</Text>
                {l.given ? <Text style={[body(11, true), { color: '#2F6B0F' }]}>✓ correct</Text> : sel && checked ? <Tick ok={right} /> : null}
              </Pressable>
            </Enter>
          );
        })}
      </View>
      {line ? (
        <Enter key={`opts-${line}`} kind="drop">
          <Text style={[body(14, true), { color: dark ? C.cream : C.muted, marginBottom: 6 }]}>
            {opts.length === 0 ? `Line ${n(line)} looks right. Tap another line.` : `Change line ${n(line)} to:`}
          </Text>
          {opts.length > 0 && (
            <View style={{ borderWidth: BORDER, borderColor: C.navy, borderRadius: 20, overflow: 'hidden', backgroundColor: C.card }}>
              {opts.map((o, i) => {
                const sel = fix === o.id;
                const bg = checked ? (sel ? (right ? C.lime : C.peach) : C.card) : sel ? C.lime : dark ? (['#DCEEFF', '#FFF1C9', '#FFE3CF', '#FFD6E0'][i % 4]) : C.card;
                return (
                  <Pressable key={o.id} disabled={checked} onPress={() => setFix(o.id)} accessibilityRole="button" accessibilityState={{ selected: sel }}
                    style={(st) => [{ minHeight: 48, paddingHorizontal: 14, paddingVertical: 6, borderBottomWidth: 1.5, borderBottomColor: C.locked, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: bg, opacity: checked && !sel ? 0.45 : 1 }, pressDown(st)]}>
                    <Text style={[monoBold(14), { color: C.lilac }]}>&gt;</Text>
                    <Text style={[monoBold(size), { flex: 1 }]}>{o.label}</Text>
                    {checked && sel ? <Tick ok={right} /> : null}
                  </Pressable>
                );
              })}
            </View>
          )}
        </Enter>
      ) : (
        <Text style={[body(14, true), { color: dark ? C.cream : C.muted }]}>Tap the line you would change.</Text>
      )}
    </View>
  );
}

// ---------------------------------------------------------------- feedback sheet
function Sheet({ right, q, index, total = 5, line, onContinue, onRetry, robotForm, mood, earned }: {
  right: boolean; q: V2Question; index: number; total?: number; line: string; onContinue: () => void; onRetry: () => void; robotForm: Parameters<typeof RobotFace>[0]['form']; mood: Parameters<typeof RobotFace>[0]['mood']; earned: boolean;
}) {
  const anim = useSlideUp(true);
  return (
    <Animated.View style={[{ position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: 6, backgroundColor: right ? C.successSheet : C.missSheet, borderTopWidth: BORDER, borderTopColor: C.navy, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 30 }, anim]} accessibilityLiveRegion="polite">
      <Enter kind="pop" style={{ position: 'absolute', right: 14, top: -58 }}>
        <RobotFace form={robotForm} mood={mood} width={100} height={100} />
      </Enter>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text style={heading(30)} accessibilityRole="header">{right ? q.okTitle : 'Not quite'}</Text>
        {right && earned && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 2, borderRadius: 12, backgroundColor: C.navy }}>
            <Ionicons name="flash" size={13} color={C.sky} />
            <Text style={[body(14, true), { color: C.cream }]}>+10</Text>
          </View>
        )}
      </View>
      {right && q.eq.length > 0 && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 10 }} accessibilityLabel="Worked answer">
          {q.eq.map((x, i) =>
            typeof x === 'string' ? (
              <Text key={i} style={monoBold(18)}>{x}</Text>
            ) : (
              <Text key={i} style={[monoBold(18), { backgroundColor: x.c, borderRadius: 11, borderWidth: BORDER, borderColor: C.navy, paddingHorizontal: 9, paddingVertical: 2, overflow: 'hidden' }]}>{x.t}</Text>
            ),
          )}
        </View>
      )}
      <Text style={[body(16), { marginTop: 10, maxWidth: 250 }]}>{line}</Text>
      {right && (
        <>
          <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: C.card, borderWidth: 2, borderColor: C.navy }}>
            <Ionicons name="book-outline" size={18} color={C.navy} />
            <View style={{ flex: 1 }}>
              <Text style={[body(13, true), { color: C.muted }]}>Added to your lab notebook, {index + 1} of {total}</Text>
              <Enter kind="snap">
                <Text style={body(15, true)}>{q.entry}</Text>
              </Enter>
            </View>
          </View>
          <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="arrow-forward" size={16} color={C.navy} />
            <Text style={[body(15, true), { flex: 1 }]}>Next: {q.bridge}</Text>
          </View>
        </>
      )}
      <ChunkyButton title={right ? 'Continue' : 'Try again'} fill={right ? C.lime : C.orange} onPress={right ? onContinue : onRetry} style={{ marginTop: 14 }} />
    </Animated.View>
  );
}

// ---------------------------------------------------------------- the player
// Progress records score Fix questions as bug questions.
const asTrackQuestion = (q: V2Question): TrackQuestion => ({ id: q.id, kind: q.kind === 'fix' ? 'bug' : q.kind, prompt: q.ask, hint: q.hint, ok: q.ok });

export function LessonPlayerV2({ lesson, onFinish, onQuit }: { lesson: V2Lesson; onFinish: (r: RunResult) => void; onQuit: () => void }) {
  const app = useAppStore();
  const track = useTrackStore();
  const form = app.progress.currentForm;
  const [idx, setIdx] = useState(0);
  const [pick, setPick] = useState<string | null>(null);
  const [fixPick, setFixPick] = useState<string | null>(null);
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
  const isFix = q.kind === 'fix' && !!q.fix;
  const cp = !!lesson.checkpoint;
  const fixOk = (line: string | null, f: string | null) => !!q.fix && line === q.correct && !!q.fix.byLine[line]?.find((o) => o.id === f)?.correct;
  const picked = isBuild ? seq.length > 0 : isFix ? pick !== null && fixPick !== null : pick !== null;
  const right = checked && (isBuild ? seq.map(lab).join('|') === (q.correct as string[]).map(lab).join('|') : isFix ? fixOk(pick, fixPick) : pick === q.correct);
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
      let L: Look = { bg: q.kind === 'bug' ? 'transparent' : cp ? ['#DCEEFF', '#FFF1C9', '#FFE3CF', '#FFD6E0'][(q.opts ?? []).findIndex((x) => x.id === o.id) % 4] : C.card, op: 1, ok: false, x: false };
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
    const ok = isBuild ? seq.map(lab).join('|') === (q.correct as string[]).map(lab).join('|') : isFix ? fixOk(pick, fixPick) : pick === q.correct;
    if (ok && !missed.current.has(q.id)) setFirstTry((s) => new Set(s).add(q.id));
    if (!ok) missed.current.add(q.id);
  };
  const retry = () => {
    setPick(null);
    setFixPick(null);
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
    const result = track.record(lesson.id, lesson.questions.map(asTrackQuestion), firstTry);
    app.creditTrack(result.earned + result.bonus);
    track.addTime(Math.round((Date.now() - started.current) / 1000));
    onFinish(result);
  };
  const line = right
    ? q.ok
    : isBuild
      ? q.wrongBuild ?? 'Have another look.'
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
          <RobotFace form={form} mood={checked ? (right ? mood.ok : mood.bad) : mood.ask} width={64} height={70} />
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
                style={(s) => [{ borderRadius: 20, borderWidth: BORDER, borderColor: q.kind === 'bug' ? C.deepOrange : C.navy, backgroundColor: q.kind === 'bug' ? C.peach : q.kind === 'fill' && !cp ? '#FFF1C9' : C.card, padding: 12, paddingTop: 8, gap: 4 }, pressDown(s)]}>
                {!cp && (
                  <View style={{ position: 'absolute', right: 10, top: 10, zIndex: 2 }}>
                    <Chip label={field(lesson).chip} icon={field(lesson).icon} />
                  </View>
                )}
                {q.carry ? <Carry text={q.carry[0]} q={q.carry[1]} /> : <View style={{ height: 22 }} />}
                {q.pics.map((p, i) => (
                  <View key={i} style={{ marginTop: 4 }}>
                    <Picture p={p} solved={right} state={right ? 'go' : wrong ? 'nope' : 'idle'} pick={pick} />
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
            ) : q.kind === 'bug' ? (
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
        <Sheet key={`sheet-${idx}-${right}`} right={right} q={q} index={idx} total={lesson.notebook.length} line={line} onContinue={next} onRetry={retry} robotForm={form} mood={right ? mood.ok : mood.bad} earned={earned} />
      )}
      {quitting && <QuitSheet form={form} questionsDone={idx} total={lesson.questions.length} bolts={firstTry.size * 10} onKeep={() => setQuitting(false)} onLeave={onQuit} />}
    </View>
  );
}

// ---------------------------------------------------------------- goal and recap screens
function Notebook({ lesson, filled }: { lesson: V2Lesson; filled: boolean }) {
  return (
    <View style={{ borderRadius: 20, borderWidth: BORDER, borderColor: C.navy, backgroundColor: C.card, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <Ionicons name="book-outline" size={18} color={C.navy} />
        <Text style={heading(19)} accessibilityRole="header">Your lab notebook</Text>
      </View>
      {lesson.notebook.map(([lab, val], k) => (
        <Enter key={k} kind="rowIn" delay={150 + 80 * k}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 40, borderTopWidth: 1.5, borderTopColor: C.locked }}>
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: filled ? C.navy : C.locked, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={[body(13, true), { color: filled ? C.cream : C.navy }]}>{k + 1}</Text>
            </View>
            <Text style={[body(15, true), { flex: 1 }]}>{lab}</Text>
            {filled ? (
              <Enter kind="snap" delay={500 + 150 * k}>
                <Text numberOfLines={1} style={[body(14, true), { maxWidth: 170, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 2, borderColor: C.navy, backgroundColor: C.successSheet, overflow: 'hidden' }]}>{val}</Text>
              </Enter>
            ) : (
              <View style={{ width: 44, height: 26, borderRadius: 8, borderWidth: 2, borderStyle: 'dashed', borderColor: C.lockedEdge, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={[monoBold(14), { color: '#B8AE95' }]}>?</Text>
              </View>
            )}
          </View>
        </Enter>
      ))}
    </View>
  );
}

function Segments({ done, total = 5 }: { done: number; total?: number }) {
  return (
    <View style={{ flex: 1, flexDirection: 'row', gap: 6 }} accessibilityRole="progressbar" accessibilityLabel={`${done} of ${total} questions done`}>
      {Array.from({ length: total }, (_, i) => (
        <View key={i} style={{ flex: 1, height: 12, borderRadius: 6, borderWidth: BORDER, borderColor: C.navy, backgroundColor: i < done ? C.lime : C.locked }} />
      ))}
    </View>
  );
}

export function LessonIntroV2({ lesson, onStart, onClose }: { lesson: V2Lesson; onStart: () => void; onClose: () => void }) {
  const form = useAppStore().progress.currentForm;
  const cp = !!lesson.checkpoint;
  return (
    <View style={{ flex: 1, backgroundColor: cp ? C.screen : C.cream }}>
      {!cp && <DottedBackground />}
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 8, paddingRight: 16, height: 44 }}>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Back to Learn" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="close" size={26} color={cp ? C.cream : C.navy} />
          </Pressable>
          <Segments done={0} total={lesson.questions.length} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 110 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Enter kind="pop">
              <RobotFace form={form} mood="excited" width={92} height={92} />
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

export function LessonRecapV2({ lesson, onContinue }: { lesson: V2Lesson; onContinue: () => void }) {
  const form = useAppStore().progress.currentForm;
  const [open, setOpen] = useState(false);
  const cp = !!lesson.checkpoint;
  return (
    <View style={{ flex: 1, backgroundColor: cp ? '#D9F2A6' : C.cream }}>
      {!cp && <DottedBackground />}
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 60, paddingRight: 16, height: 44 }}>
          <Segments done={lesson.questions.length} total={lesson.questions.length} />
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
      {cp && <Confetti />}
    </View>
  );
}

