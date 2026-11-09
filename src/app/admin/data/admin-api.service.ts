import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ContactMessageDto } from '../../core/api/admin.models';

/**
 * Write operations of the admin API (`/api/v1/admin`). Reads use `httpResource` in the
 * components. Paths are relative; `apiInterceptor` adds the base URL and maps errors.
 */
@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);

  create<T>(collection: string, body: object): Promise<T> {
    return firstValueFrom(this.http.post<T>(collection, body));
  }

  update<T>(collection: string, id: string, body: object): Promise<T> {
    return firstValueFrom(this.http.put<T>(`${collection}/${encodeURIComponent(id)}`, body));
  }

  remove(collection: string, id: string): Promise<unknown> {
    return firstValueFrom(this.http.delete(`${collection}/${encodeURIComponent(id)}`));
  }

  reorder<T>(collection: string, ids: string[]): Promise<T[]> {
    return firstValueFrom(this.http.put<T[]>(`${collection}/order`, { ids }));
  }

  markMessage(id: string, read: boolean): Promise<ContactMessageDto> {
    return firstValueFrom(
      this.http.patch<ContactMessageDto>(`admin/messages/${encodeURIComponent(id)}`, { read }),
    );
  }

  rebuildSite(): Promise<unknown> {
    return firstValueFrom(this.http.post('admin/rebuild', {}));
  }
}
