export type ApiErrorPayload = {
  type: string;
  message: string;
};

export type Pagination = {
  page: number;
  page_size: number;
  total: number;
  pages: number;
};

export type ApiEnvelope<T> = {
  data: T | null;
  error: ApiErrorPayload | null;
  pagination?: Pagination | null;
};

export type ApiSuccess<T> = {
  data: T;
  pagination?: Pagination | null;
};

export class ApiError extends Error {
  type: string;
  status?: number;

  constructor(message: string, type: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.type = type;
    this.status = status;
  }
}
