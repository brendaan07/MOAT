// The check for "build the line" questions, used by both track players.

/** True when the pieces tapped, in order, read the same as the right pieces. Compared by label, so two pieces that look alike count the same. */
export function buildMatches(placedIds: string[], correctIds: string[], labelFor: (id: string) => string): boolean {
  return placedIds.length > 0 && placedIds.map(labelFor).join('|') === correctIds.map(labelFor).join('|');
}
