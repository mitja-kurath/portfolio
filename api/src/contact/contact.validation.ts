import type { ContactMessageRequest } from '../../../src/app/core/api/api.models';

export const CONTACT_LIMITS = { name: 200, email: 320, message: 5000 } as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type FieldErrors = Partial<Record<keyof typeof CONTACT_LIMITS | 'turnstileToken', string>>;

export type ContactValidation =
  | { ok: true; value: Required<Pick<ContactMessageRequest, 'name' | 'email' | 'message'>> & {
      turnstileToken: string;
      /** Honeypot: real visitors never fill it in. */
      isBot: boolean;
    } }
  | { ok: false; errors: FieldErrors };

const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

/** Validates the JSON body of `POST /contact-messages` (same rules as the frontend form). */
export function validateContactMessage(body: unknown): ContactValidation {
  const input = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
  const name = text(input['name']);
  const email = text(input['email']);
  const message = text(input['message']);
  const turnstileToken = text(input['turnstileToken']);

  const errors: FieldErrors = {};
  if (!name) errors.name = 'Name is required.';
  else if (name.length > CONTACT_LIMITS.name) errors.name = `At most ${CONTACT_LIMITS.name} characters.`;
  if (!EMAIL.test(email)) errors.email = 'A valid email address is required.';
  else if (email.length > CONTACT_LIMITS.email) errors.email = `At most ${CONTACT_LIMITS.email} characters.`;
  if (!message) errors.message = 'Message is required.';
  else if (message.length > CONTACT_LIMITS.message) {
    errors.message = `At most ${CONTACT_LIMITS.message} characters.`;
  }
  if (!turnstileToken) errors.turnstileToken = 'The spam check is missing.';

  if (Object.keys(errors).length > 0) return { ok: false, errors };
  return {
    ok: true,
    value: { name, email, message, turnstileToken, isBot: text(input['website']) !== '' },
  };
}
