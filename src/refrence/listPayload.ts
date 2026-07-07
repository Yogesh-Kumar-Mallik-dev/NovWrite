export interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ListPayload<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: Pagination;
}
