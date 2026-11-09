import { NavCounterSource, NavItemDto, ProjectDto, SkillGroupDto } from '../api/api.models';
import { pad2 } from './format';

export type NavCounts = Readonly<Record<NavCounterSource, number>>;

/** Work = number of projects, Notes = 1 (the about section), Kit = all skill items. */
export function deriveNavCounts(
  projects: readonly ProjectDto[],
  skills: readonly SkillGroupDto[],
  hasNotes = true,
): NavCounts {
  return {
    projects: projects.length,
    notes: hasNotes ? 1 : 0,
    skills: skills.reduce((total, group) => total + group.items.length, 0),
  };
}

/** Superscript text of a nav link: a zero-padded counter or the item's static glyph. */
export function navBadge(item: NavItemDto, counts: NavCounts): string {
  return item.counter ? pad2(counts[item.counter]) : (item.glyph ?? '');
}
