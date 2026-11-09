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

/**
 * Up to four roles use the original `.role-n` classes (incl. their mobile overrides).
 * Larger lists are spread along the same ridge (19% → 79%, 355px → 83px) inline.
 */
export function toRoleViews(roles: readonly RoleDto[], currentLabel: string): RoleView[] {
  const styled = roles.length <= STYLED_ROLE_SLOTS;
  const span = Math.max(roles.length - 1, 1);
  return roles.map((role, i) => ({
    id: role.id,
    yearLabel: role.isCurrent ? currentLabel : role.year,
    title: role.title,
    subtitle: role.subtitle,
    slotClass: styled ? `role-${i + 1}` : null,
    left: styled ? null : `${19 + (60 * i) / span}%`,
    top: styled ? null : `${Math.round(355 - (272 * i) / span)}px`,
  }));
}
