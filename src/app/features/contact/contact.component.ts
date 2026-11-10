import { ChangeDetectionStrategy, Component, ViewEncapsulation, inject, input } from '@angular/core';
import {
  ContactFormConfig,
  ContactLink,
  ContactSection,
} from '../../core/content/site-content.model';
import { ContourComponent } from '../../shared/contour/contour.component';
import { DisplayHeadingComponent } from '../../shared/display-heading/display-heading.component';
import { ContactFormComponent } from './contact-form/contact-form.component';
import { CONTACT_FORM_SETTINGS } from './contact-form/contact-form.settings';
import { ContactSignComponent } from './contact-sign/contact-sign.component';

@Component({
  selector: 'section[appContact]',
  imports: [
    ContourComponent,
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

  protected readonly formSettings = inject(CONTACT_FORM_SETTINGS);
}
