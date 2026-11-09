import { DatePipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ContactMessageDto } from '../../core/api/admin.models';
import { ApiError, toApiError } from '../../core/api/api-error';
import { AdminApiService } from '../data/admin-api.service';
import { AdminErrorComponent } from '../ui/admin-error.component';

/** Contact form inbox: newest first, mark read/unread, reply by email, delete. */
@Component({
  selector: 'app-messages-admin',
  imports: [DatePipe, AdminErrorComponent],
  template: `
    <div class="admin-section-head">
      <p>Messages from the contact form. Replying opens your email app.</p>
      <button type="button" (click)="messages.reload()">Refresh</button>
    </div>

    <app-admin-error [error]="loadError() ?? writeError()" />

    @if (messages.isLoading() && !messages.hasValue()) {
      <p class="admin-muted" role="status">Loading messages…</p>
    } @else {
      <ul class="admin-messages" aria-label="Messages">
        @for (m of list(); track m.id) {
          <li class="admin-message" [class.is-unread]="!m.readAt">
            <div class="admin-message-head">
              <strong>{{ m.name }}</strong>
              <a [href]="'mailto:' + m.email">{{ m.email }}</a>
              <time [attr.datetime]="m.receivedAt">{{ m.receivedAt | date: 'd MMM y, HH:mm' }}</time>
              @if (!m.readAt) {
                <span class="admin-badge">NEW</span>
              }
            </div>
            <p class="admin-message-body">{{ m.message }}</p>
            <div class="admin-row-actions">
              <a class="admin-button" [href]="replyLink(m)">Reply</a>
              <button type="button" (click)="mark(m, !m.readAt)" [disabled]="busy()">
                {{ m.readAt ? 'Mark unread' : 'Mark read' }}
              </button>
              @if (confirmId() === m.id) {
                <button type="button" class="admin-danger" (click)="remove(m.id)" [disabled]="busy()">
                  Really delete?
                </button>
                <button type="button" (click)="confirmId.set(null)">Cancel</button>
              } @else {
                <button type="button" (click)="confirmId.set(m.id)">Delete</button>
              }
            </div>
          </li>
        } @empty {
          <li class="admin-empty">No messages yet.</li>
        }
      </ul>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessagesAdminComponent {
  private readonly api = inject(AdminApiService);

  protected readonly messages = httpResource<ContactMessageDto[]>(() => 'admin/messages');
  protected readonly list = computed(() => (this.messages.hasValue() ? this.messages.value() : []));
  protected readonly loadError = computed<ApiError | null>(() => {
    const error = this.messages.error();
    return error ? toApiError(error) : null;
  });
  protected readonly writeError = signal<ApiError | null>(null);
  protected readonly busy = signal(false);
  protected readonly confirmId = signal<string | null>(null);

  protected replyLink(m: ContactMessageDto): string {
    return `mailto:${m.email}?subject=${encodeURIComponent('Re: your message')}`;
  }

  protected mark(m: ContactMessageDto, read: boolean): Promise<void> {
    return this.write(() => this.api.markMessage(m.id, read));
  }

  protected remove(id: string): Promise<void> {
    this.confirmId.set(null);
    return this.write(() => this.api.remove('admin/messages', id));
  }

  private async write(operation: () => Promise<unknown>): Promise<void> {
    this.busy.set(true);
    this.writeError.set(null);
    try {
      await operation();
      this.messages.reload();
    } catch (error) {
      this.writeError.set(toApiError(error));
    } finally {
      this.busy.set(false);
    }
  }
}
