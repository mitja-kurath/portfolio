import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';
import { EquipmentSectionDto, SkillGroupDto } from '../../core/api/api.models';
import { DisplayHeadingComponent } from '../../shared/display-heading/display-heading.component';
import { SectionLabelComponent } from '../../shared/section-label/section-label.component';
import { KitGroupComponent } from './kit-group/kit-group.component';

@Component({
  selector: 'section[appEquipment]',
  imports: [SectionLabelComponent, DisplayHeadingComponent, KitGroupComponent],
  templateUrl: './equipment.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'equipment section-wrap', id: 'equipment' },
})
export class EquipmentComponent {
  readonly section = input.required<EquipmentSectionDto>();
  readonly groups = input.required<readonly SkillGroupDto[]>();
}
