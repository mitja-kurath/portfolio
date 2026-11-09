import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  input,
} from '@angular/core';
import { ContactLinkDto } from '../../../core/api/api.models';

/** One arm of the signpost. Host is the <a>, so `.sign` / `.sign-{kind}` apply directly. */
@Component({
  selector: 'a[appContactSign]',
  template: `
    @if (link().direction === 'left') {
      <b>←</b>
      <span>{{ link().label }}</span>
      <small>{{ link().hint }}</small>
    } @else {
      <span>{{ link().label }}</span>
      <small>{{ link().hint }}</small>
      <b>→</b>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    '[class]': 'kindClass()',
    '[attr.href]': 'link().href',
    '[attr.target]': 'link().external ? "_blank" : null',
    '[attr.rel]': 'link().external ? "noreferrer" : null',
  },
})
export class ContactSignComponent {
  readonly link = input.required<ContactLinkDto>();

  protected readonly kindClass = computed(() => `sign sign-${this.link().kind}`);
}
