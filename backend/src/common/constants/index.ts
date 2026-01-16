// Application constants

export const APP_CONSTANTS = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes in ms
  SYNC_INTERVAL: 5 * 60 * 1000, // 5 minutes in ms
  MAX_STORES_FREE: 2,
  MAX_STORES_PRO: 5,
  MAX_STORES_ENTERPRISE: 10,
};

export const ORDER_STATUS = {
  COMPLETED: 'completed',
  PROCESSING: 'processing',
  PENDING: 'pending',
  ON_HOLD: 'on-hold',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  FAILED: 'failed',
} as const;

export const STOCK_STATUS = {
  IN_STOCK: 'instock',
  OUT_OF_STOCK: 'outofstock',
  ON_BACKORDER: 'onbackorder',
} as const;

export const CACHE_KEYS = {
  DASHBOARD: 'dashboard',
  INVENTORY: 'inventory',
  ORDERS: 'orders',
  PAYMENTS: 'payments',
  PROFITS: 'profits',
  REFUNDS: 'refunds',
} as const;
