export type ApiError = {
  code?: string;
  message: string;
};

export type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T | null;
  error?: ApiError;
};

export type PaginatedResponse<T> = ApiResponse<T> & {
  nextCursor: number | null;
};
