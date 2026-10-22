// Easing curves shared by the app's animations.
import { Easing } from 'react-native';

/** Fast start, gentle stop: the default ease for slides, fills and count-ups. */
export const EASE_OUT = Easing.bezier(0.2, 0.8, 0.2, 1);
