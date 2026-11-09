import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';
import {
  ContactFormConfig,
  ContactLink,
  ContactSection,
} from '../../core/content/site-content.model';
import { ContourComponent } from '../../shared/contour/contour.component';
import { DisplayHeadingComponent } from '../../shared/display-heading/display-heading.component';
import { SectionLabelComponent } from '../../shared/section-label/section-label.component';
import { ContactFormComponent } from './contact-form/contact-form.component';
import { ContactSignComponent } from './contact-sign/contact-sign.component';

@Component({
  selector: 'section[appContact]',
  imports: [
    ContourComponent,
    SectionLabelComponent,
    DisplayHeadingComponent,
    ContactSignComponent,
    ContactFormComponent,
  ],
  templateUrl: './contact.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'contact', id: 'contact' },
})
export class ContactComponent {
  readonly section = input.required<ContactSection>();
  readonly links = input.required<readonly ContactLink[]>();
  readonly form = input.required<ContactFormConfig>();
}
