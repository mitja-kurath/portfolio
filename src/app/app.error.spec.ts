import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { App } from './app';
import { API_CONFIG } from './core/api/api.config';
import { apiInterceptor } from './core/api/api.interceptor';
import { MOCK_PORTFOLIO } from './core/mock/mock-data';

describe('App when the API fails', () => {
  it('keeps the static sections and replaces only the data sections with a retry block', async () => {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(withInterceptors([apiInterceptor])),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: '/api/v1', useMock: false, mockDelayMs: 0 } },
      ],
    });
    const fixture = TestBed.createComponent(App);
    const el = fixture.nativeElement as HTMLElement;
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    http
      .expectOne('/api/v1/portfolio')
      .flush(
        { type: 'about:blank', title: 'Service Unavailable', status: 503 },
        { status: 503, statusText: 'Service Unavailable' },
      );
    await TestBed.inject(ApplicationRef).whenStable();
    fixture.detectChanges();

    const sections = Array.from(el.querySelectorAll('main > section, main > header, main > footer'));
    expect(sections.map((node) => node.id || node.className)).toEqual([
      'topbar',
      'base-camp',
      'api-error',
      'about',
      'contact',
      '',
    ]);
    expect(el.querySelector('.api-error h2')?.textContent).toBe('Signal lost.');
    expect(el.querySelector('.api-error')?.textContent).toContain('503');

    el.querySelector<HTMLButtonElement>('.api-error-retry')!.click();
    TestBed.tick();
    http.expectOne('/api/v1/portfolio').flush(MOCK_PORTFOLIO);
    await TestBed.inject(ApplicationRef).whenStable();
    fixture.detectChanges();
    expect(el.querySelector('#work')).not.toBeNull();
    expect(el.querySelector('.api-error')).toBeNull();
    http.verify();
  });
});
