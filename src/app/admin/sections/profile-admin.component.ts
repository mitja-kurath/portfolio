import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { AdminProfileDto } from '../../core/api/admin.models';
import { ApiError, toApiError } from '../../core/api/api-error';
import { AdminApiService } from '../data/admin-api.service';
import { AdminErrorComponent } from '../ui/admin-error.component';
import { ImageUploadComponent } from '../ui/image-upload.component';

/** Profile media: the portrait in the About section. Saved as soon as it is uploaded. */
@Component({
  selector: 'app-profile-admin',
  imports: [ImageUploadComponent, AdminErrorComponent],
  template: `
    <div class="admin-section-head">
      <p>
        Your portrait in the “Good systems, like good trails…” section. It's shown in black and
        white so it fits the palette. Without one, the illustration is shown.
      </p>
    </div>

    @if (profile.error(); as error) {
      <app-admin-error [error]="loadError()" />
    } @else if (!profile.hasValue()) {
      <p class="admin-muted" role="status">Loading profile…</p>
    } @else {
      <div class="admin-fields admin-fields-single">
        <div class="admin-field">
          <span>Portrait <small>(portrait format works best, e.g. 3:4)</small></span>
          <app-image-upload
            label="Portrait"
            shape="portrait"
            emptyText="No portrait yet: the illustration is shown."
            [url]="profile.value().portraitUrl"
            (uploaded)="save($event.key)"
            (removed)="save(null)"
          />
        </div>
      </div>
      @if (saved()) {
        <p class="admin-notice" role="status">Saved. It shows on the site from the next page load.</p>
      }
      <app-admin-error [error]="saveError()" />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileAdminComponent {
  private readonly api = inject(AdminApiService);

  protected readonly profile = httpResource<AdminProfileDto>(() => 'admin/profile');
  protected readonly loadError = computed<ApiError | null>(() => {
    const error = this.profile.error();
    return error ? toApiError(error) : null;
  });
  protected readonly saved = signal(false);
  protected readonly saveError = signal<ApiError | null>(null);

  protected async save(portraitKey: string | null): Promise<void> {
    this.saved.set(false);
    this.saveError.set(null);
    try {
      this.profile.set(await this.api.saveProfile(portraitKey));
      this.saved.set(true);
    } catch (error) {
      this.saveError.set(toApiError(error));
    }
  }
}
