import { NgOptimizedImage } from '@angular/common';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';
import { AboutSection } from '../../core/content/site-content.model';

@Component({
  selector: 'section[appAbout]',
  imports: [NgOptimizedImage],
  templateUrl: './about.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'about section-wrap', id: 'about' },
})
export class AboutComponent {
  readonly section = input.required<AboutSection>();
  readonly initials = input.required<string>();
  /** Uploaded portrait (admin → Profile); null shows the illustrated placeholder. */
  readonly portraitUrl = input<string | null>(null);
}
