import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';
import { AboutSectionDto } from '../../core/api/api.models';
import { SectionLabelComponent } from '../../shared/section-label/section-label.component';

@Component({
  selector: 'section[appAbout]',
  imports: [SectionLabelComponent],
  templateUrl: './about.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'about section-wrap', id: 'about' },
})
export class AboutComponent {
  readonly section = input.required<AboutSectionDto>();
  readonly initials = input.required<string>();
}
