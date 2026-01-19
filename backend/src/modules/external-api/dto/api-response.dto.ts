import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationDto {
  @ApiProperty({ description: 'Total number of items' })
  total: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Current offset' })
  offset: number;

  @ApiProperty({ description: 'Whether there are more items' })
  hasMore: boolean;
}

export class ApiMetaDto {
  @ApiProperty({ description: 'Unique request ID' })
  requestId: string;

  @ApiProperty({ description: 'Response timestamp' })
  timestamp: string;
}

export class ApiSuccessResponseDto<T> {
  @ApiProperty({ description: 'Success status', example: true })
  success: true;

  @ApiProperty({ description: 'Response data' })
  data: T;

  @ApiPropertyOptional({ description: 'Response metadata', type: ApiMetaDto })
  meta?: ApiMetaDto;
}

export class ApiPaginatedResponseDto<T> {
  @ApiProperty({ description: 'Success status', example: true })
  success: true;

  @ApiProperty({ description: 'Response data' })
  data: {
    items: T[];
    pagination: PaginationDto;
  };

  @ApiPropertyOptional({ description: 'Response metadata', type: ApiMetaDto })
  meta?: ApiMetaDto;
}

export class ApiErrorDetailDto {
  @ApiProperty({ description: 'Error code', example: 'RATE_LIMIT_EXCEEDED' })
  code: string;

  @ApiProperty({ description: 'Error message' })
  message: string;

  @ApiPropertyOptional({ description: 'Additional error details' })
  details?: Record<string, any>;
}

export class ApiErrorResponseDto {
  @ApiProperty({ description: 'Success status', example: false })
  success: false;

  @ApiProperty({ description: 'Error information', type: ApiErrorDetailDto })
  error: ApiErrorDetailDto;

  @ApiPropertyOptional({ description: 'Response metadata', type: ApiMetaDto })
  meta?: ApiMetaDto;
}

// Query DTOs for API endpoints
export class PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Number of items to return', default: 20 })
  limit?: number;

  @ApiPropertyOptional({ description: 'Number of items to skip', default: 0 })
  offset?: number;
}

export class StoreQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by store status' })
  status?: string;
}

export class ProductQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by store ID' })
  storeId?: string;

  @ApiPropertyOptional({ description: 'Search by product name or SKU' })
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by stock status' })
  stockStatus?: string;

  @ApiPropertyOptional({ description: 'Sort field', default: 'name' })
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order', default: 'asc' })
  sortOrder?: 'asc' | 'desc';
}

export class OrderQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by store ID' })
  storeId?: string;

  @ApiPropertyOptional({ description: 'Filter by order status' })
  status?: string;

  @ApiPropertyOptional({ description: 'Start date (ISO string)' })
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO string)' })
  endDate?: string;

  @ApiPropertyOptional({ description: 'Sort field', default: 'orderDate' })
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order', default: 'desc' })
  sortOrder?: 'asc' | 'desc';
}

export class AnalyticsQueryDto {
  @ApiPropertyOptional({
    description: 'Time period',
    enum: ['today', '7d', '30d', '90d', '365d'],
    default: '30d',
  })
  period?: string;

  @ApiPropertyOptional({ description: 'Filter by store ID' })
  storeId?: string;
}
