import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
  input,
} from '@angular/core';
import { SiteDto } from '../../core/api/api.models';
import { ClockService, formatClock } from '../../core/state/clock.service';

@Component({
  selector: 'footer[appFooter]',
  templateUrl: './footer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class FooterComponent {
  readonly site = input.required<SiteDto>();

  private readonly clock = inject(ClockService);

  protected readonly time = computed(() =>
    formatClock(this.clock.now(), this.site().timezone || 'Europe/Zurich'),
  );
  protected readonly year = new Date().getFullYear();
}
