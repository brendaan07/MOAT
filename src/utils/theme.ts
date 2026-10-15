// Colours, the border width and the text styles every screen uses. They match the design canvas.
import { Platform, TextStyle } from 'react-native';

/** The colour palette. */
export const C = {
  cream: '#FBF4E4',
  card: '#FFFDF6',
  navy: '#1B2472',
  muted: '#4A527F',
  lime: '#B5E04A',
  sky: '#59B4FF',
  orange: '#FF8A3D',
  logo: '#015E78',
  locked: '#E3DCCB',
  lockedText: '#5C5648',
  lockedEdge: '#C4BBA5',
  successSheet: '#E4F5B8',
  missSheet: '#FFE3CF',
  hintBlue: '#DCEEFF',
  premiumBand: '#2E3A9E',
  premiumText: '#B8C4FF',
  /** Dims a locked phase on the path and the area behind the paywall. */
  lockedOverlay: 'rgba(27,36,114,0.55)',
  wrongChip: '#FFD3B0',
  // Track kit
  navyDeep: '#141A5C',
  screen: '#171E63',
  editor: '#0B0F3D',
  shadowDark: '#0A0E3A',
  sun: '#FFC93C',
  peach: '#FFE3CF',
  lavender: '#B8C4FF',
  lilac: '#8A94D6',
  deepOrange: '#E0762A',
  grey: '#8F8873',
  paper: '#F1EADB',
  errBg: '#3B1030',
  errText: '#FFB4A2',
  number: '#FFA866',
  fn: '#7CC4FF',
  keyword: '#FF9B63',
  // Colours for code in the loop and stage games
  codeKeyword: '#3B4BD8',
  codeNumber: '#B5471B',
  codeString: '#1F7A4D',
};

/** The thick navy outline used on cards, buttons and chips. */
export const BORDER = 2.5;

const mono = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

/** Font files loaded in App.tsx, named by their PostScript names. */
export const FONTS = {
  heading: 'Baloo2-ExtraBold',
  body: 'AtkinsonHyperlegible-Regular',
  bodyBold: 'AtkinsonHyperlegible-Bold',
};

/** Headings: Baloo 2 ExtraBold, as on the design canvas. No fontWeight, so Android keeps the custom font. */
export const heading = (size: number): TextStyle => ({ fontSize: size, fontFamily: FONTS.heading, color: C.navy });
/** Body text: Atkinson Hyperlegible, regular or bold. */
export const body = (size: number, bold = false): TextStyle => ({ fontSize: size, fontFamily: bold ? FONTS.bodyBold : FONTS.body, color: C.navy });
/** Monospaced text: semibold for code, bold for small labels. */
export const code = (size: number): TextStyle => ({ fontSize: size, fontFamily: mono, fontWeight: '600', color: C.navy });
export const monoBold = (size: number): TextStyle => ({ fontSize: size, fontFamily: mono, fontWeight: '700', color: C.navy });
/** The MOAT wordmark font, registered as "Horizon-Bold" in App.tsx. */
export const wordmark = (size: number): TextStyle => ({ fontSize: size, fontFamily: 'Horizon-Bold' });
