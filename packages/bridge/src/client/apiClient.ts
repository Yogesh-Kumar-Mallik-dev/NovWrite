/**
 * @file apiClient.ts
 * @description Canonical HTTP REST API client and realtime SSE stream consumer for NovWrite frontends (Web, Desktop, Mobile).
 * Adheres to Version 2.4 REST API guidelines, RFC 7807 problem details, and paginated response envelopes.
 * Block Standard: BLOCK_COMM_BRIDGE_API_CLIENT_001
 */

import type { SceneLeaseInfo, SceneLeaseResponse } from "../types.js";

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

export interface SSEEventPayload<T = unknown> {
  id?: string;
  event: string;
  projectId?: string;
  payload: T;
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

/**
 * Pure client-side array paginator matching backend RFC pagination structure.
 */
export function paginateArray<T>(
  items: T[],
  params?: PaginationParams,
): PaginatedApiResponse<T> {
  const page = Math.max(1, params?.page || 1);
  const pageSize = Math.max(1, Math.min(100, params?.pageSize || 10));
  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const clampedPage = Math.min(page, totalPages);

  const startIndex = (clampedPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const data = items.slice(startIndex, endIndex);

  const hasNextPage = clampedPage < totalPages;
  const hasPreviousPage = clampedPage > 1;

  return {
    data,
    pagination: {
      page: clampedPage,
      pageSize,
      totalCount,
      totalPages,
      hasNextPage,
      hasPreviousPage,
      nextPage: hasNextPage ? clampedPage + 1 : null,
      previousPage: hasPreviousPage ? clampedPage - 1 : null,
    },
    meta: {
      requestId:
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `req-client-${Date.now()}`,
      timestamp: new Date().toISOString(),
      executionTimeMs: 0.5,
      apiVersion: "v1",
    },
  };
}

export class NovWriteApiClient {
  private baseUrl: string;
  private authToken: string | null = null;
  private isRefreshing: boolean = false;
  private refreshSubscribers: Array<(token: string | null) => void> = [];

  constructor(baseUrl?: string) {
    if (baseUrl) {
      this.baseUrl = baseUrl;
    } else if (
      typeof window !== "undefined" &&
      (window as any).__NOVWRITE_API_URL__
    ) {
      this.baseUrl = (window as any).__NOVWRITE_API_URL__;
    } else if (
      typeof process !== "undefined" &&
      process.env &&
      process.env.EXPO_PUBLIC_API_URL
    ) {
      this.baseUrl = process.env.EXPO_PUBLIC_API_URL;
    } else if (
      typeof window !== "undefined" &&
      window.location &&
      (window.location.protocol === "tauri:" ||
        window.location.hostname === "tauri.localhost")
    ) {
      this.baseUrl = "http://127.0.0.1:8080/api/v1";
    } else if (
      typeof window !== "undefined" &&
      window.location &&
      window.location.origin &&
      window.location.origin.startsWith("http")
    ) {
      this.baseUrl = "/api/v1";
    } else {
      this.baseUrl = "http://127.0.0.1:8080/api/v1";
    }
  }

  setBaseUrl(url: string) {
    this.baseUrl = url;
  }

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  getAuthToken(): string | null {
    return this.authToken;
  }

  private getHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...customHeaders,
    };
    if (this.authToken) {
      headers["Authorization"] = `Bearer ${this.authToken}`;
    }
    return headers;
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
      headers: this.getHeaders(),
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
      headers: this.getHeaders(),
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
      headers: this.getHeaders({ "Content-Type": "application/json" }),
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
      headers: this.getHeaders({ "Content-Type": "application/json" }),
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
      headers: this.getHeaders(),
    });

    if (!response.ok && response.status !== 204) {
      const problem = await this.parseErrorResponse(response);
      throw new ApiError(problem);
    }
  }

  // ==========================================
  // Authentication & Identity
  // ==========================================

  async login(data: { emailOrUsername: string; password?: string }) {
    const resp = await this.post<any>("/auth/login", data);
    if (resp && resp.data && resp.data.token) {
      this.setAuthToken(resp.data.token);
    }
    return resp;
  }

  async register(data: { email: string; username: string; password?: string; role?: string }) {
    const resp = await this.post<any>("/auth/register", data);
    if (resp && resp.data && resp.data.token) {
      this.setAuthToken(resp.data.token);
    }
    return resp;
  }

  async refreshToken(refreshToken?: string) {
    const resp = await this.post<any>("/auth/refresh", { refreshToken });
    if (resp && resp.data && resp.data.token) {
      this.setAuthToken(resp.data.token);
    }
    return resp;
  }

  async logout() {
    try {
      await this.post<any>("/auth/logout", {});
    } finally {
      this.setAuthToken(null);
    }
  }

  async me() {
    return this.getSingle<any>("/auth/me");
  }

  async changePassword(data: { oldPassword: string; newPassword: string }) {
    return this.post<any>("/auth/password", data);
  }

  async superAdminLogin(data: { emailOrUsername: string; password?: string }) {
    const resp = await this.post<any>("/superadmin/login", data);
    if (resp && resp.data && resp.data.token) {
      this.setAuthToken(resp.data.token);
    }
    return resp;
  }

  async superAdminDashboard() {
    return this.getSingle<any>("/superadmin/dashboard");
  }

  // ==========================================
  // Domain Helper Methods
  // ==========================================

  // Projects
  async listProjects(params?: PaginationParams) {
    return this.getPaginated<any>("/projects", params);
  }

  async getProject(projectId: string) {
    return this.getSingle<any>(`/projects/${projectId}`);
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

  // Chapters & Scenes
  async listChapters(projectId: string, params?: PaginationParams) {
    return this.getPaginated<any>(`/projects/${projectId}/chapters`, params);
  }

  async createChapter(
    projectId: string,
    data: { title: string; orderIndex?: number; synopsis?: string },
  ) {
    return this.post<any>(`/projects/${projectId}/chapters`, data);
  }

  async updateChapter(
    projectId: string,
    chapterId: string,
    data: { title?: string; orderIndex?: number; synopsis?: string },
  ) {
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

  // Scene Leases (Collaborative Locks)
  async getSceneLease(projectId: string, sceneId: string) {
    return this.getSingle<SceneLeaseInfo>(
      `/projects/${projectId}/scenes/${sceneId}/lease`,
    );
  }

  async acquireSceneLease(
    projectId: string,
    sceneId: string,
    authorId: string,
  ) {
    return this.post<SceneLeaseResponse>(
      `/projects/${projectId}/scenes/${sceneId}/lease/acquire`,
      { authorId },
    );
  }

  async renewSceneLease(projectId: string, sceneId: string, authorId: string) {
    return this.post<SceneLeaseResponse>(
      `/projects/${projectId}/scenes/${sceneId}/lease/renew`,
      { authorId },
    );
  }

  async releaseSceneLease(
    projectId: string,
    sceneId: string,
    authorId: string,
  ) {
    return this.post<SceneLeaseResponse>(
      `/projects/${projectId}/scenes/${sceneId}/lease/release`,
      { authorId },
    );
  }

  // Blueprints & Schemas
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

  // Entities
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

  // Timeline Events
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

  // Rules & Audit
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

  // Realtime Server-Sent Events (SSE) Stream Listener
  subscribeEvents(
    projectId?: string,
    onEvent?: (event: SSEEventPayload) => void,
  ): () => void {
    if (typeof window === "undefined" || typeof EventSource === "undefined") {
      return () => {};
    }

    const endpoint = projectId
      ? `${this.baseUrl}/projects/${projectId}/events/stream`
      : `${this.baseUrl}/events/stream`;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(endpoint);

      const eventTypes = [
        "CONNECTED",
        "PROJECT_CREATED",
        "PROJECT_UPDATED",
        "PROJECT_DELETED",
        "CHAPTER_CREATED",
        "CHAPTER_UPDATED",
        "CHAPTER_DELETED",
        "SCENE_CREATED",
        "SCENE_UPDATED",
        "SCENE_DELETED",
        "SCENE_LEASE_ACQUIRED",
        "SCENE_LEASE_RELEASED",
        "BLUEPRINT_CREATED",
        "BLUEPRINT_UPDATED",
        "BLUEPRINT_DELETED",
        "ENTITY_CREATED",
        "ENTITY_UPDATED",
        "ENTITY_DELETED",
        "ENTITY_MUTATED",
        "TIMELINE_CHANGED",
        "RULE_CREATED",
        "RULE_UPDATED",
        "RULE_DELETED",
        "AUDIT_OVERRIDDEN",
      ];

      for (const evtName of eventTypes) {
        eventSource.addEventListener(evtName, (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            if (onEvent) {
              onEvent({
                event: evtName,
                projectId,
                payload: data,
                timestamp: new Date().toISOString(),
              });
            }
          } catch {
            // Non-json payload
          }
        });
      }
    } catch {
      // Stream subscription fallback
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
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

export const apiClient = new NovWriteApiClient();
