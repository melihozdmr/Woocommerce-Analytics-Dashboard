import { Injectable, ForbiddenException, Inject } from '@nestjs/common';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { PrismaService } from '../../database/prisma.service';
import { InviteStatus } from '@prisma/client';

export interface ProfitSummary {
  totalRevenue: number;
  totalCost: number;
  totalCommission: number;
  totalShippingCost: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  ordersCount: number;
  itemsCount: number;
  avgOrderProfit: number;
  // Period comparison
  previousNetProfit: number;
  profitChange: number;
}

export interface ProductProfit {
  productId: string;
  productName: string;
  sku: string | null;
  imageUrl: string | null;
  salePrice: number;
  purchasePrice: number | null;
  quantitySold: number;
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
  hasPurchasePrice: boolean;
}

export interface OrderProfit {
  orderId: string;
  orderNumber: string;
  orderDate: Date;
  storeName: string;
  customerName: string | null;
  itemsCount: number;
  revenue: number;
  cost: number;
  commission: number;
  shippingCost: number;
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
}

export interface ProfitTrend {
  date: string;
  revenue: number;
  cost: number;
  grossProfit: number;
  netProfit: number;
}

@Injectable()
export class ProfitService {
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  /**
   * Generate cache key
   */
  private getCacheKey(
    method: string,
    companyId: string,
    period: string,
    storeId?: string,
  ): string {
    const parts = ['profit', method, companyId, period];
    if (storeId) parts.push(storeId);
    return parts.join(':');
  }

  /**
   * Check company access
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
   * Get store IDs for company
   */
  private async getCompanyStores(companyId: string) {
    return this.prisma.store.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        commissionRate: true,
        shippingCost: true,
      },
    });
  }

  /**
   * Calculate date range
   */
  private getDateRange(
    period: string,
    customStartDate?: string,
    customEndDate?: string,
  ): { startDate: Date; endDate: Date } {
    if (customStartDate && customEndDate) {
      const startDate = new Date(customStartDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(customEndDate);
      endDate.setHours(23, 59, 59, 999);
      return { startDate, endDate };
    }

    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    switch (period) {
      case 'today':
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
        startDate.setDate(startDate.getDate() - 29);
    }

    return { startDate, endDate };
  }

  /**
   * Get previous period range
   */
  private getPreviousPeriodRange(
    startDate: Date,
    endDate: Date,
  ): { startDate: Date; endDate: Date } {
    const daysDiff = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    const prevEndDate = new Date(startDate);
    prevEndDate.setDate(prevEndDate.getDate() - 1);
    prevEndDate.setHours(23, 59, 59, 999);

    const prevStartDate = new Date(prevEndDate);
    prevStartDate.setDate(prevStartDate.getDate() - daysDiff + 1);
    prevStartDate.setHours(0, 0, 0, 0);

    return { startDate: prevStartDate, endDate: prevEndDate };
  }

  /**
   * Calculate percentage change
   */
  private calculatePercentageChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / Math.abs(previous)) * 100 * 10) / 10;
  }

  /**
   * Get profit summary
   */
  async getProfitSummary(
    companyId: string,
    userId: string,
    period: string = '30d',
    storeId?: string,
    customStartDate?: string,
    customEndDate?: string,
  ): Promise<ProfitSummary> {
    await this.checkCompanyAccess(companyId, userId);

    // Check cache
    const cacheKey = this.getCacheKey('summary', companyId, period, storeId);
    const cached = await this.cacheManager.get<ProfitSummary>(cacheKey);
    if (cached) return cached;

    const stores = await this.getCompanyStores(companyId);
    const storeIds = storeId ? [storeId] : stores.map((s) => s.id);
    const storeMap = new Map(stores.map((s) => [s.id, s]));

    const { startDate, endDate } = this.getDateRange(period, customStartDate, customEndDate);
    const prevRange = this.getPreviousPeriodRange(startDate, endDate);

    // Get completed orders with items
    const orders = await this.prisma.order.findMany({
      where: {
        storeId: { in: storeIds },
        status: { in: ['completed', 'processing'] },
        orderDate: { gte: startDate, lte: endDate },
      },
      include: {
        items: {
          include: {
            product: {
              select: { purchasePrice: true },
            },
          },
        },
      },
    });

    // Previous period orders
    const prevOrders = await this.prisma.order.findMany({
      where: {
        storeId: { in: storeIds },
        status: { in: ['completed', 'processing'] },
        orderDate: { gte: prevRange.startDate, lte: prevRange.endDate },
      },
      include: {
        items: {
          include: {
            product: {
              select: { purchasePrice: true },
            },
          },
        },
      },
    });

    // Calculate current period
    let totalRevenue = 0;
    let totalCost = 0;
    let totalCommission = 0;
    let totalShippingCost = 0;
    let itemsCount = 0;

    for (const order of orders) {
      const store = storeMap.get(order.storeId);
      const commissionRate = Number(store?.commissionRate || 0) / 100;
      const shippingCost = Number(store?.shippingCost || 0);

      const orderRevenue = Number(order.total);
      totalRevenue += orderRevenue;
      totalCommission += orderRevenue * commissionRate;
      totalShippingCost += shippingCost;

      for (const item of order.items) {
        itemsCount += item.quantity;
        const purchasePrice = item.product?.purchasePrice
          ? Number(item.product.purchasePrice)
          : 0;
        totalCost += purchasePrice * item.quantity;
      }
    }

    const grossProfit = totalRevenue - totalCost;
    const netProfit = grossProfit - totalCommission - totalShippingCost;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const avgOrderProfit = orders.length > 0 ? netProfit / orders.length : 0;

    // Calculate previous period net profit
    let prevNetProfit = 0;
    for (const order of prevOrders) {
      const store = storeMap.get(order.storeId);
      const commissionRate = Number(store?.commissionRate || 0) / 100;
      const shippingCost = Number(store?.shippingCost || 0);

      const orderRevenue = Number(order.total);
      let orderCost = 0;

      for (const item of order.items) {
        const purchasePrice = item.product?.purchasePrice
          ? Number(item.product.purchasePrice)
          : 0;
        orderCost += purchasePrice * item.quantity;
      }

      const orderGrossProfit = orderRevenue - orderCost;
      prevNetProfit += orderGrossProfit - (orderRevenue * commissionRate) - shippingCost;
    }

    const result: ProfitSummary = {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      totalCommission: Math.round(totalCommission * 100) / 100,
      totalShippingCost: Math.round(totalShippingCost * 100) / 100,
      grossProfit: Math.round(grossProfit * 100) / 100,
      netProfit: Math.round(netProfit * 100) / 100,
      profitMargin: Math.round(profitMargin * 10) / 10,
      ordersCount: orders.length,
      itemsCount,
      avgOrderProfit: Math.round(avgOrderProfit * 100) / 100,
      previousNetProfit: Math.round(prevNetProfit * 100) / 100,
      profitChange: this.calculatePercentageChange(netProfit, prevNetProfit),
    };

    await this.cacheManager.set(cacheKey, result, this.CACHE_TTL);
    return result;
  }

  /**
   * Get product-based profit analysis
   */
  async getProductProfits(
    companyId: string,
    userId: string,
    period: string = '30d',
    storeId?: string,
    customStartDate?: string,
    customEndDate?: string,
    limit: number = 50,
  ): Promise<ProductProfit[]> {
    await this.checkCompanyAccess(companyId, userId);

    const stores = await this.getCompanyStores(companyId);
    const storeIds = storeId ? [storeId] : stores.map((s) => s.id);
    const storeMap = new Map(stores.map((s) => [s.id, s]));

    const { startDate, endDate } = this.getDateRange(period, customStartDate, customEndDate);

    // Get order items with product info
    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          storeId: { in: storeIds },
          status: { in: ['completed', 'processing'] },
          orderDate: { gte: startDate, lte: endDate },
        },
        productId: { not: null },
      },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            imageUrl: true,
            price: true,
            purchasePrice: true,
            storeId: true,
          },
        },
        order: {
          select: { storeId: true },
        },
      },
    });

    // Group by product
    const productMap = new Map<string, {
      product: typeof orderItems[0]['product'];
      storeId: string;
      quantitySold: number;
      totalRevenue: number;
      totalCost: number;
    }>();

    for (const item of orderItems) {
      if (!item.product) continue;

      const existing = productMap.get(item.product.id);
      if (existing) {
        existing.quantitySold += item.quantity;
        existing.totalRevenue += Number(item.total);
        existing.totalCost += item.product.purchasePrice
          ? Number(item.product.purchasePrice) * item.quantity
          : 0;
      } else {
        productMap.set(item.product.id, {
          product: item.product,
          storeId: item.order.storeId,
          quantitySold: item.quantity,
          totalRevenue: Number(item.total),
          totalCost: item.product.purchasePrice
            ? Number(item.product.purchasePrice) * item.quantity
            : 0,
        });
      }
    }

    // Calculate profits
    const results: ProductProfit[] = [];
    for (const [productId, data] of productMap) {
      const store = storeMap.get(data.storeId);
      const commissionRate = Number(store?.commissionRate || 0) / 100;
      const shippingCostPerItem = Number(store?.shippingCost || 0) / data.quantitySold;

      const grossProfit = data.totalRevenue - data.totalCost;
      const commission = data.totalRevenue * commissionRate;
      const shippingCost = Number(store?.shippingCost || 0);
      const netProfit = grossProfit - commission - shippingCost;
      const profitMargin = data.totalRevenue > 0 ? (netProfit / data.totalRevenue) * 100 : 0;

      results.push({
        productId,
        productName: data.product!.name,
        sku: data.product!.sku,
        imageUrl: data.product!.imageUrl,
        salePrice: Number(data.product!.price),
        purchasePrice: data.product!.purchasePrice ? Number(data.product!.purchasePrice) : null,
        quantitySold: data.quantitySold,
        totalRevenue: Math.round(data.totalRevenue * 100) / 100,
        totalCost: Math.round(data.totalCost * 100) / 100,
        grossProfit: Math.round(grossProfit * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        profitMargin: Math.round(profitMargin * 10) / 10,
        hasPurchasePrice: data.product!.purchasePrice !== null,
      });
    }

    // Sort by net profit descending
    results.sort((a, b) => b.netProfit - a.netProfit);

    return results.slice(0, limit);
  }

  /**
   * Get order-based profit analysis
   */
  async getOrderProfits(
    companyId: string,
    userId: string,
    period: string = '30d',
    storeId?: string,
    customStartDate?: string,
    customEndDate?: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{ orders: OrderProfit[]; total: number; page: number; totalPages: number }> {
    await this.checkCompanyAccess(companyId, userId);

    const stores = await this.getCompanyStores(companyId);
    const storeIds = storeId ? [storeId] : stores.map((s) => s.id);
    const storeMap = new Map(stores.map((s) => [s.id, s]));

    const { startDate, endDate } = this.getDateRange(period, customStartDate, customEndDate);

    const where = {
      storeId: { in: storeIds },
      status: { in: ['completed', 'processing'] },
      orderDate: { gte: startDate, lte: endDate },
    };

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          store: { select: { name: true, commissionRate: true, shippingCost: true } },
          items: {
            include: {
              product: { select: { purchasePrice: true } },
            },
          },
        },
        orderBy: { orderDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    const results: OrderProfit[] = orders.map((order) => {
      const commissionRate = Number(order.store.commissionRate) / 100;
      const shippingCost = Number(order.store.shippingCost);
      const revenue = Number(order.total);

      let cost = 0;
      for (const item of order.items) {
        const purchasePrice = item.product?.purchasePrice
          ? Number(item.product.purchasePrice)
          : 0;
        cost += purchasePrice * item.quantity;
      }

      const commission = revenue * commissionRate;
      const grossProfit = revenue - cost;
      const netProfit = grossProfit - commission - shippingCost;
      const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

      return {
        orderId: order.id,
        orderNumber: order.orderNumber,
        orderDate: order.orderDate,
        storeName: order.store.name,
        customerName: order.customerName,
        itemsCount: order.itemsCount,
        revenue: Math.round(revenue * 100) / 100,
        cost: Math.round(cost * 100) / 100,
        commission: Math.round(commission * 100) / 100,
        shippingCost: Math.round(shippingCost * 100) / 100,
        grossProfit: Math.round(grossProfit * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        profitMargin: Math.round(profitMargin * 10) / 10,
      };
    });

    return {
      orders: results,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get profit trend
   */
  async getProfitTrend(
    companyId: string,
    userId: string,
    period: string = '30d',
    storeId?: string,
    customStartDate?: string,
    customEndDate?: string,
  ): Promise<ProfitTrend[]> {
    await this.checkCompanyAccess(companyId, userId);

    const cacheKey = this.getCacheKey('trend', companyId, period, storeId);
    const cached = await this.cacheManager.get<ProfitTrend[]>(cacheKey);
    if (cached) return cached;

    const stores = await this.getCompanyStores(companyId);
    const storeIds = storeId ? [storeId] : stores.map((s) => s.id);
    const storeMap = new Map(stores.map((s) => [s.id, s]));

    const { startDate, endDate } = this.getDateRange(period, customStartDate, customEndDate);

    const orders = await this.prisma.order.findMany({
      where: {
        storeId: { in: storeIds },
        status: { in: ['completed', 'processing'] },
        orderDate: { gte: startDate, lte: endDate },
      },
      include: {
        items: {
          include: {
            product: { select: { purchasePrice: true } },
          },
        },
      },
      orderBy: { orderDate: 'asc' },
    });

    // Group by date (Turkey timezone)
    const trendMap = new Map<string, { revenue: number; cost: number; commission: number; shipping: number }>();

    // Initialize all dates
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = this.getLocalDateKey(currentDate);
      trendMap.set(dateKey, { revenue: 0, cost: 0, commission: 0, shipping: 0 });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Fill data
    for (const order of orders) {
      const dateKey = this.getLocalDateKey(order.orderDate);
      const existing = trendMap.get(dateKey);
      if (!existing) continue;

      const store = storeMap.get(order.storeId);
      const commissionRate = Number(store?.commissionRate || 0) / 100;
      const shippingCost = Number(store?.shippingCost || 0);
      const revenue = Number(order.total);

      let cost = 0;
      for (const item of order.items) {
        const purchasePrice = item.product?.purchasePrice
          ? Number(item.product.purchasePrice)
          : 0;
        cost += purchasePrice * item.quantity;
      }

      existing.revenue += revenue;
      existing.cost += cost;
      existing.commission += revenue * commissionRate;
      existing.shipping += shippingCost;
    }

    const result: ProfitTrend[] = Array.from(trendMap.entries()).map(([date, data]) => {
      const grossProfit = data.revenue - data.cost;
      const netProfit = grossProfit - data.commission - data.shipping;
      return {
        date,
        revenue: Math.round(data.revenue * 100) / 100,
        cost: Math.round(data.cost * 100) / 100,
        grossProfit: Math.round(grossProfit * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
      };
    });

    await this.cacheManager.set(cacheKey, result, this.CACHE_TTL);
    return result;
  }

  /**
   * Get local date key (Turkey timezone)
   */
  private getLocalDateKey(date: Date): string {
    const turkeyOffset = 3 * 60; // UTC+3
    const localDate = new Date(date.getTime() + turkeyOffset * 60 * 1000);
    return localDate.toISOString().split('T')[0];
  }
}
