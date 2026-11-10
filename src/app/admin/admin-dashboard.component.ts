import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, ViewEncapsulation, computed, inject, signal } from '@angular/core';
import { AdminSessionDto } from '../core/api/admin.models';
import { ApiError, toApiError } from '../core/api/api-error';
import { AdminApiService } from './data/admin-api.service';
import { MessagesAdminComponent } from './sections/messages-admin.component';
import { ProfileAdminComponent } from './sections/profile-admin.component';
import { ProjectsAdminComponent } from './sections/projects-admin.component';
import { RolesAdminComponent } from './sections/roles-admin.component';
import { SkillsAdminComponent } from './sections/skills-admin.component';
import { AdminErrorComponent } from './ui/admin-error.component';

type Section = 'projects' | 'skills' | 'roles' | 'profile' | 'messages';

/** Admin shell: session check, section switcher, rebuild action. Browser only. */
@Component({
  selector: 'app-admin-dashboard',
  imports: [
    ProjectsAdminComponent,
    SkillsAdminComponent,
    RolesAdminComponent,
    MessagesAdminComponent,
    ProfileAdminComponent,
    AdminErrorComponent,
  ],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class AdminDashboardComponent {
  private readonly api = inject(AdminApiService);

  protected readonly sections: readonly { id: Section; label: string }[] = [
    { id: 'projects', label: 'Projects' },
    { id: 'skills', label: 'Skills' },
    { id: 'roles', label: 'Experience' },
    { id: 'profile', label: 'Profile' },
    { id: 'messages', label: 'Messages' },
  ];
  protected readonly section = signal<Section>('projects');

  protected readonly session = httpResource<AdminSessionDto>(() => 'admin/session');
  protected readonly sessionError = computed<ApiError | null>(() => {
    const error = this.session.error();
    return error ? toApiError(error) : null;
  });

  protected readonly rebuild = signal<'idle' | 'running' | 'done'>('idle');
  protected readonly rebuildError = signal<ApiError | null>(null);

  protected async triggerRebuild(): Promise<void> {
    this.rebuild.set('running');
    this.rebuildError.set(null);
    try {
      await this.api.rebuildSite();
      this.rebuild.set('done');
    } catch (error) {
      this.rebuildError.set(toApiError(error));
      this.rebuild.set('idle');
    }
  }
}
