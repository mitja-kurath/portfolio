import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

/**
 * Skeleton shown while `/portfolio` loads: the empty topbar rule and hero block on the
 * paper background, using the same classes so dimensions match the loaded page (no CLS).
 */
@Component({
  selector: 'app-loading-state',
  template: `
    <div class="topbar" aria-hidden="true"></div>
    <section class="hero" aria-busy="true">
      <p class="visually-hidden" role="status">Loading…</p>
    </section>
  `,
  styleUrl: './status.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { style: 'display: contents' },
})
export class LoadingStateComponent {}
