import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { API_CONFIG } from '../../../core/api/api.config';
import { apiInterceptor } from '../../../core/api/api.interceptor';
import { SITE_CONTENT } from '../../../core/content/site-content';
import { TurnstileApi, TurnstileLoader, TurnstileOptions } from '../turnstile/turnstile-loader.service';
import { ContactFormComponent } from './contact-form.component';

@Component({
  imports: [ContactFormComponent],
  template: `<app-contact-form [config]="config" [turnstileSiteKey]="siteKey()" />`,
})
class HostComponent {
  readonly config = SITE_CONTENT.contactForm;
  readonly siteKey = signal('site-key');
}

/** Fake Turnstile: hands out tokens on demand instead of loading Cloudflare's script. */
class FakeTurnstile implements TurnstileApi {
  options: TurnstileOptions | null = null;
  resets = 0;
  render(_: HTMLElement, options: TurnstileOptions): string {
    this.options = options;
    return 'widget-1';
  }
  reset(): void {
    this.resets++;
  }
  remove(): void {}
  solve(token = 'token-1'): void {
    this.options?.callback?.(token);
  }
}

describe('ContactFormComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let el: HTMLElement;
  let http: HttpTestingController;
  let turnstile: FakeTurnstile;

  const status = () => el.querySelector('.contact-form-status')!.textContent!.trim();
  const fill = (selector: string, value: string) => {
    const input = el.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
  };
  const fillValid = () => {
    fill('#contact-name', 'Ada');
    fill('#contact-email', 'ada@example.com');
    fill('#contact-message', 'Hello');
  };
  const submit = async () => {
    el.querySelector('form')!.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
    await fixture.whenStable();
  };

  beforeEach(async () => {
    turnstile = new FakeTurnstile();
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [
        provideHttpClient(withInterceptors([apiInterceptor])),
        provideHttpClientTesting(),
        { provide: API_CONFIG, useValue: { baseUrl: '/api/v1', useMock: false, mockDelayMs: 0 } },
        { provide: TurnstileLoader, useValue: { load: () => Promise.resolve(turnstile) } },
      ],
    });
    fixture = TestBed.createComponent(HostComponent);
    el = fixture.nativeElement as HTMLElement;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  it('renders the Turnstile widget with the site key', () => {
    expect(turnstile.options?.sitekey).toBe('site-key');
  });

  it('does not send invalid input and marks the fields', async () => {
    await submit();
    http.expectNone('/api/v1/contact-messages');
    expect(el.querySelector('#contact-email')!.getAttribute('aria-invalid')).toBe('true');
  });

  it('waits for the spam check before sending', async () => {
    fillValid();
    await submit();
    http.expectNone('/api/v1/contact-messages');
    expect(status()).toBe(SITE_CONTENT.contactForm.spamCheckMessage);
  });

  it('sends the message with the token and honeypot, then resets', async () => {
    turnstile.solve('token-1');
    fillValid();
    await submit();

    const req = http.expectOne('/api/v1/contact-messages');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      name: 'Ada',
      email: 'ada@example.com',
      message: 'Hello',
      website: '',
      turnstileToken: 'token-1',
    });
    req.flush({ id: 'm1', receivedAt: '2026-11-09T10:00:00Z' }, { status: 201, statusText: 'Created' });
    fixture.detectChanges();

    expect(status()).toBe(SITE_CONTENT.contactForm.successMessage);
    expect(el.querySelector<HTMLInputElement>('#contact-name')!.value).toBe('');
    expect(turnstile.resets).toBe(1);
  });

  it('shows the rate-limit message for 429', async () => {
    turnstile.solve();
    fillValid();
    await submit();
    http
      .expectOne('/api/v1/contact-messages')
      .flush({ title: 'Too Many Requests', status: 429 }, { status: 429, statusText: 'Too Many Requests' });
    fixture.detectChanges();
    expect(status()).toBe(SITE_CONTENT.contactForm.rateLimitMessage);
  });

  it('shows the generic error for other failures and keeps the input', async () => {
    turnstile.solve();
    fillValid();
    await submit();
    http
      .expectOne('/api/v1/contact-messages')
      .flush({ title: 'Forbidden', status: 403 }, { status: 403, statusText: 'Forbidden' });
    fixture.detectChanges();
    expect(status()).toBe(SITE_CONTENT.contactForm.errorMessage);
    expect(el.querySelector<HTMLInputElement>('#contact-name')!.value).toBe('Ada');
  });
});
