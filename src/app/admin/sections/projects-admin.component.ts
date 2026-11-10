import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ADMIN_COLLECTIONS, AdminProjectDto, ProjectInput } from '../../core/api/admin.models';
import { ArtVariant } from '../../core/api/api.models';
import { ProjectArtComponent } from '../../features/work/project-art/project-art.component';
import { AdminCollection } from '../data/admin-collection';
import { AdminErrorComponent } from '../ui/admin-error.component';
import { FocusOnOpenDirective } from '../ui/focus-on-open.directive';
import { ImageUploadComponent } from '../ui/image-upload.component';
import { AdminListComponent, AdminRow } from '../ui/admin-list.component';
import { SLUG_PATTERN, slugify } from '../ui/slug';

export const ART_VARIANTS: readonly { value: ArtVariant; label: string }[] = [
  { value: 1, label: 'Signal rings' },
  { value: 2, label: 'Needle grid' },
  { value: 3, label: 'Contour lines' },
  { value: 4, label: 'Fire symbol' },
];

const FIELD_LABELS: Record<string, string> = {
  id: 'Id',
  name: 'Name',
  type: 'Type',
  year: 'Year',
  stack: 'Stack',
  description: 'Description',
  artVariant: 'Artwork',
  coordinates: 'Coordinates',
  url: 'Link',
  published: 'Published',
};

/** Projects: list (incl. drafts), reorder, create, edit, delete. */
@Component({
  selector: 'app-projects-admin',
  imports: [
    ReactiveFormsModule,
    FocusOnOpenDirective,
    AdminListComponent,
    AdminErrorComponent,
    ProjectArtComponent,
    ImageUploadComponent,
  ],
  templateUrl: './projects-admin.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsAdminComponent {
  protected readonly collection = new AdminCollection<AdminProjectDto>(ADMIN_COLLECTIONS.projects);
  protected readonly artVariants = ART_VARIANTS;
  protected readonly fieldLabels = FIELD_LABELS;

  /** undefined: editor closed · null: new project · string: editing that id. */
  protected readonly editingId = signal<string | null | undefined>(undefined);

  protected readonly rows = computed<AdminRow[]>(() =>
    this.collection.items().map((p) => ({
      id: p.id,
      title: p.name,
      meta: `${p.year} · ${p.type}`,
      badge: p.published ? null : 'DRAFT',
      muted: !p.published,
    })),
  );

  protected readonly form = inject(NonNullableFormBuilder).group({
    id: ['', [Validators.required, Validators.maxLength(64), Validators.pattern(SLUG_PATTERN)]],
    name: ['', [Validators.required, Validators.maxLength(80)]],
    type: ['', [Validators.required, Validators.maxLength(80)]],
    year: ['', [Validators.required, Validators.maxLength(20)]],
    stack: ['', [Validators.required, Validators.maxLength(200)]],
    description: ['', [Validators.required, Validators.maxLength(600)]],
    artVariant: [1 as ArtVariant],
    latitude: ['', Validators.maxLength(40)],
    longitude: ['', Validators.maxLength(40)],
    url: ['', [Validators.maxLength(500), Validators.pattern(/^https?:\/\/\S+$/)]],
    published: [true],
  });

  private readonly formValue = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });
  /** Banner image of the entry being edited (saved together with the form). */
  protected readonly image = signal<{ key: string | null; url: string | null }>({ key: null, url: null });

  protected readonly preview = computed(() => {
    const value = { ...this.form.getRawValue(), ...this.formValue() };
    return {
      variant: Number(value.artVariant) as ArtVariant,
      coordinates: [value.latitude ?? '', value.longitude ?? ''].filter(Boolean),
    };
  });

  constructor() {
    // Suggest the id from the name for new projects until the id is edited by hand.
    this.form.controls.name.valueChanges.pipe(takeUntilDestroyed()).subscribe((name) => {
      if (this.editingId() === null && !this.form.controls.id.dirty) {
        this.form.controls.id.setValue(slugify(name));
      }
    });
  }

  protected openNew(): void {
    this.collection.clearError();
    this.form.reset();
    this.form.controls.id.enable();
    this.image.set({ key: null, url: null });
    this.editingId.set(null);
  }

  protected openEdit(id: string): void {
    const project = this.collection.find(id);
    if (!project) return;
    this.collection.clearError();
    this.form.reset({
      id: project.id,
      name: project.name,
      type: project.type,
      year: project.year,
      stack: project.stack,
      description: project.description,
      artVariant: project.artVariant,
      latitude: project.coordinates[0] ?? '',
      longitude: project.coordinates[1] ?? '',
      url: project.url ?? '',
      published: project.published,
    });
    this.image.set({ key: project.imageKey, url: project.imageUrl ?? null });
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
    const body: ProjectInput = {
      name: value.name,
      type: value.type,
      year: value.year,
      stack: value.stack,
      description: value.description,
      artVariant: Number(value.artVariant) as ArtVariant,
      coordinates: [value.latitude, value.longitude].filter((line) => line.trim() !== ''),
      url: value.url || undefined,
      layoutClass: id ? this.collection.find(id)?.layoutClass : undefined,
      published: value.published,
      imageKey: this.image().key,
    };
    const saved = await this.collection.save(id ?? null, id ? body : { id: value.id, ...body });
    if (saved) this.close();
  }

  protected async remove(id: string): Promise<void> {
    if (await this.collection.remove(id)) {
      if (this.editingId() === id) this.close();
    }
  }

  protected invalid(name: string): boolean {
    const control = this.form.get(name);
    return !!control && control.invalid && control.touched;
  }
}
