/**
 * @file apiClient.ts
 * @description Standardized HTTP REST API client for NovWrite Mobile.
 * Adheres to RFC 7807 problem details and paginated response envelopes.
 * Block Standard: BLOCK_MOBILE_API_CLIENT_001
 */

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  search?: string;
  sort?: string;
  category?: string;
  blueprintId?: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  nextPage?: number | null;
  previousPage?: number | null;
}

export interface ResponseMeta {
  requestId?: string;
  timestamp: string;
  executionTimeMs?: number;
  apiVersion: string;
}

export interface PaginatedApiResponse<T> {
  data: T[];
  pagination: PaginationMeta;
  meta: ResponseMeta;
}

export interface SingleApiResponse<T> {
  data: T;
  meta: ResponseMeta;
}

export interface ApiProblemDetail {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
  code?: string;
  invalidParams?: Array<{
    name: string;
    reason: string;
    receivedValue?: any;
  }>;
  requestId?: string;
  timestamp: string;
}

export class ApiError extends Error {
  problem: ApiProblemDetail;

  constructor(problem: ApiProblemDetail) {
    super(problem.detail || problem.title || "An API error occurred");
    this.name = "ApiError";
    this.problem = problem;
  }
}

export class MobileApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    if (baseUrl) {
      this.baseUrl = baseUrl;
    } else if (
      typeof process !== "undefined" &&
      process.env &&
      process.env.EXPO_PUBLIC_API_URL
    ) {
      this.baseUrl = process.env.EXPO_PUBLIC_API_URL;
    } else {
      this.baseUrl = "http://localhost:8080/api/v1";
    }
  }

  setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  private buildQueryString(params?: PaginationParams): string {
    if (!params) return "";
    const query = new URLSearchParams();

    if (params.page !== undefined) query.set("page", String(params.page));
    if (params.pageSize !== undefined)
      query.set("pageSize", String(params.pageSize));
    if (params.search) query.set("search", params.search);
    if (params.sort) query.set("sort", params.sort);
    if (params.category) query.set("category", params.category);
    if (params.blueprintId) query.set("blueprintId", params.blueprintId);

    const qs = query.toString();
    return qs ? `?${qs}` : "";
  }

  async getPaginated<T>(
    endpoint: string,
    params?: PaginationParams,
  ): Promise<PaginatedApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}${this.buildQueryString(params)}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const problem = await this.parseErrorResponse(response);
      throw new ApiError(problem);
    }

    return (await response.json()) as PaginatedApiResponse<T>;
  }

  async getSingle<T>(endpoint: string): Promise<SingleApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const problem = await this.parseErrorResponse(response);
      throw new ApiError(problem);
    }

    return (await response.json()) as SingleApiResponse<T>;
  }

  async post<T>(
    endpoint: string,
    body?: unknown,
  ): Promise<SingleApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const problem = await this.parseErrorResponse(response);
      throw new ApiError(problem);
    }

    return (await response.json()) as SingleApiResponse<T>;
  }

  async put<T>(
    endpoint: string,
    body?: unknown,
  ): Promise<SingleApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const problem = await this.parseErrorResponse(response);
      throw new ApiError(problem);
    }

    return (await response.json()) as SingleApiResponse<T>;
  }

  async delete(endpoint: string): Promise<void> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok && response.status !== 204) {
      const problem = await this.parseErrorResponse(response);
      throw new ApiError(problem);
    }
  }

  // Domain Helper Methods
  async listProjects(params?: PaginationParams) {
    return this.getPaginated<any>("/projects", params);
  }

  async createProject(data: {
    name: string;
    description?: string;
    genre?: string;
  }) {
    return this.post<any>("/projects", data);
  }

  async updateProject(
    projectId: string,
    data: { name?: string; description?: string; genre?: string },
  ) {
    return this.put<any>(`/projects/${projectId}`, data);
  }

  async deleteProject(projectId: string) {
    return this.delete(`/projects/${projectId}`);
  }

  async listChapters(projectId: string, params?: PaginationParams) {
    return this.getPaginated<any>(`/projects/${projectId}/chapters`, params);
  }

  async createChapter(
    projectId: string,
    data: { title: string; orderIndex?: number; synopsis?: string },
  ) {
    return this.post<any>(`/projects/${projectId}/chapters`, data);
  }

  async updateChapter(projectId: string, chapterId: string, data: any) {
    return this.put<any>(`/projects/${projectId}/chapters/${chapterId}`, data);
  }

  async deleteChapter(projectId: string, chapterId: string) {
    return this.delete(`/projects/${projectId}/chapters/${chapterId}`);
  }

  async listScenes(
    projectId: string,
    chapterId?: string,
    params?: PaginationParams,
  ) {
    const ep = chapterId
      ? `/projects/${projectId}/scenes?chapterId=${chapterId}`
      : `/projects/${projectId}/scenes`;
    return this.getPaginated<any>(ep, params);
  }

  async createScene(projectId: string, data: any) {
    return this.post<any>(`/projects/${projectId}/scenes`, data);
  }

  async updateScene(projectId: string, sceneId: string, data: any) {
    return this.put<any>(`/projects/${projectId}/scenes/${sceneId}`, data);
  }

  async deleteScene(projectId: string, sceneId: string) {
    return this.delete(`/projects/${projectId}/scenes/${sceneId}`);
  }

  async listBlueprints(projectId: string, params?: PaginationParams) {
    return this.getPaginated<any>(`/projects/${projectId}/blueprints`, params);
  }

  async createBlueprint(projectId: string, data: any) {
    return this.post<any>(`/projects/${projectId}/blueprints`, data);
  }

  async updateBlueprint(projectId: string, blueprintId: string, data: any) {
    return this.put<any>(
      `/projects/${projectId}/blueprints/${blueprintId}`,
      data,
    );
  }

  async deleteBlueprint(projectId: string, blueprintId: string) {
    return this.delete(`/projects/${projectId}/blueprints/${blueprintId}`);
  }

  async listEntities(projectId: string, params?: PaginationParams) {
    return this.getPaginated<any>(`/projects/${projectId}/entities`, params);
  }

  async createEntity(projectId: string, data: any) {
    return this.post<any>(`/projects/${projectId}/entities`, data);
  }

  async updateEntity(projectId: string, entityId: string, data: any) {
    return this.put<any>(`/projects/${projectId}/entities/${entityId}`, data);
  }

  async deleteEntity(projectId: string, entityId: string) {
    return this.delete(`/projects/${projectId}/entities/${entityId}`);
  }

  async listTimelineEvents(projectId: string, params?: PaginationParams) {
    return this.getPaginated<any>(
      `/projects/${projectId}/timeline/events`,
      params,
    );
  }

  async createTimelineEvent(projectId: string, data: any) {
    return this.post<any>(`/projects/${projectId}/timeline/events`, data);
  }

  async updateTimelineEvent(projectId: string, eventId: string, data: any) {
    return this.put<any>(
      `/projects/${projectId}/timeline/events/${eventId}`,
      data,
    );
  }

  async deleteTimelineEvent(projectId: string, eventId: string) {
    return this.delete(`/projects/${projectId}/timeline/events/${eventId}`);
  }

  async listRules(projectId: string, params?: PaginationParams) {
    return this.getPaginated<any>(`/projects/${projectId}/rules`, params);
  }

  async createRule(projectId: string, data: any) {
    return this.post<any>(`/projects/${projectId}/rules`, data);
  }

  async updateRule(projectId: string, ruleId: string, data: any) {
    return this.put<any>(`/projects/${projectId}/rules/${ruleId}`, data);
  }

  async deleteRule(projectId: string, ruleId: string) {
    return this.delete(`/projects/${projectId}/rules/${ruleId}`);
  }

  async getAudit(projectId: string, params?: PaginationParams) {
    return this.getPaginated<any>(`/projects/${projectId}/audit`, params);
  }

  async overrideViolation(
    projectId: string,
    violationId: string,
    justification: string,
    author?: string,
  ) {
    return this.post<any>(
      `/projects/${projectId}/audit/${violationId}/override`,
      { justification, author },
    );
  }

  private async parseErrorResponse(
    response: Response,
  ): Promise<ApiProblemDetail> {
    try {
      const json = await response.json();
      return json as ApiProblemDetail;
    } catch {
      return {
        type: `https://novwrite.io/errors/http-${response.status}`,
        title: response.statusText || "HTTP Error",
        status: response.status,
        detail: `Request failed with HTTP status ${response.status}`,
        timestamp: new Date().toISOString(),
      };
    }
  }
}

export const mobileApiClient = new MobileApiClient();
