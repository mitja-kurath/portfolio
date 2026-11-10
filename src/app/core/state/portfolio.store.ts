import { httpResource } from '@angular/common/http';
import {
  Injectable,
  TransferState,
  computed,
  inject,
  linkedSignal,
  makeStateKey,
} from '@angular/core';
import { API_ENDPOINTS } from '../api/api.config';
import { PortfolioDto, ProfileDto, ProjectDto, RoleDto, SkillGroupDto } from '../api/api.models';
import { ApiError, toApiError } from '../api/api-error';
import { byOrder } from '../util/format';

export type LoadStatus = 'loading' | 'ready' | 'error';

/** Key under which the pre-rendered page embeds the build-time payload. */
export const PORTFOLIO_STATE_KEY = makeStateKey<PortfolioDto>('portfolio');

/**
 * Loads `/portfolio` (projects, skills, roles) and exposes it as read-only signals.
 * Static site texts are not loaded; they live in `core/content/site-content.ts`.
 *
 * Pre-rendering: the build-time payload is serialised into the HTML (TransferState).
 * The browser starts from it, so hydration sees the same content, and still fetches
 * the live API once; a newer response replaces it, a failed one is ignored.
 */
@Injectable({ providedIn: 'root' })
export class PortfolioStore {
  private readonly transferState = inject(TransferState);
  private readonly resource = httpResource<PortfolioDto>(() => API_ENDPOINTS.portfolio);
  private readonly seed = this.transferState.get(PORTFOLIO_STATE_KEY, null);

  /**
   * Latest successful payload (initially the pre-rendered one, if any). A failed
   * refresh keeps the previous content instead of replacing the page with the error block.
   */
  private readonly data = linkedSignal<PortfolioDto | null, PortfolioDto | null>({
    source: () => (this.resource.hasValue() ? this.resource.value() : null),
    computation: (next, previous) => next ?? previous?.value ?? this.seed,
  });

  readonly status = computed<LoadStatus>(() => {
    if (this.data()) {
      return 'ready';
    }
    return this.resource.status() === 'error' ? 'error' : 'loading';
  });

  readonly error = computed<ApiError | null>(() => {
    const error = this.resource.error();
    return error ? toApiError(error) : null;
  });

  readonly projects = computed<ProjectDto[]>(() => byOrder(this.data()?.projects ?? []));
  readonly skills = computed<SkillGroupDto[]>(() => byOrder(this.data()?.skills ?? []));
  readonly roles = computed<RoleDto[]>(() => byOrder(this.data()?.experience.roles ?? []));
  readonly profile = computed<ProfileDto>(() => this.data()?.profile ?? { portraitUrl: null });
  readonly experience = computed(() => ({ roles: this.roles() }));

  constructor() {
    // Runs when the server serialises the page (no-op in the browser).
    this.transferState.onSerialize(PORTFOLIO_STATE_KEY, () => this.data() ?? undefined);
  }

  /** Fetches `/portfolio` again; current content stays visible while it loads. */
  reload(): void {
    this.resource.reload();
  }
}
