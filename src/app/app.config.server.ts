import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { environment } from '../environments/environment';
import { API_CONFIG, ApiConfig } from './core/api/api.config';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

/**
 * API used while pre-rendering at build time (Node has no dev proxy, so it needs an
 * absolute URL):
 *
 *   PORTFOLIO_API_URL=http://localhost:8080/api/v1 ng build
 *
 * Without PORTFOLIO_API_URL the page is pre-rendered from the mock content, so the
 * build always succeeds. In the browser the app still loads fresh data from
 * `environment.apiBaseUrl` after start-up.
 */
function buildTimeApiConfig(): ApiConfig {
  const apiUrl = process.env['PORTFOLIO_API_URL']?.trim();
  if (apiUrl) {
    return { baseUrl: apiUrl, useMock: false, mockDelayMs: 0 };
  }
  if (!environment.useMock) {
    console.warn(
      '[prerender] PORTFOLIO_API_URL is not set – pre-rendering from mock content. ' +
        'Set it to your API (e.g. http://localhost:8080/api/v1) to bake real content into the HTML.',
    );
  }
  return { baseUrl: environment.apiBaseUrl, useMock: true, mockDelayMs: 0 };
}

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    { provide: API_CONFIG, useFactory: buildTimeApiConfig },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
