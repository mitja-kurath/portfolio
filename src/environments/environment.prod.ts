import { AppEnvironment } from './environment.model';

/** Production environment (swapped in via `fileReplacements` for `ng build`). */
export const environment: AppEnvironment = {
  apiBaseUrl: '/api/v1',
  useMock: false,
  mockDelayMs: 0,
  persistTheme: false,
  contactForm: {
    // Enable after deploying the API with a TURNSTILE_SECRET_KEY (see api/README.md),
    // and put the site key of your Turnstile widget here.
    enabled: false,
    turnstileSiteKey: '',
  },
};
