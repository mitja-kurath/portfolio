import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface ApiConfig {
  /** Prefix applied to every relative API path. */
  readonly baseUrl: string;
  readonly useMock: boolean;
  readonly mockDelayMs: number;
}

export const API_CONFIG = new InjectionToken<ApiConfig>('API_CONFIG', {
  providedIn: 'root',
  factory: () => ({
    baseUrl: environment.apiBaseUrl,
    useMock: environment.useMock,
    mockDelayMs: environment.mockDelayMs,
  }),
});

/**
 * Relative API paths. They have no leading slash so `apiInterceptor` can recognise
 * them and prefix the configured base URL.
 */
export const API_ENDPOINTS = {
  site: 'site',
  projects: 'projects',
  skills: 'skills',
  experience: 'experience',
  portfolio: 'portfolio',
  contactMessages: 'contact-messages',
} as const;

/** True for paths like `portfolio` (not `/assets/x`, `./x` or `https://…`). */
export function isRelativeApiPath(url: string): boolean {
  return !/^([a-z][a-z\d+\-.]*:)?\/\//i.test(url) && !url.startsWith('/') && !url.startsWith('.');
}

export function joinApiUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}
