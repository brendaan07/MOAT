// Easing curves shared by the app's animations.
import { Easing } from 'react-native';

/** Fast start, gentle stop: the default ease for slides, fills and count-ups. */
export const EASE_OUT = Easing.bezier(0.2, 0.8, 0.2, 1);
/** Softer in and out, for the lesson pictures acting out an answer. */
export const EASE_PICTURE = Easing.bezier(0.3, 0.7, 0.3, 1);
/** Overshoots a little before settling, for pops. */
export const EASE_BOUNCE = Easing.bezier(0.3, 1.5, 0.5, 1);
