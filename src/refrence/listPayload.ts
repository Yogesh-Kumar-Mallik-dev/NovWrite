export interface Pagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface ListPayload<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: Pagination;
}
