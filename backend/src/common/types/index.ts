// Common TypeScript interfaces and types

export interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

export interface IPaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IDateRangeQuery {
  startDate?: Date;
  endDate?: Date;
  period?: 'today' | '7d' | '30d' | '365d' | 'custom';
}

export interface IStoreQuery extends IPaginationQuery {
  storeId?: string;
  storeIds?: string[];
}
