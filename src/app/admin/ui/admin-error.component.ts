import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { ApiError } from '../../core/api/api-error';

/** Error summary for a failed admin request, incl. field errors of a 400 response. */
@Component({
  selector: 'app-admin-error',
  template: `
    @if (error(); as e) {
      <div class="admin-error" role="alert">
        <strong>{{ e.status ? e.status + ' · ' : '' }}{{ e.title }}</strong>
        @if (e.detail) {
          <p>{{ e.detail }}</p>
        }
        @if (fields().length) {
          <ul>
            @for (field of fields(); track field.name) {
              <li><b>{{ field.label }}</b>: {{ field.message }}</li>
            }
          </ul>
        }
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminErrorComponent {
  readonly error = input<ApiError | null>(null);
  /** Optional display names for field keys, e.g. `{ artVariant: 'Artwork' }`. */
  readonly labels = input<Record<string, string>>({});

  protected readonly fields = computed(() =>
    Object.entries(this.error()?.errors ?? {}).map(([name, message]) => ({
      name,
      label: this.labels()[name] ?? name,
      message,
    })),
  );
}
