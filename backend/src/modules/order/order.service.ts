import { Injectable, ForbiddenException, Inject } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { PrismaService } from '../../database/prisma.service';
import { InviteStatus } from '@prisma/client';

export interface OrderSummary {
  totalOrders: number;
  totalRevenue: number;
  avgOrderValue: number;
  totalItems: number;
  completedOrders: number;
  processingOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
}

export interface OrderTrend {
  date: string;
  orders: number;
  revenue: number;
}

export interface StatusDistribution {
  status: string;
  count: number;
  revenue: number;
}

export interface PaymentMethodDistribution {
  method: string;
  count: number;
  revenue: number;
}

export interface StoreDistribution {
  storeId: string;
  storeName: string;
  count: number;
  revenue: number;
  percentage: number;
}

export interface OrderSummaryWithComparison extends OrderSummary {
  previousTotalOrders: number;
  previousTotalRevenue: number;
  previousAvgOrderValue: number;
  ordersChange: number; // percentage
  revenueChange: number; // percentage
  avgOrderValueChange: number; // percentage
}

export interface RecentOrder {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  customerName: string | null;
  customerEmail: string | null;
  itemsCount: number;
  orderDate: Date;
  storeName: string;
}

@Injectable()
export class OrderService {
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Generate cache key for order queries
   */
  private getCacheKey(
    method: string,
    companyId: string,
    period: string,
    storeId?: string,
    customStartDate?: string,
    customEndDate?: string,
  ): string {
    const parts = ['order', method, companyId, period];
    if (storeId) parts.push(storeId);
    if (customStartDate) parts.push(customStartDate);
    if (customEndDate) parts.push(customEndDate);
    return parts.join(':');
  }

  /**
   * Invalidate all order caches for a company
   */
  async invalidateCompanyCache(companyId: string): Promise<void> {
    // With Redis, we could use pattern matching, but with cache-manager
    // we just let the TTL expire. For immediate invalidation, we'd need
    // to track all keys or use Redis directly.
  }

  /**
   * Check if user has access to company
   */
  private async checkCompanyAccess(companyId: string, userId: string) {
    const membership = await this.prisma.companyMember.findFirst({
      where: {
        companyId,
        userId,
        inviteStatus: InviteStatus.ACCEPTED,
      },
    });

    if (!membership) {
      throw new ForbiddenException('Bu şirkete erişim yetkiniz yok');
    }

    return membership;
  }

  /**
   * Get store IDs for a company
   */
  private async getCompanyStoreIds(companyId: string): Promise<string[]> {
    const stores = await this.prisma.store.findMany({
      where: { companyId },
      select: { id: true },
    });
    return stores.map((s) => s.id);
  }

  /**
   * Calculate date range based on period
   */
  private getDateRange(period: string): { startDate: Date; endDate: Date } {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    switch (period) {
      case 'today':
        // Start of today
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 6);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 29);
        break;
      case '90d':
        startDate.setDate(startDate.getDate() - 89);
        break;
      case '365d':
        startDate.setDate(startDate.getDate() - 364);
        break;
      default:
        startDate.setDate(startDate.getDate() - 29); // Default 30 days
    }

    return { startDate, endDate };
  }

  /**
   * Calculate previous period date range for comparison
   */
  private getPreviousPeriodRange(period: string): { startDate: Date; endDate: Date } {
    const currentRange = this.getDateRange(period);
    const daysDiff = Math.ceil(
      (currentRange.endDate.getTime() - currentRange.startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    const endDate = new Date(currentRange.startDate);
    endDate.setDate(endDate.getDate() - 1);
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - daysDiff + 1);
    startDate.setHours(0, 0, 0, 0);

    return { startDate, endDate };
  }

  /**
   * Calculate percentage change
   */
  private calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100 * 10) / 10;
  }

  /**
   * Get order summary for a company with period-over-period comparison
   */
  async getOrderSummary(
    companyId: string,
    userId: string,
    period: string = '30d',
    storeId?: string,
    customStartDate?: string,
    customEndDate?: string,
  ): Promise<OrderSummaryWithComparison> {
    await this.checkCompanyAccess(companyId, userId);

    // Check cache
    const cacheKey = this.getCacheKey('summary', companyId, period, storeId, customStartDate, customEndDate);
    const cached = await this.cacheManager.get<OrderSummaryWithComparison>(cacheKey);
    if (cached) {
      return cached;
    }

    const storeIds = storeId
      ? [storeId]
      : await this.getCompanyStoreIds(companyId);

    let startDate: Date;
    let endDate: Date;
    let prevStartDate: Date;
    let prevEndDate: Date;

    if (customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999);

      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      prevEndDate = new Date(startDate);
      prevEndDate.setDate(prevEndDate.getDate() - 1);
      prevEndDate.setHours(23, 59, 59, 999);
      prevStartDate = new Date(prevEndDate);
      prevStartDate.setDate(prevStartDate.getDate() - daysDiff + 1);
      prevStartDate.setHours(0, 0, 0, 0);
    } else {
      const range = this.getDateRange(period);
      startDate = range.startDate;
      endDate = range.endDate;
      const prevRange = this.getPreviousPeriodRange(period);
      prevStartDate = prevRange.startDate;
      prevEndDate = prevRange.endDate;
    }

    // Current period orders
    const orders = await this.prisma.order.findMany({
      where: {
        storeId: { in: storeIds },
        orderDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        total: true,
        itemsCount: true,
        status: true,
      },
    });

    // Previous period orders
    const previousOrders = await this.prisma.order.findMany({
      where: {
        storeId: { in: storeIds },
        orderDate: {
          gte: prevStartDate,
          lte: prevEndDate,
        },
      },
      select: {
        total: true,
        itemsCount: true,
        status: true,
      },
    });

    // Current period calculations
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce(
      (sum, o) => sum + Number(o.total),
      0,
    );
    const totalItems = orders.reduce((sum, o) => sum + o.itemsCount, 0);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const completedOrders = orders.filter(
      (o) => o.status === 'completed',
    ).length;
    const processingOrders = orders.filter(
      (o) => o.status === 'processing',
    ).length;
    const cancelledOrders = orders.filter(
      (o) => o.status === 'cancelled',
    ).length;
    const refundedOrders = orders.filter(
      (o) => o.status === 'refunded',
    ).length;

    // Previous period calculations
    const previousTotalOrders = previousOrders.length;
    const previousTotalRevenue = previousOrders.reduce(
      (sum, o) => sum + Number(o.total),
      0,
    );
    const previousAvgOrderValue = previousTotalOrders > 0
      ? previousTotalRevenue / previousTotalOrders
      : 0;

    const result: OrderSummaryWithComparison = {
      totalOrders,
      totalRevenue,
      avgOrderValue,
      totalItems,
      completedOrders,
      processingOrders,
      cancelledOrders,
      refundedOrders,
      previousTotalOrders,
      previousTotalRevenue,
      previousAvgOrderValue,
      ordersChange: this.calculatePercentageChange(totalOrders, previousTotalOrders),
      revenueChange: this.calculatePercentageChange(totalRevenue, previousTotalRevenue),
      avgOrderValueChange: this.calculatePercentageChange(avgOrderValue, previousAvgOrderValue),
    };

    // Store in cache
    await this.cacheManager.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  /**
   * Get ISO week number
   */
  private getWeekKey(date: Date): string {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const yearStart = new Date(d.getFullYear(), 0, 1);
    const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    return `${d.getFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
  }

  /**
   * Get order trend (daily or weekly based on period)
   */
  async getOrderTrend(
    companyId: string,
    userId: string,
    period: string = '30d',
    storeId?: string,
    customStartDate?: string,
    customEndDate?: string,
  ): Promise<OrderTrend[]> {
    await this.checkCompanyAccess(companyId, userId);

    // Check cache
    const cacheKey = this.getCacheKey('trend', companyId, period, storeId, customStartDate, customEndDate);
    const cached = await this.cacheManager.get<OrderTrend[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const storeIds = storeId
      ? [storeId]
      : await this.getCompanyStoreIds(companyId);

    let startDate: Date;
    let endDate: Date;

    if (customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999);
    } else {
      const range = this.getDateRange(period);
      startDate = range.startDate;
      endDate = range.endDate;
    }

    // Use weekly granularity for periods > 30 days
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const useWeekly = daysDiff > 30;

    const orders = await this.prisma.order.findMany({
      where: {
        storeId: { in: storeIds },
        orderDate: {
          gte: startDate,
          lte: endDate,
        },
        // Only count completed and processing orders for revenue
        status: { in: ['completed', 'processing'] },
      },
      select: {
        total: true,
        orderDate: true,
      },
    });

    // Group by date or week
    const trendMap = new Map<string, { orders: number; revenue: number }>();

    if (useWeekly) {
      // Weekly grouping
      for (const order of orders) {
        const weekKey = this.getWeekKey(order.orderDate);
        const existing = trendMap.get(weekKey) || { orders: 0, revenue: 0 };
        existing.orders += 1;
        existing.revenue += Number(order.total);
        trendMap.set(weekKey, existing);
      }
    } else {
      // Daily grouping - Initialize all dates in range
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const dateKey = currentDate.toISOString().split('T')[0];
        trendMap.set(dateKey, { orders: 0, revenue: 0 });
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Fill in actual data
      for (const order of orders) {
        const dateKey = order.orderDate.toISOString().split('T')[0];
        const existing = trendMap.get(dateKey);
        if (existing) {
          existing.orders += 1;
          existing.revenue += Number(order.total);
        }
      }
    }

    // Convert to array
    const result = Array.from(trendMap.entries())
      .map(([date, data]) => ({
        date,
        orders: data.orders,
        revenue: data.revenue,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Store in cache
    await this.cacheManager.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  /**
   * Get order status distribution
   */
  async getStatusDistribution(
    companyId: string,
    userId: string,
    period: string = '30d',
    storeId?: string,
    customStartDate?: string,
    customEndDate?: string,
  ): Promise<StatusDistribution[]> {
    await this.checkCompanyAccess(companyId, userId);

    // Check cache
    const cacheKey = this.getCacheKey('status', companyId, period, storeId, customStartDate, customEndDate);
    const cached = await this.cacheManager.get<StatusDistribution[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const storeIds = storeId
      ? [storeId]
      : await this.getCompanyStoreIds(companyId);

    let startDate: Date;
    let endDate: Date;

    if (customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999);
    } else {
      const range = this.getDateRange(period);
      startDate = range.startDate;
      endDate = range.endDate;
    }

    const orders = await this.prisma.order.groupBy({
      by: ['status'],
      where: {
        storeId: { in: storeIds },
        orderDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _count: { id: true },
      _sum: { total: true },
    });

    const statusLabels: Record<string, string> = {
      completed: 'Tamamlandı',
      processing: 'İşleniyor',
      pending: 'Beklemede',
      cancelled: 'İptal',
      refunded: 'İade',
      failed: 'Başarısız',
      'on-hold': 'Bekletiliyor',
    };

    const result = orders.map((o) => ({
      status: statusLabels[o.status] || o.status,
      count: o._count.id,
      revenue: Number(o._sum.total) || 0,
    }));

    // Store in cache
    await this.cacheManager.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  /**
   * Get payment method distribution
   */
  async getPaymentMethodDistribution(
    companyId: string,
    userId: string,
    period: string = '30d',
    storeId?: string,
    customStartDate?: string,
    customEndDate?: string,
  ): Promise<PaymentMethodDistribution[]> {
    await this.checkCompanyAccess(companyId, userId);

    // Check cache
    const cacheKey = this.getCacheKey('payment', companyId, period, storeId, customStartDate, customEndDate);
    const cached = await this.cacheManager.get<PaymentMethodDistribution[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const storeIds = storeId
      ? [storeId]
      : await this.getCompanyStoreIds(companyId);

    let startDate: Date;
    let endDate: Date;

    if (customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999);
    } else {
      const range = this.getDateRange(period);
      startDate = range.startDate;
      endDate = range.endDate;
    }

    const orders = await this.prisma.order.groupBy({
      by: ['paymentMethod'],
      where: {
        storeId: { in: storeIds },
        orderDate: {
          gte: startDate,
          lte: endDate,
        },
        status: { in: ['completed', 'processing'] },
      },
      _count: { id: true },
      _sum: { total: true },
    });

    const methodLabels: Record<string, string> = {
      bacs: 'Banka Havalesi',
      cod: 'Kapıda Ödeme',
      cheque: 'Çek',
      paypal: 'PayPal',
      stripe: 'Kredi Kartı',
      credit_card: 'Kredi Kartı',
      iyzico: 'iyzico',
      other: 'Diğer',
    };

    const result = orders.map((o) => ({
      method: methodLabels[o.paymentMethod || 'other'] || o.paymentMethod || 'Bilinmiyor',
      count: o._count.id,
      revenue: Number(o._sum.total) || 0,
    }));

    // Store in cache
    await this.cacheManager.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  /**
   * Get store distribution (orders by store)
   */
  async getStoreDistribution(
    companyId: string,
    userId: string,
    period: string = '30d',
    customStartDate?: string,
    customEndDate?: string,
  ): Promise<StoreDistribution[]> {
    await this.checkCompanyAccess(companyId, userId);

    // Check cache
    const cacheKey = this.getCacheKey('store', companyId, period, undefined, customStartDate, customEndDate);
    const cached = await this.cacheManager.get<StoreDistribution[]>(cacheKey);
    if (cached) {
      return cached;
    }

    let startDate: Date;
    let endDate: Date;

    if (customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999);
    } else {
      const range = this.getDateRange(period);
      startDate = range.startDate;
      endDate = range.endDate;
    }

    // Get all stores for the company with their order stats
    const stores = await this.prisma.store.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        orders: {
          where: {
            orderDate: {
              gte: startDate,
              lte: endDate,
            },
            status: { in: ['completed', 'processing'] },
          },
          select: {
            total: true,
          },
        },
      },
    });

    const totalRevenue = stores.reduce(
      (sum, store) =>
        sum + store.orders.reduce((s, o) => s + Number(o.total), 0),
      0,
    );

    const result = stores.map((store) => {
      const storeRevenue = store.orders.reduce((s, o) => s + Number(o.total), 0);
      return {
        storeId: store.id,
        storeName: store.name,
        count: store.orders.length,
        revenue: storeRevenue,
        percentage: totalRevenue > 0 ? Math.round((storeRevenue / totalRevenue) * 100 * 10) / 10 : 0,
      };
    }).sort((a, b) => b.revenue - a.revenue);

    // Store in cache
    await this.cacheManager.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  /**
   * Get recent orders
   */
  async getRecentOrders(
    companyId: string,
    userId: string,
    limit: number = 10,
    storeId?: string,
  ): Promise<RecentOrder[]> {
    await this.checkCompanyAccess(companyId, userId);

    const storeIds = storeId
      ? [storeId]
      : await this.getCompanyStoreIds(companyId);

    const orders = await this.prisma.order.findMany({
      where: {
        storeId: { in: storeIds },
      },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        customerName: true,
        customerEmail: true,
        itemsCount: true,
        orderDate: true,
        store: {
          select: { name: true },
        },
      },
      orderBy: { orderDate: 'desc' },
      take: limit,
    });

    return orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      status: o.status,
      total: Number(o.total),
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      itemsCount: o.itemsCount,
      orderDate: o.orderDate,
      storeName: o.store.name,
    }));
  }

  /**
   * Get paginated orders list
   */
  async getOrders(
    companyId: string,
    userId: string,
    options: {
      page?: number;
      limit?: number;
      status?: string;
      storeId?: string;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      startDate?: string;
      endDate?: string;
    } = {},
  ) {
    await this.checkCompanyAccess(companyId, userId);

    const {
      page = 1,
      limit = 20,
      status,
      storeId,
      search,
      sortBy = 'orderDate',
      sortOrder = 'desc',
      startDate,
      endDate,
    } = options;

    const storeIds = storeId
      ? [storeId]
      : await this.getCompanyStoreIds(companyId);

    const where: any = {
      storeId: { in: storeIds },
    };

    if (status) {
      where.status = status;
    }

    // Date filtering
    if (startDate || endDate) {
      where.orderDate = {};
      if (startDate) {
        where.orderDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.orderDate.lte = new Date(endDate);
      }
    }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        select: {
          id: true,
          orderNumber: true,
          status: true,
          total: true,
          subtotal: true,
          totalTax: true,
          shippingTotal: true,
          discountTotal: true,
          customerName: true,
          customerEmail: true,
          paymentMethod: true,
          itemsCount: true,
          orderDate: true,
          store: {
            select: { id: true, name: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders: orders.map((o) => ({
        ...o,
        total: Number(o.total),
        subtotal: Number(o.subtotal),
        totalTax: Number(o.totalTax),
        shippingTotal: Number(o.shippingTotal),
        discountTotal: Number(o.discountTotal),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}
