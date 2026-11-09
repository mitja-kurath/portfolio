import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';

export interface AdminRow {
  id: string;
  title: string;
  meta: string;
  /** Short tag such as `DRAFT` or `NOW`. */
  badge?: string | null;
  muted?: boolean;
}

/** Ordered list with move up/down, edit and two-step delete. */
@Component({
  selector: 'app-admin-list',
  template: `
    <ol class="admin-list" [attr.aria-label]="label()">
      @for (row of rows(); track row.id; let first = $first, last = $last) {
        <li [class.is-selected]="row.id === selectedId()" [class.is-muted]="row.muted">
          <div class="admin-row-text">
            <strong>{{ row.title }}</strong>
            @if (row.badge) {
              <span class="admin-badge">{{ row.badge }}</span>
            }
            <small>{{ row.meta }}</small>
          </div>
          <div class="admin-row-actions">
            <button type="button" class="admin-icon" (click)="move.emit({ id: row.id, delta: -1 })"
              [disabled]="first || busy()" [attr.aria-label]="'Move ' + row.title + ' up'">↑</button>
            <button type="button" class="admin-icon" (click)="move.emit({ id: row.id, delta: 1 })"
              [disabled]="last || busy()" [attr.aria-label]="'Move ' + row.title + ' down'">↓</button>
            <button type="button" (click)="edit.emit(row.id)" [attr.aria-label]="'Edit ' + row.title">
              Edit
            </button>
            @if (confirmId() === row.id) {
              <button type="button" class="admin-danger" (click)="confirmRemove(row.id)" [disabled]="busy()">
                Really delete?
              </button>
              <button type="button" (click)="confirmId.set(null)">Cancel</button>
            } @else {
              <button type="button" (click)="confirmId.set(row.id)" [attr.aria-label]="'Delete ' + row.title">
                Delete
              </button>
            }
          </div>
        </li>
      } @empty {
        <li class="admin-empty">Nothing here yet.</li>
      }
    </ol>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminListComponent {
  readonly label = input.required<string>();
  readonly rows = input.required<readonly AdminRow[]>();
  readonly selectedId = input<string | null | undefined>(undefined);
  readonly busy = input(false);

  readonly edit = output<string>();
  readonly move = output<{ id: string; delta: -1 | 1 }>();
  readonly remove = output<string>();

  protected readonly confirmId = signal<string | null>(null);

  protected confirmRemove(id: string): void {
    this.confirmId.set(null);
    this.remove.emit(id);
  }
}
