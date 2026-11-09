/** Number of generated contour lines (n = 0…6 in the original). */
export const CONTOUR_LINE_COUNT = 7;

/** Path of the n-th generated contour line – identical formula to the React original. */
export function contourPath(n: number): string {
  return `M ${22 + n * 23} ${488 - n * 27} C ${87 + n * 17} ${330 - n * 4}, ${210 + n * 14} ${526 - n * 42}, ${338 + n * 11} ${335 - n * 16} S ${559 + n * 8} ${156 + n * 14}, ${704 + n * 12} ${279 - n * 18} S ${813 - n * 5} ${397 - n * 19}, ${884 - n * 16} ${254 - n * 12}`;
}

/** The two hand-drawn contour lines rendered after the generated ones. */
export const STATIC_CONTOUR_PATHS: readonly string[] = [
  'M60 578C136 475 206 587 288 485s184-116 269-65c85 51 162 48 278-65',
  'M19 535c113-87 195 8 269-88 75-96 183-123 276-78 93 45 174 7 300-78',
];

/** All 9 path definitions in render order. */
export const CONTOUR_PATHS: readonly string[] = [
  ...Array.from({ length: CONTOUR_LINE_COUNT }, (_, n) => contourPath(n)),
  ...STATIC_CONTOUR_PATHS,
];
