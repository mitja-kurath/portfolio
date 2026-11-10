/** Bindings, variables and secrets configured in wrangler.jsonc / `wrangler secret put`. */
export interface Bindings {
  DB: D1Database;
  /** R2 bucket for uploaded images (project banners, portrait). */
  IMAGES: R2Bucket;
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
  /** Sender on a domain verified at Resend, e.g. `Portfolio <contact@mitjakurath.ch>`. */
  CONTACT_FROM_EMAIL?: string;
  /** Cloudflare Access team domain, e.g. `https://your-team.cloudflareaccess.com`. */
  ACCESS_TEAM_DOMAIN?: string;
  /** Application Audience (AUD) tag of the Access application protecting /api/v1/admin. */
  ACCESS_AUD?: string;
  /** Optional comma-separated allow-list of admin emails (checked after Access). */
  ADMIN_EMAILS?: string;
  /** Local development only (.dev.vars): `true` skips Access for requests to localhost. */
  ADMIN_DEV_BYPASS?: string;
  /** Secret: Cloudflare Pages deploy hook URL, enables `POST /admin/rebuild`. */
  DEPLOY_HOOK_URL?: string;
}

export interface AppEnv {
  Bindings: Bindings;
}

export interface AdminEnv {
  Bindings: Bindings;
  Variables: { adminEmail: string };
}
