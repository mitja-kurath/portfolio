import { RoleDto } from '../../core/api/api.models';

/** The stylesheet positions `.role-1` … `.role-4` on the mountain line. */
export const STYLED_ROLE_SLOTS = 4;

export interface RoleView {
  id: string;
  yearLabel: string;
  title: string;
  subtitle: string;
  /** `role-1` … `role-4`, or null when positioned inline. */
  slotClass: string | null;
  /** Inline position for roles beyond the four styled slots. */
  left: string | null;
  top: string | null;
}

/** Vertices of the ridge path in the chart's 1200 × 470 viewBox (see experience.component.html). */
const RIDGE: readonly (readonly [number, number])[] = [
  [0, 410],
  [230, 366],
  [460, 288],
  [710, 204],
  [942, 95],
  [1200, 0],
];
const VIEWBOX_WIDTH = 1200;
/** The svg starts 55px below the chart top; the dot centre sits 16.5px below a role's `top`. */
const DOT_OFFSET_PX = 55 - 16.5;

/** Linear approximation of the ridge height at x (viewBox units). */
export function ridgeY(x: number): number {
  for (let i = 1; i < RIDGE.length; i++) {
    const [x1, y1] = RIDGE[i];
    if (x <= x1) {
      const [x0, y0] = RIDGE[i - 1];
      return y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
    }
  }
  return RIDGE[RIDGE.length - 1][1];
}

/**
 * Up to four roles use the original `.role-n` classes (incl. their mobile overrides).
 * Larger lists are spread along the same ridge (first to fourth vertex) inline,
 * with each dot placed on the line.
 */
export function toRoleViews(roles: readonly RoleDto[], currentLabel: string): RoleView[] {
  const styled = roles.length <= STYLED_ROLE_SLOTS;
  const span = Math.max(roles.length - 1, 1);
  const [startX, endX] = [RIDGE[1][0], RIDGE[4][0]];
  return roles.map((role, i) => {
    const x = startX + ((endX - startX) * i) / span;
    return {
      id: role.id,
      yearLabel: role.isCurrent ? currentLabel : role.year,
      title: role.title,
      subtitle: role.subtitle,
      slotClass: styled ? `role-${i + 1}` : null,
      left: styled ? null : `${((x / VIEWBOX_WIDTH) * 100).toFixed(2)}%`,
      top: styled ? null : `${Math.round(DOT_OFFSET_PX + ridgeY(x))}px`,
    };
  });
}
