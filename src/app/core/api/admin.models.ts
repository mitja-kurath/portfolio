/**
 * Admin API contract (`/api/v1/admin`, behind Cloudflare Access). Shared by the Worker and
 * the admin UI. `order` is managed by the reorder endpoints, never sent in create/update bodies.
 */
import type { ProjectDto, RoleDto, SkillGroupDto } from './api.models';

export interface AdminSessionDto {
  email: string;
  /** True when a Pages deploy hook is configured (`POST /admin/rebuild`). */
  canRebuild: boolean;
}

/** Projects include drafts in the admin API. */
export interface AdminProjectDto extends ProjectDto {
  published: boolean;
}

/** Body of `POST /admin/<collection>`: every field incl. the id (slug). */
export type CreateBody<T extends { id: string; order: number }> = Omit<T, 'order'>;
/** Body of `PUT /admin/<collection>/:id`: the id comes from the path and cannot change. */
export type UpdateBody<T extends { id: string; order: number }> = Omit<T, 'order' | 'id'>;

export type ProjectInput = UpdateBody<AdminProjectDto>;
export type SkillGroupInput = UpdateBody<SkillGroupDto>;
export type RoleInput = UpdateBody<RoleDto>;

/** Body of `PUT /admin/<collection>/order`: every id of the collection, in the new order. */
export interface ReorderRequest {
  ids: string[];
}

export interface ContactMessageDto {
  id: string;
  name: string;
  email: string;
  message: string;
  receivedAt: string;
  readAt: string | null;
}

/** Collections managed by the generic CRUD endpoints. */
export const ADMIN_COLLECTIONS = {
  projects: 'admin/projects',
  skillGroups: 'admin/skill-groups',
  roles: 'admin/roles',
} as const;
