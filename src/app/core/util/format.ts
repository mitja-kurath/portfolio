/** Zero-pads a number to at least two digits: 4 → "04", 13 → "13". */
export function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

/** Returns a copy sorted ascending by `order` (stable for equal values). */
export function byOrder<T extends { order: number }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => a.order - b.order);
}
