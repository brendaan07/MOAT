// The only place the bundled JSON is read: it builds the learner's track and the lesson player's lessons from the
// track files and V3 files the TRACKS registry names.
import { CONTENT } from '../utils/content';
import { TRACKS, TrackEntry, codeLangOf, trackFor } from '../content/tracks';
import type { ContentFile, Item, PlayerLesson, PlayerQuestion, QuestionKind, Track, TrackFile, TrackQuestion } from '../content/types';

const contentFile = (name: string) => CONTENT[name] as ContentFile | undefined;

/** An item's questions as progress counts them, under the ids the lesson player records (<itemId>_q<n>). */
const progressQuestions = (it: Item): TrackQuestion[] => it.questions.map((q, i) => ({ id: `${it.id}_q${i + 1}`, kind: q.kind }));

/** The learner's track: the track file holds the path (phases, checkpoint text, project code); the V3 file holds the
 *  lessons. Lessons come from the V3 lesson items, ids <prefix>_p<phase>_l<part>, with their questions filled in so
 *  stars, the phase gate and the path count them. The phase checkpoint takes its questions from the phase's checkpoint
 *  item; a phase without one (the general tracks) has a checkpoint with no questions, which the path hides. */
export function loadTrack(studyArea: string, language: string): Track | null {
  const entry = trackFor(studyArea, language);
  const file = entry ? (CONTENT[entry.trackFile] as TrackFile | undefined) : undefined;
  if (!entry || !file || !Array.isArray(file.phases)) return null;
  const v3 = contentFile(entry.v3File)?.phases ?? [];
  return {
    ...file,
    phases: file.phases.map((p) => {
      const items = v3.find((x) => x.phase === p.number)?.items ?? [];
      const lessons = items.filter((i) => i.type === 'lesson').sort((a, b) => a.part - b.part)
        .map((it) => ({ id: `${entry.prefix}_p${p.number}_l${it.part}`, part: it.part, title: it.title, questions: progressQuestions(it) }));
      const cps = items.filter((i) => i.type === 'checkpoint');
      const checkpoint = { ...p.checkpoint, id: entry.checkpointId(p.number), questions: cps.length === 1 ? progressQuestions(cps[0]) : [] };
      return { ...p, lessons, checkpoint };
    }),
  };
}

/** The colour under each question's kind word. */
const WORD_COLOUR: Record<QuestionKind, string> = { predict: '#B5E04A', fill: '#FFC93C', fix: '#FF8A3D' };

/** A V3 lesson or checkpoint in the lesson player's shape. */
function playerLesson(it: Item, phase: number, phaseTitle: string, tr: TrackEntry, parts: number): PlayerLesson {
  const cp = it.type === 'checkpoint';
  const questions = it.questions.map((q, i): PlayerQuestion => {
    const nb = it.notebook[i];
    const base = {
      id: `${it.id}_q${i + 1}`, kind: q.kind, word: q.label, color: WORD_COLOUR[q.kind],
      ask: q.ask, hint: q.hint_before_check ?? '', ok: [q.explanation_after_check, q.takeaway].filter(Boolean).join(' '),
      bridge: q.next_bridge ?? 'carry on.', entry: nb ? `${nb.label}: ${nb.value}` : '', label: q.picture?.[0]?.label ?? '',
      science: q.science_note ?? { title: '', text: '' }, codeNote: q.code_note ?? { title: '', text: '' },
      pics: q.picture ?? [], eq: q.worked ?? [], goal: q.goal_output ?? [], file: q.script_file ?? it.script_file,
    };
    if (q.kind === 'fix') {
      return {
        ...base, okTitle: 'Fixed', fb: { ...(q.wrong_line_feedback ?? {}) }, earlier: null, code: [], correct: q.buggy_line,
        after: q.output_after_fix ?? undefined,
        fix: {
          lines: q.lines.map((l) => ({ id: l.id, code: l.code, given: !!l.given_correct })),
          byLine: Object.fromEntries(Object.entries(q.fixes_by_line).map(([k, v]) => [k, v.map((o) => ({ id: o.id, label: o.replacement, correct: !!o.correct, feedback: o.feedback }))])),
        },
      };
    }
    const fb: Record<string, string> = {};
    for (const o of q.options) if (o.feedback) fb[o.id] = o.feedback;
    return {
      ...base, okTitle: 'Correct', fb, code: q.code, correct: 'a',
      earlier: q.known_from_earlier?.length ? `Known from earlier:  ${q.known_from_earlier.join('   ')}` : null,
      opts: q.options.map((o) => ({ id: o.id, label: o.label })),
    };
  });
  const last = it.questions[it.questions.length - 1];
  const script = !last ? [] : last.kind === 'fix' ? last.lines.map((l) => l.code) : last.code;
  return {
    id: cp ? tr.checkpointId(phase) : `${tr.prefix}_p${phase}_l${it.part}`, lang: codeLangOf(tr), domain: tr.domain, phase, part: it.part, title: it.title,
    project: `${tr.name}, phase ${phase}: ${phaseTitle}`, person: it.person, intro: it.intro,
    start: it.start_button ?? (cp ? 'Start the checkpoint' : 'Start'), doneTitle: it.recap?.title ?? 'Done', doneSub: it.recap?.subtitle ?? '',
    file: it.script_file, notebook: it.notebook.map((n) => [n.label, n.value]), script, questions, checkpoint: cp, parts,
  };
}

let lessons: Record<string, PlayerLesson> | null = null;
/** The player-ready lesson or checkpoint for an app id (see TRACKS), or null for an unknown id. Built once, on first use. */
export function lessonFor(id: string): PlayerLesson | null {
  if (!lessons) {
    lessons = {};
    for (const tr of TRACKS) for (const ph of contentFile(tr.v3File)?.phases ?? []) {
      const parts = ph.items.filter((x) => x.type === 'lesson').length;
      for (const it of ph.items) {
        const l = playerLesson(it, ph.phase, ph.title, tr, parts);
        lessons[l.id] = l;
      }
    }
  }
  return lessons[id] ?? null;
}
