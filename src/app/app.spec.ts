import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { API_CONFIG } from './core/api/api.config';
import { apiInterceptor } from './core/api/api.interceptor';
import { mockApiInterceptor } from './core/api/mock-api.interceptor';

describe('App routes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideHttpClient(withInterceptors([apiInterceptor, mockApiInterceptor])),
        { provide: API_CONFIG, useValue: { baseUrl: '/api/v1', useMock: true, mockDelayMs: 0 } },
      ],
    });
  });

  it('renders the portfolio at /', async () => {
    const harness = await RouterTestingHarness.create('/');
    expect(harness.routeNativeElement?.querySelector('.hero h1')?.textContent).toContain('MITJA');
  });

  it('lazy-loads the admin page at /admin', async () => {
    const harness = await RouterTestingHarness.create('/admin');
    expect(harness.routeNativeElement?.querySelector('.admin')).not.toBeNull();
    expect(document.querySelector('meta[name="robots"]')?.getAttribute('content')).toBe(
      'noindex, nofollow',
    );
  });

  it('redirects unknown paths to the portfolio', async () => {
    const harness = await RouterTestingHarness.create('/nope');
    expect(harness.routeNativeElement?.querySelector('.hero')).not.toBeNull();
  });
});
