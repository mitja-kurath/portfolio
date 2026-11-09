import { AppEnvironment } from './environment.model';

/** Development environment (used by `ng serve`). */
export const environment: AppEnvironment = {
  apiBaseUrl: '/api/v1',
  useMock: true,
  mockDelayMs: 150,
  persistTheme: false,
  contactForm: {
    enabled: true,
    // Cloudflare's always-passing Turnstile test key (pairs with api/.dev.vars.example).
    turnstileSiteKey: '1x00000000000000000000AA',
  },
};
