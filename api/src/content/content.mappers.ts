import type {
  ArtVariant,
  ProjectDto,
  RoleDto,
  SkillGroupDto,
} from '../../../src/app/core/api/api.models';

/** Database rows (snake_case columns, JSON stored as text, booleans as 0/1). */
export interface ProjectRow {
  id: string;
  sort_order: number;
  name: string;
  type: string;
  year: string;
  stack: string;
  description: string;
  art_variant: number;
  coordinates: string;
  layout_class: string | null;
  url: string | null;
  image_key: string | null;
}

export interface SkillGroupRow {
  id: string;
  sort_order: number;
  title: string;
  items: string;
}

export interface RoleRow {
  id: string;
  sort_order: number;
  year: string;
  title: string;
  subtitle: string;
  is_current: number;
}

/** Turns an R2 image key into a public URL. */
export type ImageUrlFn = (key: string) => string;

export function toProjectDto(row: ProjectRow, imageUrl: ImageUrlFn): ProjectDto {
  return {
    id: row.id,
    order: row.sort_order,
    name: row.name,
    type: row.type,
    year: row.year,
    stack: row.stack,
    description: row.description,
    artVariant: row.art_variant as ArtVariant,
    coordinates: JSON.parse(row.coordinates) as string[],
    ...(row.layout_class ? { layoutClass: row.layout_class } : {}),
    ...(row.url ? { url: row.url } : {}),
    ...(row.image_key ? { imageUrl: imageUrl(row.image_key) } : {}),
  };
}

export function toSkillGroupDto(row: SkillGroupRow): SkillGroupDto {
  return {
    id: row.id,
    order: row.sort_order,
    title: row.title,
    items: JSON.parse(row.items) as string[],
  };
}

export function toRoleDto(row: RoleRow): RoleDto {
  return {
    id: row.id,
    order: row.sort_order,
    year: row.year,
    title: row.title,
    subtitle: row.subtitle,
    isCurrent: row.is_current === 1,
  };
}
