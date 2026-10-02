export interface ApiResponse<T> {
  status: 0 | 1;
  message: string;
  data: T;
}

// Laravel paginator shape
export interface PaginatedResponse<T> {
  current_page: number;
  data: T[];
  last_page: number;
  per_page: number;
  total: number;
}

export type ValidationErrors = Record<string, string[]>;