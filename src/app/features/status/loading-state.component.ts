import { ChangeDetectionStrategy, Component, ViewEncapsulation } from '@angular/core';

/**
 * Placeholder for the API-driven sections (work, equipment, experience) while `/portfolio`
 * loads. The static sections around it are already rendered.
 */
@Component({
  selector: 'section[appLoadingState]',
  template: `<p class="visually-hidden" role="status">Loading projects…</p>`,
  styleUrl: './status.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'api-loading', 'aria-busy': 'true' },
})
export class LoadingStateComponent {}
