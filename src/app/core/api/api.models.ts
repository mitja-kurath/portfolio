/**
 * REST contract of the portfolio API (`/api/v1`). See API.md for endpoint documentation.
 * Only content that changes is served by the API: projects, skill groups and roles.
 * Static site texts live in `core/content/site-content.ts`.
 * All payloads are camelCase JSON; ordering is controlled by `order` fields.
 */

export type ArtVariant = 1 | 2 | 3 | 4;

export interface ProjectDto {
  id: string;
  order: number;
  name: string;
  type: string;
  year: string;
  stack: string;
  description: string;
  /** 1 = signal rings, 2 = needle grid, 3 = contour, 4 = fire symbol. */
  artVariant: ArtVariant;
  coordinates: string[];
  /** Optional positional class (`project-a` … `project-d`); derived from the index when absent. */
  layoutClass?: string;
  /** Optional link; when present the card's ↗ arrow becomes a link. */
  url?: string;
  /** Optional uploaded banner image (absolute URL); replaces the artwork when present. */
  imageUrl?: string;
}

export interface SkillGroupDto {
  id: string;
  order: number;
  title: string;
  items: string[];
}

export interface RoleDto {
  id: string;
  order: number;
  year: string;
  title: string;
  subtitle: string;
  isCurrent: boolean;
}

export interface ExperienceDto {
  roles: RoleDto[];
}

/** Uploaded personal media. */
export interface ProfileDto {
  /** Portrait photo for the About section; null → the illustrated placeholder. */
  portraitUrl: string | null;
}

export interface PortfolioDto {
  profile: ProfileDto;
  projects: ProjectDto[];
  skills: SkillGroupDto[];
  experience: ExperienceDto;
}

export interface ContactMessageRequest {
  name: string;
  email: string;
  message: string;
  /** Cloudflare Turnstile token from the widget; verified server-side. */
  turnstileToken?: string;
  /** Honeypot field, hidden from people. Must stay empty. */
  website?: string;
}

export interface ContactMessageResponse {
  id: string;
  receivedAt: string;
}
