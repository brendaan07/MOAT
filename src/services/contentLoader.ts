// Finds and loads the bundled lesson and track files for a learner's field and language.
import { Course, Track } from '../types/models';
import { CONTENT } from '../utils/content';
import { canonicalArea } from '../utils/studyAreas';
import { addingGames } from './gameCatalog';

/** "Physics & maths" becomes "lessons_physics_and_maths"; several areas share the life sciences file. */
function fileName(studyArea: string): string {
  const cleaned = canonicalArea(studyArea).toLowerCase().replace(/&/g, 'and').replace(/ /g, '_');
  const map: Record<string, string> = {
    health_sciences: 'life_sciences',
    healthcare: 'life_sciences',
    biology_research: 'life_sciences',
    business_and_finance: 'business',
  };
  return `lessons_${map[cleaned] ?? cleaned}`;
}

/** The lesson file for a programming language other than Python (Python lessons come from the field file). */
function languageFileName(language: string): string | null {
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
  return load('lessons_life_sciences') ?? { phases: [] };
}

/** Which languages have project tracks for each field (onboarding shows these). */
export const TRACK_LANGUAGES: Record<string, string[]> = { 'Biology research': ['R'], Engineering: ['Python'], Healthcare: ['Python', 'R'] };

/** The track file for a field and language, or null when that pair uses the general lessons. */
function trackFileFor(studyArea: string, language: string): string | null {
  const area = canonicalArea(studyArea);
  if (area === 'Biology research') return 'track_bio_r';
  if (area === 'Engineering' && language === 'Python') return 'track_eng_py';
  if (area === 'Healthcare' && language === 'Python') return 'track_health_py';
  if (area === 'Healthcare' && language === 'R') return 'track_health_r';
  return null;
}

/** True when this field and language have a project track. */
export const hasTrack = (studyArea: string, language: string) => trackFileFor(studyArea, language) !== null;

/** The project track for this learner's field and language (Biology research in R by default). */
export function loadTrack(studyArea = 'Biology research', language = 'R'): Track | null {
  const name = trackFileFor(studyArea, language);
  const t = name ? (CONTENT[name] as Track | undefined) : undefined;
  return t && Array.isArray(t.phases) ? t : null;
}
