import { HttpResourceRef, httpResource } from '@angular/common/http';
import { computed, inject, signal } from '@angular/core';
import { ApiError, toApiError } from '../../core/api/api-error';
import { byOrder } from '../../core/util/format';
import { AdminApiService } from './admin-api.service';

/**
 * State and actions for one ordered admin collection (projects, skill groups, roles).
 * Create it in an injection context (e.g. a component field initializer).
 */
export class AdminCollection<T extends { id: string; order: number }> {
  private readonly api = inject(AdminApiService);
  private readonly resource: HttpResourceRef<T[] | undefined>;

  readonly items = computed<T[]>(() => (this.resource.hasValue() ? byOrder(this.resource.value()) : []));
  readonly loading = computed(() => this.resource.isLoading() && !this.resource.hasValue());
  readonly loadError = computed<ApiError | null>(() => {
    const error = this.resource.error();
    return error ? toApiError(error) : null;
  });
  /** A write is in flight. */
  readonly busy = signal(false);
  /** Error of the last write (incl. field errors for 400). */
  readonly writeError = signal<ApiError | null>(null);

  constructor(private readonly path: string) {
    this.resource = httpResource<T[]>(() => path);
  }

  find(id: string): T | undefined {
    return this.items().find((item) => item.id === id);
  }

  /** Creates (`id === null`, body includes the new id) or updates an entry. */
  save(id: string | null, body: object): Promise<T | null> {
    return this.write(() =>
      id === null ? this.api.create<T>(this.path, body) : this.api.update<T>(this.path, id, body),
    );
  }

  async remove(id: string): Promise<boolean> {
    return (await this.write(() => this.api.remove(this.path, id))) !== null;
  }

  /** Moves an entry up (-1) or down (+1). */
  async move(id: string, delta: -1 | 1): Promise<void> {
    const ids = this.items().map((item) => item.id);
    const from = ids.indexOf(id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= ids.length) return;
    [ids[from], ids[to]] = [ids[to], ids[from]];
    await this.write(() => this.api.reorder<T>(this.path, ids));
  }

  clearError(): void {
    this.writeError.set(null);
  }

  private async write<R>(operation: () => Promise<R>): Promise<R | null> {
    this.busy.set(true);
    this.writeError.set(null);
    try {
      const result = await operation();
      this.resource.reload();
      return result ?? (true as R);
    } catch (error) {
      this.writeError.set(toApiError(error));
      return null;
    } finally {
      this.busy.set(false);
    }
  }
}
