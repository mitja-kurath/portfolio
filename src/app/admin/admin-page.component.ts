import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { AdminDashboardComponent } from './admin-dashboard.component';

/**
 * Route `/admin`. Pre-rendered as an empty shell: the dashboard is a deferred block, so it
 * (and every admin API call) only runs in the browser.
 */
@Component({
  selector: 'app-admin-page',
  imports: [AdminDashboardComponent],
  template: `
    <div class="admin">
      @defer (on immediate) {
        <app-admin-dashboard />
      } @placeholder {
        <p class="admin-boot" role="status">Loading admin…</p>
      }
    </div>
  `,
  styles: `
    .admin-boot { padding: 48px clamp(16px, 4vw, 56px); font: 500 12px var(--mono); }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPageComponent {
  constructor() {
    inject(Meta).updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }
}
