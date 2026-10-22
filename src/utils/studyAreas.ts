// The study areas onboarding offers, and the names older versions saved.
export const STUDY_AREAS = ['Healthcare', 'Biology research', 'Engineering', 'Business & finance', 'Physics & maths', 'Arts & humanities', 'General'];

/** Turns a study area saved by an older version into today's name. */
export function canonicalArea(name: string): string {
  switch (name) {
    case 'Life sciences':
    case 'Health sciences':
    case 'Health Sciences':
      return 'Healthcare';
    case 'Business':
      return 'Business & finance';
    case 'Computing':
      return 'General';
    default:
      return name;
  }
}
