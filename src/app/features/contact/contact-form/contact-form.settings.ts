import { InjectionToken } from '@angular/core';
import { environment } from '../../../../environments/environment';

export interface ContactFormSettings {
  readonly enabled: boolean;
  readonly turnstileSiteKey: string;
}

/** Whether the contact form is shown, and its Turnstile key (from the environment). */
export const CONTACT_FORM_SETTINGS = new InjectionToken<ContactFormSettings>(
  'CONTACT_FORM_SETTINGS',
  { providedIn: 'root', factory: () => environment.contactForm },
);
