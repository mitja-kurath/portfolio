import type {
  PortfolioDto,
  ProfileDto,
  ProjectDto,
  RoleDto,
  SkillGroupDto,
} from '../../../src/app/core/api/api.models';
import {
  type ImageUrlFn,
  type ProjectRow,
  type RoleRow,
  type SkillGroupRow,
  toProjectDto,
  toRoleDto,
  toSkillGroupDto,
} from './content.mappers';

const PROJECTS_SQL = `
  SELECT id, sort_order, name, type, year, stack, description, art_variant, coordinates, layout_class, url, image_key
  FROM projects WHERE published = 1 ORDER BY sort_order, id`;
const SKILLS_SQL = 'SELECT id, sort_order, title, items FROM skill_groups ORDER BY sort_order, id';
const PORTRAIT_SQL = "SELECT value FROM settings WHERE key = 'portraitKey'";
const ROLES_SQL =
  'SELECT id, sort_order, year, title, subtitle, is_current FROM roles ORDER BY sort_order, id';

/** Read access to the editable portfolio content. */
export class ContentRepository {
  constructor(
    private readonly db: D1Database,
    private readonly imageUrl: ImageUrlFn,
  ) {}

  async projects(): Promise<ProjectDto[]> {
    const { results } = await this.db.prepare(PROJECTS_SQL).all<ProjectRow>();
    return results.map((row) => toProjectDto(row, this.imageUrl));
  }

  async skills(): Promise<SkillGroupDto[]> {
    const { results } = await this.db.prepare(SKILLS_SQL).all<SkillGroupRow>();
    return results.map(toSkillGroupDto);
  }

  async roles(): Promise<RoleDto[]> {
    const { results } = await this.db.prepare(ROLES_SQL).all<RoleRow>();
    return results.map(toRoleDto);
  }

  /** Everything in one database round trip. */
  async portfolio(): Promise<PortfolioDto> {
    const [projects, skills, roles, portrait] = await this.db.batch([
      this.db.prepare(PROJECTS_SQL),
      this.db.prepare(SKILLS_SQL),
      this.db.prepare(ROLES_SQL),
      this.db.prepare(PORTRAIT_SQL),
    ]);
    const portraitKey = (portrait.results[0] as { value: string } | undefined)?.value ?? null;
    const profile: ProfileDto = { portraitUrl: portraitKey ? this.imageUrl(portraitKey) : null };
    return {
      profile,
      projects: (projects.results as ProjectRow[]).map((row) => toProjectDto(row, this.imageUrl)),
      skills: (skills.results as SkillGroupRow[]).map(toSkillGroupDto),
      experience: { roles: (roles.results as RoleRow[]).map(toRoleDto) },
    };
  }
}
