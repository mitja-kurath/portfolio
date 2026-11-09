export interface AppEnvironment {
  /** Prefix for every relative API call, e.g. `/api/v1` (dev proxy) or `https://api.example.com/api/v1`. */
  readonly apiBaseUrl: string;
  /** When true, `mockApiInterceptor` answers all API calls from `core/mock/mock-data.ts`. */
  readonly useMock: boolean;
  /** Simulated latency of the mock API in milliseconds. */
  readonly mockDelayMs: number;
  /** Opt-in: remember the chosen colour theme in localStorage. */
  readonly persistTheme: boolean;
  /** Contact form (posts to `POST /contact-messages`). */
  readonly contactForm: {
    /** Show the form. Turn on only once the API with TURNSTILE_SECRET_KEY is deployed. */
    readonly enabled: boolean;
    /** Cloudflare Turnstile site key (public). */
    readonly turnstileSiteKey: string;
  };
}
