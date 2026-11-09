import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ViewEncapsulation,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ContactFormConfigDto } from '../../../core/api/api.models';
import { PortfolioApiService } from '../../../core/api/portfolio-api.service';

type SendState = 'idle' | 'sending' | 'sent' | 'error';
type FieldName = 'name' | 'email' | 'message';

/**
 * Optional contact form posting to `POST /contact-messages`.
 * Not part of the original design: only rendered when `site.contactForm.enabled` is true,
 * so the default page stays identical to the original.
 */
@Component({
  selector: 'app-contact-form',
  imports: [ReactiveFormsModule],
  templateUrl: './contact-form.component.html',
  styleUrl: './contact-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class ContactFormComponent {
  readonly config = input.required<ContactFormConfigDto>();

  private readonly api = inject(PortfolioApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly state = signal<SendState>('idle');
  protected readonly form = inject(NonNullableFormBuilder).group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(320)]],
    message: ['', [Validators.required, Validators.maxLength(5000)]],
  });

  protected submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.state.set('sending');
    this.api
      .sendContactMessage(this.form.getRawValue())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.state.set('sent');
          this.form.reset();
        },
        error: () => this.state.set('error'),
      });
  }

  protected invalid(field: FieldName): boolean {
    const control = this.form.controls[field];
    return control.invalid && control.touched;
  }
}
