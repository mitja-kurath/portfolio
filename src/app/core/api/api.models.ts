/**
 * REST contract of the portfolio API (`/api/v1`). See API.md for endpoint documentation.
 * All payloads are camelCase JSON; ordering is controlled by `order` fields where present.
 */

export type NavCounterSource = 'projects' | 'notes' | 'skills';

export interface NavItemDto {
  label: string;
  /** In-page anchor, e.g. `#work`. */
  href: string;
  /** Derive the superscript from data (zero-padded count). */
  counter: NavCounterSource | null;
  /** Static superscript used when `counter` is null, e.g. `↗`. */
  glyph?: string;
}

export interface SectionHeadingDto {
  /** Section number shown in the label, e.g. `01`. */
  number: string;
  /** Section title shown in the label, e.g. `THE ROUTE`. */
  title: string;
  /** Elevation shown in the label (without unit), e.g. `1,240`. */
  elevation: string;
  /** Lines of the display heading, rendered separated by `<br>`. */
  headingLines: string[];
  /** Emphasised (serif / outlined) part of the heading. */
  emphasis: string;
  /** true → emphasis continues the last heading line; false/absent → emphasis on its own line. */
  emphasisInline?: boolean;
}

export interface WorkSectionDto extends SectionHeadingDto {
  intro: string;
}

export interface AboutSectionDto {
  number: string;
  title: string;
  elevation: string;
  eyebrowLines: string[];
  quote: { before: string; emphasis: string };
  paragraphs: string[];
  portraitLabel: string;
  stampLines: string[];
  stampSmall: string;
  linkLabel: string;
  linkHref: string;
}

export interface EquipmentSectionDto extends SectionHeadingDto {
  intro: string;
}

export interface ExperienceSectionDto extends SectionHeadingDto {
  introLines: string[];
  /** Altitude labels on the chart, bottom → top, e.g. `1,200 M`. */
  altitudes: string[];
  /** Year label used for a role with `isCurrent: true`, e.g. `NOW`. */
  currentLabel: string;
}

export interface ContactSectionDto extends SectionHeadingDto {
  note: string[];
}

export type ContactLinkKind = 'email' | 'github' | 'linkedin';

export interface ContactLinkDto {
  kind: ContactLinkKind;
  label: string;
  href: string;
  /** Small distance hint, e.g. `0.0 KM · NOW`. */
  hint: string;
  /** External links open in a new tab with `rel="noreferrer"`. */
  external: boolean;
  /** Which way the sign points; `left` renders the arrow before the label. */
  direction: 'left' | 'right';
}

export interface ContactFormConfigDto {
  /** The form is not part of the original design; keep false for pixel parity. */
  enabled: boolean;
  title: string;
  nameLabel: string;
  emailLabel: string;
  messageLabel: string;
  submitLabel: string;
  sendingLabel: string;
  successMessage: string;
  errorMessage: string;
}

export interface SiteDto {
  seo: { title: string; description: string; language: string };
  person: { firstName: string; lastName: string; initials: string; ariaHomeLabel: string };
  /** IANA zone for the footer clock, e.g. `Europe/Zurich`. */
  timezone: string;
  /** Label next to the clock, e.g. `CET`. */
  timezoneLabel: string;
  footerCity: string;
  brandCoordinates: string;
  navigation: NavItemDto[];
  hero: {
    kicker: string;
    routeCode: string;
    coordinates: string[];
    altitudeLabel: string;
    altitude: number;
    taglineLines: string[];
    ctaLabel: string;
    ctaHref: string;
    scrollNote: string;
  };
  sections: {
    work: WorkSectionDto;
    about: AboutSectionDto;
    equipment: EquipmentSectionDto;
    experience: ExperienceSectionDto;
    contact: ContactSectionDto;
  };
  contactLinks: ContactLinkDto[];
  contactForm: ContactFormConfigDto;
  footer: {
    localTimeLabel: string;
    compassNorth: string;
    compassLabelLines: string[];
    credit: string;
    ownerName: string;
    backToTopLabel: string;
    backToTopHref: string;
  };
}

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

export interface PortfolioDto {
  site: SiteDto;
  projects: ProjectDto[];
  skills: SkillGroupDto[];
  experience: ExperienceDto;
}

export interface ContactMessageRequest {
  name: string;
  email: string;
  message: string;
}

export interface ContactMessageResponse {
  id: string;
  receivedAt: string;
}
