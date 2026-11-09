/** Positional classes cycle a → b → c → d → a … (left / right / left / right). */
export const LAYOUT_CLASSES = ['project-a', 'project-b', 'project-c', 'project-d'] as const;

/** Card count the original fixed-position CSS was designed for. */
export const CLASSIC_COUNT = 4;

/** Vertical distance between cards when the count differs from the classic four. */
export const CARD_SPACING = 415;

/** Verbatim route path + viewBox from the original design (4 cards, 1700px map). */
export const CLASSIC_ROUTE_PATH =
  'M490 0C485 130 610 180 580 310S370 465 410 615s280 160 200 340-260 170-195 360 220 180 160 375';
export const CLASSIC_VIEWBOX = '0 0 1000 1690';

export interface RouteLayout {
  /** True when the original stylesheet positions the cards on its own. */
  readonly classic: boolean;
  /** Inline `.route-map` height in px; null → use the stylesheet value. */
  readonly mapHeight: number | null;
  /** Inline `top` per card in px; null entries → use the stylesheet value. */
  readonly tops: readonly (number | null)[];
  readonly viewBox: string;
  readonly path: string;
}

export function layoutClassFor(index: number): string {
  return LAYOUT_CLASSES[index % LAYOUT_CLASSES.length];
}

/** A smooth zig-zag trail through `count` waypoints for a viewBox of the given height. */
export function generateRoutePath(count: number, height: number): string {
  if (count <= 0) {
    return 'M490 0';
  }
  const step = height / count;
  let d = 'M490 0';
  for (let k = 1; k <= count; k++) {
    const y = Math.round(k * step);
    const right = k % 2 === 1;
    const x = right ? 590 : 410;
    const cx = right ? 400 : 600;
    d += ` S${cx} ${Math.round(y - step / 2)} ${x} ${y}`;
  }
  return d;
}

/**
 * The original design hard-codes 4 cards at 0/420/830/1250px in a 1700px map.
 * Exactly 4 cards keep that pixel-exact layout; any other count is generalised
 * to `top = i * 415px` and a map height of `n * 415 + 40px`.
 */
export function computeRouteLayout(count: number): RouteLayout {
  if (count === CLASSIC_COUNT) {
    return {
      classic: true,
      mapHeight: null,
      tops: Array.from({ length: count }, () => null),
      viewBox: CLASSIC_VIEWBOX,
      path: CLASSIC_ROUTE_PATH,
    };
  }
  const mapHeight = count * CARD_SPACING + 40;
  // Same 10px difference between map height and viewBox height as the original (1700 → 1690).
  const viewBoxHeight = mapHeight - 10;
  return {
    classic: false,
    mapHeight,
    tops: Array.from({ length: count }, (_, i) => i * CARD_SPACING),
    viewBox: `0 0 1000 ${viewBoxHeight}`,
    path: generateRoutePath(count, viewBoxHeight),
  };
}
