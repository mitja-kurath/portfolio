import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { API_CONFIG, isRelativeApiPath, joinApiUrl } from './api.config';
import { ApiError } from './api-error';
import { apiInterceptor } from './api.interceptor';
import { mockApiInterceptor } from './mock-api.interceptor';
import { PortfolioApiService } from './portfolio-api.service';
import { MOCK_PORTFOLIO } from '../mock/mock-data';

const config = { baseUrl: '/api/v1', useMock: true, mockDelayMs: 0 };

describe('api helpers', () => {
  it('recognises relative API paths only', () => {
    expect(isRelativeApiPath('portfolio')).toBe(true);
    expect(isRelativeApiPath('/assets/x.json')).toBe(false);
    expect(isRelativeApiPath('./x')).toBe(false);
    expect(isRelativeApiPath('https://example.com/x')).toBe(false);
    expect(isRelativeApiPath('//cdn.example.com/x')).toBe(false);
  });

  it('joins base and path with exactly one slash', () => {
    expect(joinApiUrl('/api/v1/', '/site')).toBe('/api/v1/site');
    expect(joinApiUrl('https://api.example.com/api/v1', 'site')).toBe(
      'https://api.example.com/api/v1/site',
    );
  });
});

describe('apiInterceptor', () => {
  it('prefixes relative paths, leaves others alone, and maps errors', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiInterceptor])),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: config },
      ],
    });
    const http = TestBed.inject(HttpClient);
    const ctrl = TestBed.inject(HttpTestingController);

    http.get('/assets/plain.json').subscribe();
    expect(ctrl.expectOne('/assets/plain.json').request.headers.has('Accept')).toBe(false);

    const failing = firstValueFrom(http.get('projects')).catch((e: unknown) => e);
    ctrl.expectOne('/api/v1/projects').flush('', { status: 0, statusText: 'Unknown Error' });
    const error = await failing;
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).title).toBe('Network error');
    ctrl.verify();
  });
});

describe('mockApiInterceptor with useMock: false', () => {
  it('passes requests through to the network', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiInterceptor, mockApiInterceptor])),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { ...config, useMock: false } },
      ],
    });
    TestBed.inject(PortfolioApiService).getPortfolio().subscribe();
    const ctrl = TestBed.inject(HttpTestingController);
    ctrl.expectOne('/api/v1/portfolio').flush(MOCK_PORTFOLIO);
    ctrl.verify();
  });
});

describe('mockApiInterceptor', () => {
  let api: PortfolioApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([apiInterceptor, mockApiInterceptor])),
        { provide: API_CONFIG, useValue: config },
      ],
    });
    api = TestBed.inject(PortfolioApiService);
  });

  it('serves every GET endpoint from mock data', async () => {
    expect(await firstValueFrom(api.getProjects())).toEqual(MOCK_PORTFOLIO.projects);
    expect(await firstValueFrom(api.getSkills())).toEqual(MOCK_PORTFOLIO.skills);
    expect(await firstValueFrom(api.getExperience())).toEqual(MOCK_PORTFOLIO.experience);
    expect(await firstValueFrom(api.getPortfolio())).toEqual(MOCK_PORTFOLIO);
  });

  it('returns copies so callers cannot mutate the mock', async () => {
    const projects = await firstValueFrom(api.getProjects());
    projects[0].name = 'CHANGED';
    expect(MOCK_PORTFOLIO.projects[0].name).toBe('Alpine Signal');
  });

  it('accepts valid contact messages and rejects invalid ones as problem+json', async () => {
    const created = await firstValueFrom(
      api.sendContactMessage({ name: 'A', email: 'a@b.ch', message: 'Hi' }),
    );
    expect(created.id).toMatch(/^mock-/);
    expect(Number.isNaN(Date.parse(created.receivedAt))).toBe(false);

    const error = await firstValueFrom(
      api.sendContactMessage({ name: '', email: 'nope', message: '' }),
    ).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).status).toBe(400);
    expect((error as ApiError).detail).toContain('required');
  });
});
