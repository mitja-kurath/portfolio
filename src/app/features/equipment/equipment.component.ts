import { ChangeDetectionStrategy, Component, ViewEncapsulation, input } from '@angular/core';
import { SkillGroupDto } from '../../core/api/api.models';
import { EquipmentSection } from '../../core/content/site-content.model';
import { DisplayHeadingComponent } from '../../shared/display-heading/display-heading.component';
import { KitGroupComponent } from './kit-group/kit-group.component';

@Component({
  selector: 'section[appEquipment]',
  imports: [DisplayHeadingComponent, KitGroupComponent],
  templateUrl: './equipment.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'equipment section-wrap', id: 'equipment' },
})
export class EquipmentComponent {
  readonly section = input.required<EquipmentSection>();
  readonly groups = input.required<readonly SkillGroupDto[]>();
}
