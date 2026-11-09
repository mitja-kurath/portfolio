import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';
import { SiteDto } from '../../core/api/api.models';
import { ContourComponent } from '../../shared/contour/contour.component';

@Component({
  selector: 'section[appHero]',
  imports: [ContourComponent],
  templateUrl: './hero.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'hero', id: 'base-camp' },
})
export class HeroComponent {
  readonly site = input.required<SiteDto>();
}
