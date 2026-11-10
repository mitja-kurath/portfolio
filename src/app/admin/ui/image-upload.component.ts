import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { UploadedImageDto } from '../../core/api/admin.models';
import { ApiError, toApiError } from '../../core/api/api-error';
import { AdminApiService } from '../data/admin-api.service';
import { prepareImage } from '../data/prepare-image';
import { AdminErrorComponent } from './admin-error.component';

let nextId = 0;

/**
 * Image field: preview, upload (shrunk to WebP in the browser), replace and remove.
 * Emits the uploaded image, or null when removed; saving it is up to the parent.
 */
@Component({
  selector: 'app-image-upload',
  imports: [AdminErrorComponent],
  template: `
    <div class="admin-image" [class.is-portrait]="shape() === 'portrait'">
      <div class="admin-image-preview">
        @if (url(); as src) {
          <img [src]="src" [alt]="label() + ' preview'" />
        } @else {
          <span class="admin-muted">{{ emptyText() }}</span>
        }
      </div>
      <div class="admin-image-actions">
        <input
          class="admin-file"
          type="file"
          accept="image/webp,image/jpeg,image/png,image/avif"
          [id]="inputId"
          [disabled]="busy()"
          (change)="onFile($event)"
        />
        <label class="admin-button" [for]="inputId" [class.is-disabled]="busy()">
          {{ busy() ? 'Uploading…' : url() ? 'Replace ' + label().toLowerCase() : 'Upload ' + label().toLowerCase() }}
        </label>
        @if (url() && !busy()) {
          <button type="button" (click)="removed.emit()">Remove</button>
        }
      </div>
      <app-admin-error [error]="error()" />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageUploadComponent {
  private readonly api = inject(AdminApiService);

  readonly label = input.required<string>();
  /** Current image URL (preview), or null. */
  readonly url = input<string | null>(null);
  readonly shape = input<'wide' | 'portrait'>('wide');
  readonly emptyText = input('No image yet: the illustration is shown.');

  readonly uploaded = output<UploadedImageDto>();
  readonly removed = output<void>();

  protected readonly inputId = `admin-image-${nextId++}`;
  protected readonly busy = signal(false);
  protected readonly error = signal<ApiError | null>(null);

  protected async onFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.busy.set(true);
    this.error.set(null);
    try {
      this.uploaded.emit(await this.api.uploadImage(await prepareImage(file)));
    } catch (error) {
      this.error.set(toApiError(error));
    } finally {
      this.busy.set(false);
    }
  }
}
