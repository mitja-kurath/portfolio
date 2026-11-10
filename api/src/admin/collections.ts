import type { AdminProjectDto } from '../../../src/app/core/api/admin.models';
import type { RoleDto, SkillGroupDto } from '../../../src/app/core/api/api.models';
import {
  type ProjectRow,
  type RoleRow,
  type SkillGroupRow,
  toProjectDto,
  toRoleDto,
  toSkillGroupDto,
} from '../content/content.mappers';
import type { Collection } from './collection.routes';

export const projectsCollection: Collection<AdminProjectDto> = {
  table: 'projects',
  columns:
    'id, sort_order, name, type, year, stack, description, art_variant, coordinates, layout_class, url, image_key, published',
  toDto: (row, imageUrl) => ({
    ...toProjectDto(row as unknown as ProjectRow, imageUrl),
    published: row['published'] === 1,
    imageKey: (row['image_key'] as string | null) ?? null,
  }),
  imageColumns: ['image_key'],
  read: (v) => ({
    name: v.text('name', 80),
    type: v.text('type', 80),
    year: v.text('year', 20),
    stack: v.text('stack', 200),
    description: v.text('description', 600),
    art_variant: v.int('artVariant', 1, 4),
    coordinates: JSON.stringify(v.textList('coordinates', 2, 40)),
    layout_class: v.text('layoutClass', 40, false) || null,
    url: v.optionalUrl('url'),
    image_key: v.imageKey('imageKey'),
    published: v.bool('published') ? 1 : 0,
  }),
};

export const skillGroupsCollection: Collection<SkillGroupDto> = {
  table: 'skill_groups',
  columns: 'id, sort_order, title, items',
  toDto: (row) => toSkillGroupDto(row as unknown as SkillGroupRow),
  read: (v) => ({
    title: v.text('title', 60),
    items: JSON.stringify(v.textList('items', 30, 60, 1)),
  }),
};

export const rolesCollection: Collection<RoleDto> = {
  table: 'roles',
  columns: 'id, sort_order, year, title, subtitle, is_current',
  toDto: (row) => toRoleDto(row as unknown as RoleRow),
  read: (v) => ({
    year: v.text('year', 20),
    title: v.text('title', 80),
    subtitle: v.text('subtitle', 80),
    is_current: v.bool('isCurrent') ? 1 : 0,
  }),
};
