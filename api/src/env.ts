/** Bindings and variables configured in wrangler.jsonc. */
export interface Bindings {
  DB: D1Database;
  /** Comma-separated list of origins allowed to call the API from a browser (CORS). */
  ALLOWED_ORIGINS: string;
}

export interface AppEnv {
  Bindings: Bindings;
}
