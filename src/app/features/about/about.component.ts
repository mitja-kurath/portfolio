import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';
import { AboutSection } from '../../core/content/site-content.model';

@Component({
  selector: 'section[appAbout]',
  templateUrl: './about.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'about section-wrap', id: 'about' },
})
export class AboutComponent {
  readonly section = input.required<AboutSection>();
  readonly initials = input.required<string>();
}
