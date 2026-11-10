import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApplicationRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { API_CONFIG } from '../core/api/api.config';
import { apiInterceptor } from '../core/api/api.interceptor';
import { AdminDashboardComponent } from './admin-dashboard.component';

describe('AdminDashboardComponent', () => {
  let fixture: ComponentFixture<AdminDashboardComponent>;
  let http: HttpTestingController;
  let el: HTMLElement;

  const settle = async () => {
    await TestBed.inject(ApplicationRef).whenStable();
    fixture.detectChanges();
  };

  /** Lets pending promises resolve and runs effects (without waiting for open requests). */
  const tick = async () => {
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
    fixture.detectChanges();
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [AdminDashboardComponent],
      providers: [
        provideHttpClient(withInterceptors([apiInterceptor])),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: '/api/v1', useMock: false, mockDelayMs: 0 } },
      ],
    });
    fixture = TestBed.createComponent(AdminDashboardComponent);
    el = fixture.nativeElement as HTMLElement;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  it('asks to sign in when the API answers 401', async () => {
    http
      .expectOne('/api/v1/admin/session')
      .flush({ title: 'Unauthorized', status: 401 }, { status: 401, statusText: 'Unauthorized' });
    await settle();
    expect(el.querySelector('.admin-gate h2')?.textContent).toBe('Sign-in required');
    expect(el.querySelector('.admin-tabs')).toBeNull();
  });

  it('shows the session, switches sections and triggers a rebuild', async () => {
    http.expectOne('/api/v1/admin/session').flush({ email: 'me@example.com', canRebuild: true });
    await tick();
    expect(el.querySelector('.admin-header')?.textContent).toContain('me@example.com');

    // Projects is the default section.
    http.expectOne('/api/v1/admin/projects').flush([]);
    await settle();
    const tabs = Array.from(el.querySelectorAll<HTMLButtonElement>('.admin-tabs button'));
    expect(tabs.map((t) => [t.textContent!.trim(), t.getAttribute('aria-pressed')])).toEqual([
      ['Projects', 'true'],
      ['Skills', 'false'],
      ['Experience', 'false'],
      ['Profile', 'false'],
      ['Messages', 'false'],
    ]);

    tabs[4].click();
    await tick();
    http.expectOne('/api/v1/admin/messages').flush([
      {
        id: 'm1',
        name: 'Ada',
        email: 'ada@example.com',
        message: 'Hi',
        receivedAt: '2026-11-09T10:00:00Z',
        readAt: null,
      },
    ]);
    await settle();
    expect(el.querySelector('.admin-message.is-unread')?.textContent).toContain('Ada');

    const rebuild = Array.from(el.querySelectorAll<HTMLButtonElement>('.admin-header button')).find(
      (b) => b.textContent!.includes('Rebuild'),
    )!;
    rebuild.click();
    http
      .expectOne({ method: 'POST', url: '/api/v1/admin/rebuild' })
      .flush({ triggered: true }, { status: 202, statusText: 'Accepted' });
    await settle();
    expect(el.querySelector('.admin-notice')?.textContent).toContain('Rebuild started');
    http.verify();
  });
});
