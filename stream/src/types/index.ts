// ── Shared types used by both client and server ──────────────────────────────

export type ID = string;
export type Timestamp = string; // ISO 8601

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export type Role = 'admin' | 'user' | 'guest';
