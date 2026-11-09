import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef, TransferState } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG } from '../api/api.config';
import { ApiError } from '../api/api-error';
import { apiInterceptor } from '../api/api.interceptor';
import { PortfolioDto } from '../api/api.models';
import { MOCK_PORTFOLIO } from '../mock/mock-data';
import { PORTFOLIO_STATE_KEY, PortfolioStore } from './portfolio.store';

describe('PortfolioStore', () => {
  let http: HttpTestingController;
  let store: PortfolioStore;

  const settle = () => TestBed.inject(ApplicationRef).whenStable();

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiInterceptor])),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: '/api/v1', useMock: false, mockDelayMs: 0 } },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    store = TestBed.inject(PortfolioStore);
    TestBed.tick();
  });

  afterEach(() => http.verify());

  it('requests /api/v1/portfolio with JSON accept headers and starts in loading', () => {
    const req = http.expectOne('/api/v1/portfolio');
    expect(req.request.method).toBe('GET');
    expect(req.request.headers.get('Accept')).toContain('application/json');
    expect(store.status()).toBe('loading');
    expect(store.projects()).toEqual([]);
    req.flush(MOCK_PORTFOLIO);
  });

  it('becomes ready and exposes data sorted by order', async () => {
    const shuffled: PortfolioDto = {
      ...MOCK_PORTFOLIO,
      projects: [...MOCK_PORTFOLIO.projects].reverse(),
      skills: [...MOCK_PORTFOLIO.skills].reverse(),
      experience: { roles: [...MOCK_PORTFOLIO.experience.roles].reverse() },
    };
    http.expectOne('/api/v1/portfolio').flush(shuffled);
    await settle();

    expect(store.status()).toBe('ready');
    expect(store.error()).toBeNull();
    expect(store.projects().map((p) => p.name)).toEqual([
      'Marsch',
      'Koda',
      'markdown2pdf',
      'VST3 Template',
    ]);
    expect(store.skills().map((s) => s.title)).toEqual(['Essentials', 'Navigation', 'Base layer']);
    expect(store.roles().find((r) => r.isCurrent)?.subtitle).toBe('Kyberna AG · 4th year');
    expect(store.projects()).toHaveLength(4);
  });

  it('maps problem+json failures to ApiError and recovers on reload', async () => {
    http.expectOne('/api/v1/portfolio').flush(
      { type: 'about:blank', title: 'Service Unavailable', status: 503, detail: 'Database down' },
      { status: 503, statusText: 'Service Unavailable' },
    );
    await settle();

    expect(store.status()).toBe('error');
    const error = store.error();
    expect(error).toBeInstanceOf(ApiError);
    expect(error?.status).toBe(503);
    expect(error?.title).toBe('Service Unavailable');
    expect(error?.detail).toBe('Database down');

    store.reload();
    TestBed.tick();
    expect(store.status()).toBe('loading');

    http.expectOne('/api/v1/portfolio').flush(MOCK_PORTFOLIO);
    await settle();
    expect(store.status()).toBe('ready');
    expect(store.error()).toBeNull();
  });

  it('starts ready from pre-rendered state and survives a failed live fetch', async () => {
    http.expectOne('/api/v1/portfolio').flush(MOCK_PORTFOLIO);
    await settle();
    TestBed.resetTestingModule();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiInterceptor])),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: '/api/v1', useMock: false, mockDelayMs: 0 } },
      ],
    });
    TestBed.inject(TransferState).set(PORTFOLIO_STATE_KEY, MOCK_PORTFOLIO);
    http = TestBed.inject(HttpTestingController);
    const seeded = TestBed.inject(PortfolioStore);
    TestBed.tick();

    expect(seeded.status()).toBe('ready');
    expect(seeded.projects()[0].name).toBe('Marsch');
    http.expectOne('/api/v1/portfolio').flush(null, { status: 404, statusText: 'Not Found' });
    await TestBed.inject(ApplicationRef).whenStable();
    expect(seeded.status()).toBe('ready');
    expect(seeded.projects()).toHaveLength(4);
  });

  it('keeps the last good content when a background refresh fails', async () => {
    http.expectOne('/api/v1/portfolio').flush(MOCK_PORTFOLIO);
    await settle();

    store.reload();
    TestBed.tick();
    expect(store.status()).toBe('ready');
    http.expectOne('/api/v1/portfolio').flush(null, { status: 500, statusText: 'Server Error' });
    await settle();

    expect(store.status()).toBe('ready');
    expect(store.error()?.status).toBe(500);
    expect(store.projects()).toHaveLength(4);
  });

  it('shows refreshed content after a successful reload', async () => {
    http.expectOne('/api/v1/portfolio').flush(MOCK_PORTFOLIO);
    await settle();

    store.reload();
    TestBed.tick();
    http.expectOne('/api/v1/portfolio').flush({
      ...MOCK_PORTFOLIO,
      projects: MOCK_PORTFOLIO.projects.slice(0, 2),
    });
    await settle();
    expect(store.projects()).toHaveLength(2);
  });
});
