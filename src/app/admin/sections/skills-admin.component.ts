import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ADMIN_COLLECTIONS, SkillGroupInput } from '../../core/api/admin.models';
import { SkillGroupDto } from '../../core/api/api.models';
import { AdminCollection } from '../data/admin-collection';
import { AdminErrorComponent } from '../ui/admin-error.component';
import { FocusOnOpenDirective } from '../ui/focus-on-open.directive';
import { AdminListComponent, AdminRow } from '../ui/admin-list.component';
import { SLUG_PATTERN, slugify } from '../ui/slug';

/** Skill groups (the “What’s in the pack” kit): one item per line. */
@Component({
  selector: 'app-skills-admin',
  imports: [ReactiveFormsModule, FocusOnOpenDirective, AdminListComponent, AdminErrorComponent],
  template: `
    <div class="admin-section-head">
      <p>Groups in “What’s in the pack”. The nav counter (Kit) is the total number of items.</p>
      <button type="button" class="admin-primary" (click)="openNew()">+ New group</button>
    </div>

    @if (collection.loadError(); as error) {
      <app-admin-error [error]="error" />
    } @else if (collection.loading()) {
      <p class="admin-muted" role="status">Loading skill groups…</p>
    } @else {
      <app-admin-list
        label="Skill groups"
        [rows]="rows()"
        [selectedId]="editingId()"
        [busy]="collection.busy()"
        (edit)="openEdit($event)"
        (move)="collection.move($event.id, $event.delta)"
        (remove)="remove($event)"
      />
    }

    @if (editingId() !== undefined) {
      <form class="admin-editor" appFocusOnOpen [formGroup]="form" (ngSubmit)="submit()" novalidate aria-labelledby="skill-editor-title">
        <div class="admin-editor-head">
          <h2 id="skill-editor-title">{{ editingId() === null ? 'New skill group' : 'Edit skill group' }}</h2>
          <button type="button" (click)="close()">Close</button>
        </div>
        <div class="admin-fields admin-fields-single">
          <label class="admin-field">
            <span>Title</span>
            <input formControlName="title" maxlength="60" [attr.aria-invalid]="invalid('title')" />
          </label>
          <label class="admin-field">
            <span>Id <small>(cannot change later)</small></span>
            <input formControlName="id" maxlength="64" [attr.aria-invalid]="invalid('id')" />
          </label>
          <label class="admin-field">
            <span>Items <small>(one per line, max. 30)</small></span>
            <textarea formControlName="items" rows="8" [attr.aria-invalid]="invalid('items')"></textarea>
          </label>
        </div>
        <app-admin-error [error]="collection.writeError()" [labels]="{ id: 'Id', title: 'Title', items: 'Items' }" />
        <div class="admin-editor-actions">
          <button type="submit" class="admin-primary" [disabled]="collection.busy()">
            {{ collection.busy() ? 'Saving…' : 'Save group' }}
          </button>
        </div>
      </form>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SkillsAdminComponent {
  protected readonly collection = new AdminCollection<SkillGroupDto>(ADMIN_COLLECTIONS.skillGroups);
  protected readonly editingId = signal<string | null | undefined>(undefined);

  protected readonly rows = computed<AdminRow[]>(() =>
    this.collection.items().map((g) => ({
      id: g.id,
      title: g.title,
      meta: `${g.items.length} items · ${g.items.slice(0, 3).join(', ')}${g.items.length > 3 ? ', …' : ''}`,
    })),
  );

  protected readonly form = inject(NonNullableFormBuilder).group({
    id: ['', [Validators.required, Validators.maxLength(64), Validators.pattern(SLUG_PATTERN)]],
    title: ['', [Validators.required, Validators.maxLength(60)]],
    items: ['', Validators.required],
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
    const group = this.collection.find(id);
    if (!group) return;
    this.collection.clearError();
    this.form.reset({ id: group.id, title: group.title, items: group.items.join('\n') });
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
    const value = this.form.getRawValue();
    const id = this.editingId();
    const body: SkillGroupInput = {
      title: value.title,
      items: value.items.split('\n').map((item) => item.trim()).filter(Boolean),
    };
    const saved = await this.collection.save(id ?? null, id ? body : { id: value.id, ...body });
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
