import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import {
  provideClientHydration,
  withEventReplay,
  withNoHttpTransferCache,
} from '@angular/platform-browser';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { apiInterceptor } from './core/api/api.interceptor';
import { mockApiInterceptor } from './core/api/mock-api.interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // apiInterceptor runs first (prefix + error mapping); the mock sits behind it and
    // only answers when API_CONFIG.useMock is true.
    provideHttpClient(withFetch(), withInterceptors([apiInterceptor, mockApiInterceptor])),
    provideRouter(routes, withInMemoryScrolling({ anchorScrolling: 'enabled' })),
    // Hydrates the pre-rendered HTML. The build-time payload is handed over explicitly by
    // PortfolioStore (TransferState): Angular's HTTP transfer cache keys on the request URL,
    // which differs between build time (absolute API URL / mock) and the browser.
    provideClientHydration(withEventReplay(), withNoHttpTransferCache()),
  ],
};
