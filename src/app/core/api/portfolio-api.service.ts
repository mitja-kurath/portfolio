import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_ENDPOINTS } from './api.config';
import {
  ContactMessageRequest,
  ContactMessageResponse,
  ExperienceDto,
  PortfolioDto,
  ProjectDto,
  SkillGroupDto,
} from './api.models';

/**
 * Typed client for the portfolio REST API. Paths are relative; `apiInterceptor`
 * adds the base URL and maps failures to `ApiError`.
 */
@Injectable({ providedIn: 'root' })
export class PortfolioApiService {
  private readonly http = inject(HttpClient);

  getProjects(): Observable<ProjectDto[]> {
    return this.http.get<ProjectDto[]>(API_ENDPOINTS.projects);
  }

  getSkills(): Observable<SkillGroupDto[]> {
    return this.http.get<SkillGroupDto[]>(API_ENDPOINTS.skills);
  }

  getExperience(): Observable<ExperienceDto> {
    return this.http.get<ExperienceDto>(API_ENDPOINTS.experience);
  }

  getPortfolio(): Observable<PortfolioDto> {
    return this.http.get<PortfolioDto>(API_ENDPOINTS.portfolio);
  }

  sendContactMessage(message: ContactMessageRequest): Observable<ContactMessageResponse> {
    return this.http.post<ContactMessageResponse>(API_ENDPOINTS.contactMessages, message);
  }
}
