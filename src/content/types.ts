// Types for the bundled content: the V3 lesson files (*_v3.json), the track files (track_*.json), and the shapes the
// loader turns them into for the screens (plan §1.4). JSON is cast to these once, in services/contentLoader.ts.

// ---------- V3 lesson files ----------

/** A picture's look after Check. Each picture type has its own state shape; see the union below. */
interface PictureBase<T extends string, S> {
  type: T;
  label: string;
  description?: string;
  correct_state: S;
  states?: { idle?: string; correct?: string; wrong_by_option?: Record<string, S> };
}
/** A state that is a value (or values) plus the caption shown under the picture. */
type Captioned<V> = [V, string];
export type BeltRoute = 'bin' | 'stay' | 'floor' | 'juice';

export type TilesPicture = PictureBase<'tiles', Captioned<number[]>> & { args: [text: string, ...rest: unknown[]]; options?: { base?: number; neg?: boolean; icon?: string | null } };
export type RateBarsPicture = PictureBase<'ratebars', Captioned<number[]>> & {
  args: [names: string[], ...rest: unknown[]];
  options?: { vmax?: number; line?: number | null; line_label?: string; good_high?: boolean };
};
export type DotsState = { lit?: number[]; mean?: number; median?: number; text?: string };
export type DotsPicture = PictureBase<'dots', DotsState> & { args: [values: number[], vmax: number, ...rest: unknown[]] };
export type StepsPicture = PictureBase<'steps', Captioned<number[]>> & { options?: { ymin?: number } };
export type StrandsPicture = PictureBase<'strands', Captioned<string>> & { args: [top: string, ...rest: unknown[]] };
export type ThermoPicture = PictureBase<'thermo', Captioned<number>> & { options?: { vmax?: number } };
export type CircuitPicture = PictureBase<'circuit', Captioned<number>> & { args: [volts: number, resistors?: number[]] };
export type BatteryPicture = PictureBase<'battery', Captioned<number>>;
export type GaugePicture = PictureBase<'gauge', Captioned<number>> & {
  options?: { bands?: [lo: number, hi: number, colour: string, label: string][]; vmin?: number; vmax?: number };
};
export type BeltPicture = PictureBase<'belt', Captioned<[sprite: string, route: BeltRoute, badge: string | null][]>> & { options?: { juice?: boolean } };

/** Any JSON value a state card's caption is read from (its text field, or the last piece of text in it). */
export type CardState = string | number | boolean | null | CardState[] | { text?: string; [key: string]: unknown };
/** A device picture's screen: its idle image and one count-up strip per state ('correct' or an option id). */
export interface DeviceAssets {
  idle_frame: string;
  display_size_px?: number;
  screen_box_display_px: { x: number; y: number; w: number; h: number };
  strips?: Record<string, { strip: string; frames: number }>;
}
export type DevicePicture = PictureBase<'calc' | 'till' | 'device', CardState> & { assets: DeviceAssets | { device: DeviceAssets } };
export type CardPicture = PictureBase<
  'balance' | 'change' | 'dftable' | 'drain' | 'flowmeter' | 'gcs_chart' | 'grid2' | 'labelcard' | 'lamps' | 'piggy' | 'stays_pic' | 'transfusion' | 'ward' | 'wards',
  CardState
> & {
  icon_asset?: string;
  assets?: { pig?: string; pile?: string; note?: string; face?: string; bag?: { empty?: string }; device?: { idle_frame?: string } };
};

export type Picture =
  | TilesPicture | RateBarsPicture | DotsPicture | StepsPicture | StrandsPicture | ThermoPicture
  | CircuitPicture | BatteryPicture | GaugePicture | BeltPicture | DevicePicture | CardPicture;
export type PictureType = Picture['type'];

export interface Note { title: string; text: string }
/** One piece of a worked line: plain text, or text with its own colour. */
export type WorkedPiece = string | { t: string; c: string };

interface QuestionBase {
  number: number;
  label: string;
  ask: string;
  xp?: number;
  known_from_earlier?: string[];
  hint_before_check?: string | null;
  explanation_after_check?: string;
  takeaway?: string | null;
  next_bridge?: string | null;
  code_note?: Note | null;
  science_note?: Note | null;
  scene_label?: string | null;
  picture?: Picture[];
  worked?: WorkedPiece[];
  goal_output?: string[];
  script_file?: string;
}
export interface ChoiceOption { id: string; label: string; correct: boolean; feedback: string | null }
/** Predict or fill: pick one option. The right option has id "a"; a fill's code marks the blank with ___. */
export interface ChoiceQuestion extends QuestionBase {
  kind: 'predict' | 'fill';
  code: string[];
  options: ChoiceOption[];
}
export interface FixLine { id: string; code: string; given_correct: boolean }
export interface FixReplacement { id: string; replacement: string; correct: boolean; feedback: string | null }
/** Fix: tap the buggy line, then pick its replacement. */
export interface FixQuestion extends QuestionBase {
  kind: 'fix';
  lines: FixLine[];
  buggy_line: string;
  fixes_by_line: Record<string, FixReplacement[]>;
  wrong_line_feedback?: Record<string, string>;
  output_after_fix?: string | null;
}
export type Question = ChoiceQuestion | FixQuestion;
export type QuestionKind = Question['kind'];

/** A lesson or a phase checkpoint in a V3 file. */
export interface Item {
  id: string;
  type: 'lesson' | 'checkpoint';
  part: number;
  title: string;
  person: string;
  intro: string;
  script_file: string;
  start_button?: string;
  notebook: { label: string; value: string }[];
  recap?: { title: string; subtitle: string; celebration?: string };
  questions: Question[];
}
export interface ContentPhase {
  phase: number;
  title: string;
  items: Item[];
}
export interface ContentFile {
  track: { id: string; name: string; language: string; phases: number; lessons_per_phase?: number; checkpoints?: boolean };
  phases: ContentPhase[];
}

// ---------- Track files ----------

/** A phase of a track file: the path's text and pictures. Lessons and the checkpoint get their questions from the V3 file. */
export interface TrackFilePhase {
  number: number;
  area: string;
  project: string;
  picture: string;
  skill: string;
  parts: string[][];
  code: string[];
  lessons: { id: string; part: number; title: string }[];
  checkpoint: { id: string; name: string; unlock: string[] };
}
export interface TrackCycle2 {
  area: string;
  project: string;
  picture: string;
  titles: string[];
  later: string[][];
}
export interface TrackFile {
  id: string;
  title: string;
  language: string;
  phases: TrackFilePhase[];
  cycle2: TrackCycle2;
}

// ---------- What the screens use ----------

/** A question as progress counts it: stars and bolts are recorded per question id. */
export interface TrackQuestion { id: string; kind: QuestionKind }
export interface TrackLesson { id: string; part: number; title: string; questions: TrackQuestion[] }
export interface TrackCheckpoint { id: string; name: string; unlock: string[]; questions: TrackQuestion[] }
export interface TrackPhase extends Omit<TrackFilePhase, 'lessons' | 'checkpoint'> {
  lessons: TrackLesson[];
  checkpoint: TrackCheckpoint;
}
export interface Track extends Omit<TrackFile, 'phases'> {
  phases: TrackPhase[];
}

/** The lesson player's question: a V3 question with its texts resolved and the right answer named. */
export interface PlayerQuestion {
  id: string;
  kind: QuestionKind;
  word: string;
  okTitle: string;
  ask: string;
  hint: string;
  ok: string;
  fb: Record<string, string>;
  bridge: string;
  entry: string;
  label: string;
  science: Note;
  codeNote: Note;
  pics: Picture[];
  eq: WorkedPiece[];
  goal: string[];
  earlier: string | null;
  code: string[];
  opts?: { id: string; label: string }[];
  correct: string;
  file?: string;
  after?: string;
  /** Fix questions: every line of the script, which are given as correct, and each line's own replacements. */
  fix?: { lines: { id: string; code: string; given: boolean }[]; byLine: Record<string, { id: string; label: string; correct: boolean; feedback: string | null }[]> };
}
/** The lesson player's lesson or checkpoint, under its app id. */
export interface PlayerLesson {
  id: string;
  domain: Domain;
  lang: CodeLang;
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
  questions: PlayerQuestion[];
  /** Checkpoints: navy page, coloured options, no hints or notes, green confetti recap. */
  checkpoint: boolean;
  /** Lessons in this phase. */
  parts: number;
}

/** Which field a track belongs to: sets the lesson chip, icon and note wording (FIELDS in content/tracks.ts). */
export type Domain = 'bio' | 'eng' | 'health' | 'fin' | 'gen';
/** Code colouring: Python's rules for 'py', the R-style rules for the rest. */
export type CodeLang = 'py' | 'r' | 'sql' | 'js' | 'matlab' | 'java';
