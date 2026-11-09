import { AppEnvironment } from './environment.model';

/** Production environment (swapped in via `fileReplacements` for `ng build`). */
export const environment: AppEnvironment = {
  apiBaseUrl: '/api/v1',
  useMock: false,
  mockDelayMs: 0,
  persistTheme: false,
  contactForm: {
    // Needs TURNSTILE_SECRET_KEY on the Worker (see api/README.md → Contact form).
    enabled: true,
    turnstileSiteKey: '0x4AAAAAAF6DE1WBRFIMK3Rm',
  },
};
