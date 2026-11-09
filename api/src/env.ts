/** Bindings, variables and secrets configured in wrangler.jsonc / `wrangler secret put`. */
export interface Bindings {
  DB: D1Database;
  /** Comma-separated list of origins allowed to call the API from a browser (CORS). */
  ALLOWED_ORIGINS: string;
  /** Limits contact form posts per IP (see `ratelimits` in wrangler.jsonc). */
  CONTACT_LIMITER?: RateLimit;
  /** Secret: Cloudflare Turnstile secret key. Without it the contact form answers 503. */
  TURNSTILE_SECRET_KEY?: string;
  /** Secret: Resend API key for the email notification (optional). */
  RESEND_API_KEY?: string;
  /** Where new messages are emailed, e.g. `you@example.com`. */
  CONTACT_TO_EMAIL?: string;
  /** Sender on a domain verified at Resend, e.g. `Portfolio <contact@kurath.dev>`. */
  CONTACT_FROM_EMAIL?: string;
}

export interface AppEnv {
  Bindings: Bindings;
}
