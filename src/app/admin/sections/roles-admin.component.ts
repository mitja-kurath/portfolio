import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ADMIN_COLLECTIONS, RoleInput } from '../../core/api/admin.models';
import { RoleDto } from '../../core/api/api.models';
import { AdminCollection } from '../data/admin-collection';
import { AdminErrorComponent } from '../ui/admin-error.component';
import { FocusOnOpenDirective } from '../ui/focus-on-open.directive';
import { AdminListComponent, AdminRow } from '../ui/admin-list.component';
import { SLUG_PATTERN, slugify } from '../ui/slug';

/** Career roles on the “Experience, in elevation” chart (first = lowest). */
@Component({
  selector: 'app-roles-admin',
  imports: [ReactiveFormsModule, FocusOnOpenDirective, AdminListComponent, AdminErrorComponent],
  template: `
    <div class="admin-section-head">
      <p>Points on the experience ridge, from the first (lowest) to the latest. Four fit the design best.</p>
      <button type="button" class="admin-primary" (click)="openNew()">+ New role</button>
    </div>

    @if (collection.loadError(); as error) {
      <app-admin-error [error]="error" />
    } @else if (collection.loading()) {
      <p class="admin-muted" role="status">Loading roles…</p>
    } @else {
      <app-admin-list
        label="Roles"
        [rows]="rows()"
        [selectedId]="editingId()"
        [busy]="collection.busy()"
        (edit)="openEdit($event)"
        (move)="collection.move($event.id, $event.delta)"
        (remove)="remove($event)"
      />
    }

    @if (editingId() !== undefined) {
      <form class="admin-editor" appFocusOnOpen [formGroup]="form" (ngSubmit)="submit()" novalidate aria-labelledby="role-editor-title">
        <div class="admin-editor-head">
          <h2 id="role-editor-title">{{ editingId() === null ? 'New role' : 'Edit role' }}</h2>
          <button type="button" (click)="close()">Close</button>
        </div>
        <div class="admin-fields admin-fields-single">
          <div class="admin-field-row">
            <label class="admin-field">
              <span>Title</span>
              <input formControlName="title" maxlength="80" [attr.aria-invalid]="invalid('title')" />
            </label>
            <label class="admin-field admin-field-narrow">
              <span>Year</span>
              <input formControlName="year" maxlength="20" placeholder="2026" [attr.aria-invalid]="invalid('year')" />
            </label>
          </div>
          <label class="admin-field">
            <span>Subtitle</span>
            <input formControlName="subtitle" maxlength="80" placeholder="Technical lead" [attr.aria-invalid]="invalid('subtitle')" />
          </label>
          <label class="admin-field">
            <span>Id <small>(cannot change later)</small></span>
            <input formControlName="id" maxlength="64" [attr.aria-invalid]="invalid('id')" />
          </label>
          <label class="admin-check">
            <input type="checkbox" formControlName="isCurrent" />
            <span>Current role (shows “NOW” instead of the year)</span>
          </label>
        </div>
        <app-admin-error [error]="collection.writeError()" [labels]="{ id: 'Id', title: 'Title', year: 'Year', subtitle: 'Subtitle' }" />
        <div class="admin-editor-actions">
          <button type="submit" class="admin-primary" [disabled]="collection.busy()">
            {{ collection.busy() ? 'Saving…' : 'Save role' }}
          </button>
        </div>
      </form>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RolesAdminComponent {
  protected readonly collection = new AdminCollection<RoleDto>(ADMIN_COLLECTIONS.roles);
  protected readonly editingId = signal<string | null | undefined>(undefined);

  protected readonly rows = computed<AdminRow[]>(() =>
    this.collection.items().map((r) => ({
      id: r.id,
      title: r.title,
      meta: `${r.year} · ${r.subtitle}`,
      badge: r.isCurrent ? 'NOW' : null,
    })),
  );

  protected readonly form = inject(NonNullableFormBuilder).group({
    id: ['', [Validators.required, Validators.maxLength(64), Validators.pattern(SLUG_PATTERN)]],
    title: ['', [Validators.required, Validators.maxLength(80)]],
    year: ['', [Validators.required, Validators.maxLength(20)]],
    subtitle: ['', [Validators.required, Validators.maxLength(80)]],
    isCurrent: [false],
  });

  constructor() {
    this.form.controls.title.valueChanges.pipe(takeUntilDestroyed()).subscribe((title) => {
      if (this.editingId() === null && !this.form.controls.id.dirty) {
        this.form.controls.id.setValue(slugify(title));
      }
    });
  }

  protected openNew(): void {
    this.collection.clearError();
    this.form.reset();
    this.form.controls.id.enable();
    this.editingId.set(null);
  }

  protected openEdit(id: string): void {
    const role = this.collection.find(id);
    if (!role) return;
    this.collection.clearError();
    this.form.reset({
      id: role.id,
      title: role.title,
      year: role.year,
      subtitle: role.subtitle,
      isCurrent: role.isCurrent,
    });
    this.form.controls.id.disable();
    this.editingId.set(id);
  }

  protected close(): void {
    this.editingId.set(undefined);
  }

  protected async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { id: newId, ...value } = this.form.getRawValue();
    const id = this.editingId();
    const body: RoleInput = value;
    const saved = await this.collection.save(id ?? null, id ? body : { id: newId, ...body });
    if (saved) this.close();
  }

  protected async remove(id: string): Promise<void> {
    if ((await this.collection.remove(id)) && this.editingId() === id) this.close();
  }

  protected invalid(name: string): boolean {
    const control = this.form.get(name);
    return !!control && control.invalid && control.touched;
  }
}
