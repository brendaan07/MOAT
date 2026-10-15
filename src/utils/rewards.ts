// Every number that decides how many bolts a learner earns, in one place so the screens and stores agree.

/** General path: bolts for each question right on the first try. */
export const BOLTS_PER_CORRECT = 5;
/** General path: bolts for finishing a lesson or a game. */
export const BOLTS_FOR_FINISHING = 10;

/** Project tracks: bolts for each question right on the first try (only if it never paid before). */
export const TRACK_BOLTS_PER_QUESTION = 10;
/** Project tracks: extra bolts for a perfect first attempt at a lesson or checkpoint. */
export const TRACK_PERFECT_BONUS = 30;

/** Minutes of learning per day that count as the daily goal. */
export const DAILY_GOAL_MINUTES = 10;
/** Bolts the stat bubble promises for reaching the daily goal. */
export const DAILY_GOAL_BONUS_BOLTS = 20;
