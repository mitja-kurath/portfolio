import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ViewEncapsulation,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiError } from '../../../core/api/api-error';
import { PortfolioApiService } from '../../../core/api/portfolio-api.service';
import { ContactFormConfig } from '../../../core/content/site-content.model';
import { TurnstileComponent } from '../turnstile/turnstile.component';

type SendState = 'idle' | 'sending' | 'sent' | 'error' | 'rate-limited' | 'needs-check';
type FieldName = 'name' | 'email' | 'message';

/**
 * Contact form posting to `POST /contact-messages`, protected by Cloudflare Turnstile and
 * a honeypot field. Shown when `environment.contactForm.enabled` is true.
 */
@Component({
  selector: 'app-contact-form',
  imports: [ReactiveFormsModule, TurnstileComponent],
  templateUrl: './contact-form.component.html',
  styleUrl: './contact-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class ContactFormComponent {
  readonly config = input.required<ContactFormConfig>();
  readonly turnstileSiteKey = input.required<string>();

  private readonly api = inject(PortfolioApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly turnstile = viewChild(TurnstileComponent);

  protected readonly state = signal<SendState>('idle');
  protected readonly token = signal<string | null>(null);
  protected readonly form = inject(NonNullableFormBuilder).group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(320)]],
    message: ['', [Validators.required, Validators.maxLength(5000)]],
    /** Honeypot: hidden from people, often filled in by bots. */
    website: [''],
  });

  protected onToken(token: string | null): void {
    this.token.set(token);
    if (token && this.state() === 'needs-check') this.state.set('idle');
  }

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const turnstileToken = this.token();
    if (this.turnstileSiteKey() && !turnstileToken) {
      this.state.set('needs-check');
      return;
    }
    this.state.set('sending');
    this.api
      .sendContactMessage({ ...this.form.getRawValue(), turnstileToken: turnstileToken ?? undefined })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.state.set('sent');
          this.form.reset();
          this.turnstile()?.reset();
        },
        error: (error: unknown) => {
          this.state.set(error instanceof ApiError && error.status === 429 ? 'rate-limited' : 'error');
          this.turnstile()?.reset();
        },
      });
  }

  protected invalid(field: FieldName): boolean {
    const control = this.form.controls[field];
    return control.invalid && control.touched;
  }
}
