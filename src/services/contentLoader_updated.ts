import { Course, Track, TrackQuestion } from '../types/models';
import { CONTENT } from '../utils/content_updated';
import { canonicalArea } from '../utils/studyAreas';
import { addingGames } from './gameCatalog';

/** "Physics & maths" becomes "lessons_physics_and_maths"; several areas share the life sciences file. */
export function fileName(studyArea: string): string {
  const cleaned = canonicalArea(studyArea).toLowerCase().replace(/&/g, 'and').replace(/ /g, '_');
  const map: Record<string, string> = {
    health_sciences: 'life_sciences',
    healthcare: 'life_sciences',
    biology_research: 'life_sciences',
    business_and_finance: 'business',
  };
  return `lessons_${map[cleaned] ?? cleaned}`;
}

export function languageFileName(language: string): string | null {
  return { R: 'lessons_r', SQL: 'lessons_sql', JavaScript: 'lessons_javascript', MATLAB: 'lessons_matlab', Java: 'lessons_java' }[language] ?? null;
}

function load(name: string): Course | null {
  const data = CONTENT[name] as Course | undefined;
  if (!data || !Array.isArray(data.phases)) {
    if (__DEV__) console.warn(`MOAT warning: ${name}.json is missing or could not be read.`);
    return null;
  }
  return data;
}

/** ContentLoader.loadBundled: language files first, then the study-area file with its games, then the default. */
export function loadBundled(studyArea = 'Health Sciences', language = 'Python'): Course {
  const lang = languageFileName(language);
  if (lang) {
    const course = load(lang);
    if (course) return course;
  }
  const course = load(fileName(studyArea));
  if (course) return addingGames(course, studyArea);
  return load('lessons_general') ?? { phases: [] };
}

/** Which languages have project tracks for each field (onboarding shows these). */
export const TRACK_LANGUAGES: Record<string, string[]> = { 'Biology research': ['R'], Engineering: ['Python'], Healthcare: ['Python', 'R'], 'Business & finance': ['Python'] };

/** The track file for a field and language, or null when that pair uses the general lessons. */
export function trackFileFor(studyArea: string, language: string): string | null {
  const area = canonicalArea(studyArea);
  if (area === 'Biology research') return 'track_bio_r_updated';
  if (area === 'Engineering' && language === 'Python') return 'track_eng_py';
  // Healthcare: phases 1 to 5, each lesson followed by its checkpoint
  if (area === 'Healthcare' && language === 'Python') return 'track_hx_py';
  if (area === 'Healthcare' && language === 'R') return 'track_hx_r';
  if (area === 'Business & finance' && language === 'Python') return 'track_fin_py';
  return null;
}

export const hasTrack = (studyArea: string, language: string) => trackFileFor(studyArea, language) !== null;

/** The project track for this learner's field and language (Biology research in R by default). */
export function loadTrack(studyArea = 'Biology research', language = 'R'): Track | null {
  const name = trackFileFor(studyArea, language);
  const t = name ? (CONTENT[name] as Track | undefined) : undefined;
  if (!t || !Array.isArray(t.phases)) return null;
  if (name === 'track_bio_r_updated') return withV3(t, 'biology_r_v3', 'bio', (n) => `bio_p${n}_cp`);
  if (name === 'track_hx_py') return withV3(t, 'healthcare_python_v3', 'hx_py', (n) => `hx_py_cp${n}`);
  if (name === 'track_hx_r') return withV3(t, 'healthcare_r_v3', 'hx_r', (n) => `hx_r_cp${n}`);
  if (name === 'track_fin_py') return withV3(t, 'finance_python_v3', 'fin_py', (n) => `fin_py_cp${n}`);
  return t;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
/** A V3 item's questions, under the ids the lesson player records (<itemId>_q<n>). */
const v3Questions = (it: any): TrackQuestion[] => (it?.questions ?? []).map((q: any, i: number) => ({
  id: `${it.id}_q${i + 1}`, kind: q.kind === 'fix' ? 'bug' : q.kind, prompt: q.ask, hint: q.hint_before_check ?? '', ok: [q.explanation_after_check, q.takeaway].filter(Boolean).join(' '),
}));
/** A V2 lesson's questions (lessons not rebuilt in V3 yet), under the ids the lesson player records. */
const v2Questions = (id: string): TrackQuestion[] | null => {
  const l = ((CONTENT['track_bio_r_lessons_v2'] as any)?.lessons ?? []).find((x: any) => x.id === id);
  return l ? l.questions.map((q: any) => ({ id: q.id, kind: q.kind === 'fix' ? 'bug' : q.kind, prompt: q.ask, hint: q.hint, ok: q.ok })) : null;
};

/** V3 tracks: the track file holds the path (phases, checkpoint text, project code); the V3 file holds the lessons.
 *  Lessons come from the V3 lesson items, ids <prefix>_p<phase>_l<part>, with their questions filled in so stars, the
 *  phase gate and the path count them. An item still marked `status` (not rebuilt yet) keeps its V2 or track questions.
 *  The phase checkpoint takes its questions from the phase's checkpoint item when there is exactly one; otherwise the
 *  track file's checkpoint stays as it is. */
function withV3(t: Track, file: string, prefix: string, checkpointId: (phase: number) => string): Track {
  const v3: any[] = (CONTENT[file] as any)?.phases ?? [];
  return { ...t, phases: t.phases.map((p) => {
    const items: any[] = v3.find((x) => x.phase === p.number)?.items ?? [];
    if (!items.length) return p;
    const lessons = items.filter((i) => i.type === 'lesson').sort((a, b) => a.part - b.part).map((it) => {
      const id = `${prefix}_p${p.number}_l${it.part}`;
      const old = p.lessons.find((l) => l.id === id);
      const questions = it.status ? v2Questions(id) ?? old?.questions ?? [] : v3Questions(it);
      return { id, part: it.part as number, title: (it.title as string) ?? old?.title ?? `Lesson ${it.part}`, questions };
    });
    const cps = items.filter((i) => i.type === 'checkpoint' && !i.status);
    const checkpoint = cps.length === 1 ? { ...p.checkpoint, id: checkpointId(p.number), questions: v3Questions(cps[0]) } : p.checkpoint;
    return { ...p, lessons, checkpoint };
  }) };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
