// Small formatters shared by the lessons and games: joining code pieces and writing money.
/** Joins pieces like ["print", "(", "\"Hi\"", ")"] into print("Hi"). */
export function codeJoin(pieces: string[]): string {
  let result = '';
  for (const piece of pieces) {
    const noSpaceBefore = [')', ':', ',', '(', ';'].includes(piece);
    const afterOpenBracket = result.endsWith('(');
    result += result === '' || noSpaceBefore || afterOpenBracket ? piece : ' ' + piece;
  }
  return result;
}

/** "$1,000" style money, rounded to whole dollars. */
export const money = (value: number) => '$' + Math.round(value).toLocaleString('en-US');
