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
  return load('lessons') ?? { phases: [] };
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
  if (name === 'track_bio_r_updated') return withBiologyV3(t);
  if (name === 'track_hx_py') return withHealthcareV3(t, 'healthcare_python_v3', 'hx_py');
  if (name === 'track_hx_r') return withHealthcareV3(t, 'healthcare_r_v3', 'hx_r');
  return t;
}

/** Healthcare lessons and its one checkpoint per phase live in the V3 files; the track file only lists them.
 *  Fills in their questions (same ids the lesson player records) so stars, the phase gate and the path count them. */
function withHealthcareV3(t: Track, file: string, prefix: string): Track {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const v3: any[] = (CONTENT[file] as any)?.phases ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const questions = (it: any): TrackQuestion[] => (it?.questions ?? []).map((q: any, i: number) => ({
    id: `${it.id}_q${i + 1}`, kind: q.kind === 'fix' ? 'bug' : q.kind, prompt: q.ask, hint: q.hint_before_check ?? '', ok: [q.explanation_after_check, q.takeaway].filter(Boolean).join(' '),
  }));
  return { ...t, phases: t.phases.map((p) => {
    const items = v3.find((x) => x.phase === p.number)?.items ?? [];
    return {
      ...p,
      lessons: p.lessons.map((l) => ({ ...l, questions: questions(items.find((i: { type: string; part: number }) => i.type === 'lesson' && `${prefix}_p${p.number}_l${i.part}` === l.id)) })),
      checkpoint: { ...p.checkpoint, questions: questions(items.find((i: { type: string }) => i.type === 'checkpoint')) },
    };
  }) };
}

/** Biology research R now has five lessons per phase, each followed by its own checkpoint (assets/content/biology_r_v3.json).
 *  Lesson ids stay bio_p{phase}_l{part}; legacy lessons keep their original questions. */
function withBiologyV3(t: Track): Track {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const v3 = ((CONTENT['biology_r_v3'] as any)?.phases ?? []).map((p: any) => ({ phase: p.phase as number, // eslint-disable-line @typescript-eslint/no-explicit-any
    lessons: p.items.filter((i: any) => i.type === 'lesson').map((i: any) => ({ part: i.part as number, title: i.title as string })) })); // eslint-disable-line @typescript-eslint/no-explicit-any
  return { ...t, phases: t.phases.map((p) => {
    const ph = v3.find((x: { phase: number }) => x.phase === p.number);
    if (!ph) return p;
    const lessons = [1, 2, 3, 4, 5].map((k) => {
      const old = p.lessons.find((l) => l.id === `bio_p${p.number}_l${k}`);
      const title = ph.lessons.find((l: { part: number }) => l.part === k)?.title ?? old?.title ?? `Lesson ${k}`;
      return { id: `bio_p${p.number}_l${k}`, part: k, title, questions: old?.questions ?? [] };
    });
    return { ...p, lessons };
  }) };
}
