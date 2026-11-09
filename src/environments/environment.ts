import { AppEnvironment } from './environment.model';

/** Development environment (used by `ng serve`). */
export const environment: AppEnvironment = {
  apiBaseUrl: '/api/v1',
  useMock: true,
  mockDelayMs: 150,
  persistTheme: false,
};
