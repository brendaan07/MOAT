// Colours, fonts and text styles.
import { Platform, TextStyle } from 'react-native';

/** Colours from Theme.swift and TrackKit_updated.swift (they match the design canvas). */
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
  lockedBand: '#2E3A9E',
  lockedBandText: '#B8C4FF',
  // Track kit
  navyDeep: '#141A5C',
  screen: '#171E63',
  editor: '#0B0F3D',
  sun: '#FFC93C',
  peach: '#FFE3CF',
  lavender: '#B8C4FF',
  lilac: '#8A94D6',
  deepOrange: '#E0762A',
  grey: '#8F8873',
  paper: '#F1EADB',
  errText: '#FFB4A2',
  number: '#FFA866',
  fn: '#7CC4FF',
  keyword: '#FF9B63',
  // Lesson screens
  highlight: '#FFF1C9',
  pink: '#FFD6E0',
  chipLight: '#E9ECFF',
  red: '#E5484D',
  green: '#2F8F4E',
  greenText: '#2F6B0F',
  brownText: '#9A3F0A',
  scrim: 'rgba(27,36,114,0.35)',
  lockedOverlay: 'rgba(27,36,114,0.55)',
};

/** The outline width every card and button uses. */
export const BORDER = 2.5;

const mono = Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' });

/** Font files loaded in App.tsx, named by their PostScript names. */
const FONTS = {
  heading: 'Baloo2-ExtraBold',
  body: 'AtkinsonHyperlegible-Regular',
  bodyBold: 'AtkinsonHyperlegible-Bold',
};

/** Headings: Baloo 2 ExtraBold, as on the design canvas. No fontWeight, so Android keeps the custom font. */
export const heading = (size: number): TextStyle => ({ fontSize: size, fontFamily: FONTS.heading, color: C.navy });
/** Body text: Atkinson Hyperlegible, regular or bold. */
export const body = (size: number, bold = false): TextStyle => ({ fontSize: size, fontFamily: bold ? FONTS.bodyBold : FONTS.body, color: C.navy });
/** Bold monospaced code text (TK.mono). */
export const monoBold = (size: number): TextStyle => ({ fontSize: size, fontFamily: mono, fontWeight: '700', color: C.navy });
/** The MOAT wordmark font, registered as "Horizon-Bold" like FontLoader in the Swift app. */
export const wordmark = (size: number): TextStyle => ({ fontSize: size, fontFamily: 'Horizon-Bold' });
