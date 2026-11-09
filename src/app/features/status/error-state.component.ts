import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  input,
  output,
} from '@angular/core';
import { ApiError } from '../../core/api/api-error';

/** Full-width failure block in the site's visual language, with a retry action. */
@Component({
  selector: 'section[appErrorState]',
  template: `
    <div class="section-label">
      <span class="stripe-mark" aria-hidden="true"><i></i><i></i><i></i></span>
      <span>{{ error()?.status || 'ERR' }} / OFF ROUTE</span>
    </div>
    <h1 class="api-error-title">Signal lost.</h1>
    <p class="api-error-detail">// {{ error()?.title ?? 'The portfolio could not be loaded.' }}</p>
    @if (error()?.detail; as detail) {
      <p class="api-error-detail">{{ detail }}</p>
    }
    <button type="button" class="api-error-retry" (click)="retry.emit()">
      Try again <b aria-hidden="true">↻</b>
    </button>
  `,
  styleUrl: './status.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'api-error', role: 'alert' },
})
export class ErrorStateComponent {
  readonly error = input<ApiError | null>(null);
  readonly retry = output();
}
