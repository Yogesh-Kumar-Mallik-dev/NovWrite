/**
 * @file apiClient.ts
 * @description Standardized HTTP REST API client for NovWrite Web/Desktop frontends.
 * Adheres to Version 2.4 REST API guidelines, RFC 7807 problem details, and paginated response envelopes.
 * Block Standard: BLOCK_WEB_API_CLIENT_001
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

  constructor(baseUrl: string = "/api/v1") {
    this.baseUrl = baseUrl;
  }

  /**
   * Builds standardized query string with pagination parameters.
   */
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

  /**
   * Executes a GET request expecting a paginated response envelope.
   */
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

    const json = await response.json();
    return json as PaginatedApiResponse<T>;
  }

  /**
   * Executes a GET request expecting a single item response envelope.
   */
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

    const json = await response.json();
    return json as SingleApiResponse<T>;
  }

  /**
   * Parses RFC 7807 problem details from failed response.
   */
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
