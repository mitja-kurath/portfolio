/**
 * Static site content: identity, SEO, navigation, section texts, contact links, footer.
 * It ships with the app (see site-content.ts); only projects, skills and roles come from the API.
 */

export type NavCounterSource = 'projects' | 'notes' | 'skills';

export interface NavItem {
  label: string;
  /** In-page anchor, e.g. `#work`. */
  href: string;
  /** Derive the superscript from data (zero-padded count). */
  counter: NavCounterSource | null;
  /** Static superscript used when `counter` is null, e.g. `↗`. */
  glyph?: string;
}

export interface SectionHeading {
  /** Lines of the display heading, rendered separated by `<br>`. */
  headingLines: string[];
  /** Emphasised (serif / outlined) part of the heading. */
  emphasis: string;
  /** true → emphasis continues the last heading line; false/absent → emphasis on its own line. */
  emphasisInline?: boolean;
}

export interface WorkSection extends SectionHeading {
  intro: string;
}

export interface AboutSection {
  eyebrowLines: string[];
  quote: { before: string; emphasis: string };
  paragraphs: string[];
  portraitLabel: string;
  /** Alt text of the uploaded portrait photo. */
  portraitAlt: string;
  stampLines: string[];
  stampSmall: string;
  linkLabel: string;
  linkHref: string;
}

export interface EquipmentSection extends SectionHeading {
  intro: string;
}

export interface ExperienceSection extends SectionHeading {
  introLines: string[];
  /** Altitude labels on the chart, bottom → top, e.g. `1,200 M`. */
  altitudes: string[];
  /** Year label used for a role with `isCurrent: true`, e.g. `NOW`. */
  currentLabel: string;
}

export interface ContactSection extends SectionHeading {
  note: string[];
}

export type ContactLinkKind = 'email' | 'github' | 'linkedin';

export interface ContactLink {
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

export interface ContactFormConfig {
  title: string;
  nameLabel: string;
  emailLabel: string;
  messageLabel: string;
  submitLabel: string;
  sendingLabel: string;
  successMessage: string;
  /** Text of the stamp shown on the card after sending. */
  stampLabel: string;
  errorMessage: string;
  /** Shown when the visitor submits before the spam check has finished. */
  spamCheckMessage: string;
  /** Shown after too many messages in a short time (HTTP 429). */
  rateLimitMessage: string;
}

export interface SiteContent {
  seo: { title: string; description: string; language: string };
  person: { firstName: string; lastName: string; initials: string; ariaHomeLabel: string };
  /** IANA zone for the footer clock, e.g. `Europe/Zurich`. */
  timezone: string;
  /** Label next to the clock, e.g. `CET`. */
  timezoneLabel: string;
  footerCity: string;
  brandCoordinates: string;
  navigation: NavItem[];
  hero: {
    coordinates: string[];
    altitudeLabel: string;
    altitude: number;
    taglineLines: string[];
    ctaLabel: string;
    ctaHref: string;
    scrollNote: string;
  };
  sections: {
    work: WorkSection;
    about: AboutSection;
    equipment: EquipmentSection;
    experience: ExperienceSection;
    contact: ContactSection;
  };
  contactLinks: ContactLink[];
  contactForm: ContactFormConfig;
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
