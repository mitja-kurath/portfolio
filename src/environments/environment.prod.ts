import { AppEnvironment } from './environment.model';

/** Production environment (swapped in via `fileReplacements` for `ng build`). */
export const environment: AppEnvironment = {
  apiBaseUrl: '/api/v1',
  useMock: false,
  mockDelayMs: 0,
  persistTheme: false,
};
