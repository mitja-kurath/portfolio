import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';

/** `▮▯▮ 01 / THE ROUTE ———— 1,240 M` label at the top of every section. */
@Component({
  selector: 'div[appSectionLabel]',
  template: `<span class="stripe-mark" aria-hidden="true"><i></i><i></i><i></i></span><span>{{ number() }} / {{ title() }}</span><span class="elevation">{{ elevation() }} M</span>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'section-label' },
})
export class SectionLabelComponent {
  readonly number = input.required<string>();
  readonly title = input.required<string>();
  readonly elevation = input.required<string>();
}
